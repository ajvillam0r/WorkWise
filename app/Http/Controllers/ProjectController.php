<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Review;
use Illuminate\Http\Request;
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

        if ($user->isClient()) {
            $projects = Project::where('client_id', $user->id)
                ->with(['job', 'freelancer', 'transactions'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        } else {
            $projects = Project::where('freelancer_id', $user->id)
                ->with(['job', 'client', 'transactions'])
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
        // Ensure user is involved in this project
        if ($project->client_id !== auth()->id() && $project->freelancer_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $project->load([
            'job',
            'client',
            'freelancer',
            'acceptedBid',
            'transactions',
            'messages.sender',
            'reviews.reviewer'
        ]);

        // Check if payment exists
        $hasPayment = $project->transactions()
            ->where('type', 'escrow')
            ->where('status', 'completed')
            ->exists();

        // Check if user can leave review
        $canReview = $project->isCompleted() &&
                    !$project->reviews()->where('reviewer_id', auth()->id())->exists();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'hasPayment' => $hasPayment,
            'canReview' => $canReview,
            'isClient' => auth()->id() === $project->client_id
        ]);
    }

    /**
     * Mark project as completed
     */
    public function complete(Request $request, Project $project)
    {
        // Only freelancer can mark as completed
        if ($project->freelancer_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'completion_notes' => 'nullable|string|max:1000'
        ]);

        $project->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completion_notes' => $request->completion_notes
        ]);

        return back()->with('success', 'Project marked as completed! Waiting for client approval.');
    }

    /**
     * Approve completed project (client only)
     */
    public function approve(Project $project)
    {
        // Only client can approve
        if ($project->client_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if (!$project->isCompleted()) {
            return back()->withErrors(['project' => 'Project must be completed first.']);
        }

        // Project is already completed, this just confirms client satisfaction
        return back()->with('success', 'Project approved! You can now release payment and leave a review.');
    }

    /**
     * Request revision
     */
    public function requestRevision(Request $request, Project $project)
    {
        // Only client can request revision
        if ($project->client_id !== auth()->id()) {
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

        return back()->with('success', 'Revision requested. The freelancer has been notified.');
    }

    /**
     * Cancel project
     */
    public function cancel(Request $request, Project $project)
    {
        // Only client can cancel, and only if no payment released
        if ($project->client_id !== auth()->id()) {
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
            'completion_notes' => 'Cancelled by client: ' . $request->cancellation_reason
        ]);

        return back()->with('success', 'Project cancelled. Refund will be processed if payment was made.');
    }

    /**
     * Submit review for project
     */
    public function review(Request $request, Project $project)
    {
        // Ensure user is involved in this project
        if ($project->client_id !== auth()->id() && $project->freelancer_id !== auth()->id()) {
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
        $revieweeId = auth()->id() === $project->client_id
            ? $project->freelancer_id
            : $project->client_id;

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
