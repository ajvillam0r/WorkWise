<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects for the authenticated user
     */
    public function index(): Response
    {
        $user = auth()->user();

        if ($user->isEmployer()) {
            $projects = Project::where('employer_id', $user->id)
                ->with(['job', 'gigWorker', 'transactions'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        } else {
            $projects = Project::where('gig_worker_id', $user->id)
                ->with(['job', 'employer', 'transactions'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects
        ]);
    }

    /**
     * Display the specified project
     */
    public function show(Project $project): Response
    {
        $user = auth()->user();

        // Check if user is authorized to view this project
        if ($project->employer_id !== $user->id && $project->gig_worker_id !== $user->id) {
            abort(403);
        }

        $project->load([
            'job',
            'employer',
            'gigWorker',
            'transactions',
            'messages' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            }
        ]);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'isEmployer' => $user->isEmployer(),
            'hasPayment' => $project->transactions()->where('type', 'escrow')->where('status', 'completed')->exists(),
            'canReview' => $project->isCompleted() && !$project->reviews()->where('reviewer_id', $user->id)->exists()
        ]);
    }

    /**
     * Mark project as completed
     */
    public function complete(Request $request, Project $project)
    {
        // Ensure user is the gig worker
        if ($project->gig_worker_id !== auth()->id()) {
            return back()->with('error', 'Only the gig worker can mark a project as complete.');
        }

        // Validate request
        try {
            $validated = $request->validate([
                'completion_notes' => 'required|string|max:1000'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        try {
            // Check if project is already completed
            if ($project->isCompleted()) {
                return back()->with('error', 'Project is already marked as complete.');
            }

            // Update project
            $project->update([
                'status' => 'completed',
                'completed_at' => now(),
                'completion_notes' => $validated['completion_notes']
            ]);

            return back()->with('success', 'Project marked as complete! The employer will be notified to review and approve your work. Once approved, you can leave a review for this project.');

        } catch (\Exception $e) {
            \Log::error('Failed to complete project', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to complete project. Please try again.');
        }
    }

    /**
     * Approve completed project (employer only)
     */
    public function approve(Project $project)
    {
        // Only employer can approve
        if ($project->employer_id !== auth()->id()) {
            return back()->with('error', 'Only the employer can approve project completion.');
        }

        if (!$project->isCompleted()) {
            return back()->withErrors(['project' => 'Project must be completed first.']);
        }

        try {
            $project->update([
                'employer_approved' => true,
                'approved_at' => now()
            ]);

            // Automatically release payment upon approval
            $paymentService = app(\App\Services\PaymentService::class);
            $paymentResult = $paymentService->releasePayment($project);

            \Log::info('Payment release attempt', [
                'project_id' => $project->id,
                'payment_result' => $paymentResult
            ]);

            if ($paymentResult['success']) {
                return back()->with('success', 'Project approved and payment automatically released to gig worker! You can now leave a review for this project.');
            } else {
                \Log::warning('Project approved but payment release failed', [
                    'project_id' => $project->id,
                    'payment_error' => $paymentResult['error'] ?? 'Unknown error'
                ]);
                return back()->with('success', 'Project approved! Payment release is being processed. You can now leave a review for this project.');
            }
        } catch (\Exception $e) {
            \Log::error('Failed to approve project', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);
            return back()->with('error', 'Failed to approve project. Please try again.');
        }
    }

    /**
     * Request revision
     */
    public function requestRevision(Request $request, Project $project)
    {
        // Only employer can request revision
        if ($project->employer_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'revision_notes' => 'required|string|max:1000'
        ]);

        // Add revision to milestones
        $milestones = $project->milestones ?? [];
        $milestones[] = [
            'type' => 'revision_requested',
            'notes' => $request->revision_notes,
            'requested_at' => now()->toISOString(),
            'requested_by' => auth()->id()
        ];

        $project->update([
            'status' => 'active', // Back to active for revisions
            'milestones' => $milestones
        ]);

        return back()->with('success', 'Revision requested. The gig worker has been notified.');
    }

    /**
     * Cancel project
     */
    public function cancel(Request $request, Project $project)
    {
        // Only employer can cancel, and only if no payment released
        if ($project->employer_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($project->payment_released) {
            return back()->withErrors(['project' => 'Cannot cancel project after payment has been released.']);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|max:500'
        ]);

        $project->update([
            'status' => 'cancelled',
            'completion_notes' => 'Cancelled by employer: ' . $request->cancellation_reason
        ]);

        return back()->with('success', 'Project cancelled. Refund will be processed if payment was made.');
    }

    /**
     * Submit review for project
     */
    public function review(Request $request, Project $project)
    {
        // Ensure user is involved in this project
        if ($project->employer_id !== auth()->id() && $project->gig_worker_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Ensure project is completed
        if (!$project->isCompleted()) {
            return back()->withErrors(['review' => 'Project must be completed before leaving a review.']);
        }

        // Ensure user hasn't already reviewed
        if ($project->reviews()->where('reviewer_id', auth()->id())->exists()) {
            return back()->withErrors(['review' => 'You have already reviewed this project.']);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'criteria_ratings' => 'nullable|array',
            'criteria_ratings.communication' => 'nullable|integer|min:1|max:5',
            'criteria_ratings.quality' => 'nullable|integer|min:1|max:5',
            'criteria_ratings.timeliness' => 'nullable|integer|min:1|max:5',
        ]);

        // Determine who is being reviewed
        $revieweeId = auth()->id() === $project->employer_id
            ? $project->gig_worker_id
            : $project->employer_id;

        Review::create([
            'project_id' => $project->id,
            'reviewer_id' => auth()->id(),
            'reviewee_id' => $revieweeId,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'criteria_ratings' => $request->criteria_ratings,
        ]);

        return back()->with('success', 'Review submitted successfully!');
    }
}
