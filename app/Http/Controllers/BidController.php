<?php

namespace App\Http\Controllers;

use App\Models\Bid;
use App\Models\GigJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = auth()->user();

        if ($user->isFreelancer()) {
            // Show freelancer's bids
            $bids = Bid::with(['job.employer'])
                ->where('freelancer_id', $user->id)
                ->latest()
                ->paginate(10);
        } else {
            // Show bids on employer's jobs
            $bids = Bid::with(['job', 'freelancer'])
                ->whereHas('job', function ($query) use ($user) {
                    $query->where('employer_id', $user->id);
                })
                ->latest()
                ->paginate(10);
        }

        return Inertia::render('Bids/Index', [
            'bids' => $bids,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_id' => 'required|exists:gig_jobs,id',
            'bid_amount' => 'required|numeric|min:0',
            'proposal_message' => 'required|string|min:50',
            'estimated_days' => 'required|integer|min:1',
        ]);

        $job = GigJob::findOrFail($validated['job_id']);

        // Check if job is still open
        if (!$job->isOpen()) {
            return back()->withErrors(['job' => 'This job is no longer accepting bids.']);
        }

        // Check if user is a freelancer
        if (!auth()->user()->isFreelancer()) {
            return back()->withErrors(['user' => 'Only freelancers can submit bids.']);
        }

        // Check if freelancer already bid on this job
        $existingBid = Bid::where('job_id', $job->id)
            ->where('freelancer_id', auth()->id())
            ->first();

        if ($existingBid) {
            return back()->withErrors(['bid' => 'You have already submitted a bid for this job.']);
        }

        $validated['freelancer_id'] = auth()->id();

        Bid::create($validated);

        return redirect()->route('jobs.show', $job)
            ->with('success', 'Your bid has been submitted successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Bid $bid): Response
    {
        $bid->load(['job.employer', 'freelancer']);

        // Check if user can view this bid
        $user = auth()->user();
        if ($bid->freelancer_id !== $user->id && $bid->job->employer_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Bids/Show', [
            'bid' => $bid,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bid $bid)
    {
        try {
            \Log::info('Bid update request received', [
                'bid_id' => $bid->id,
                'request_data' => $request->all(),
                'user_id' => auth()->id(),
                'job_employer_id' => $bid->job->employer_id
            ]);

            $validated = $request->validate([
                'status' => 'required|in:accepted,rejected',
            ]);

            // Only job employer can update bid status
            if ($bid->job->employer_id !== auth()->id()) {
                \Log::warning('Unauthorized bid update attempt', [
                    'user_id' => auth()->id(),
                    'bid_id' => $bid->id,
                    'job_employer_id' => $bid->job->employer_id
                ]);
                return back()->with('error', 'Unauthorized action.');
            }

            \Log::info('Bid status update', [
                'bid_id' => $bid->id,
                'old_status' => $bid->status,
                'new_status' => $validated['status']
            ]);

            \DB::beginTransaction();
            try {
                // If accepting a bid, reject all other bids for this job
                if ($validated['status'] === 'accepted') {
                    Bid::where('job_id', $bid->job_id)
                        ->where('id', '!=', $bid->id)
                        ->update(['status' => 'rejected']);

                    // Update job status to in_progress
                    $bid->job->update(['status' => 'in_progress']);

                    // Calculate platform fee and net amount
                    $platformFee = $bid->bid_amount * 0.05; // 5% platform fee
                    $netAmount = $bid->bid_amount - $platformFee;

                    // Create project
                    $project = \App\Models\Project::create([
                        'job_id' => $bid->job_id,
                        'client_id' => $bid->job->employer_id,
                        'freelancer_id' => $bid->freelancer_id,
                        'bid_id' => $bid->id,
                        'agreed_amount' => $bid->bid_amount,
                        'platform_fee' => $platformFee,
                        'net_amount' => $netAmount,
                        'status' => 'active',
                        'started_at' => now(),
                    ]);

                    $bid->update($validated);

                    \DB::commit();

                    \Log::info('Project created successfully', [
                        'project_id' => $project->id,
                        'bid_id' => $bid->id
                    ]);

                    if ($request->wantsJson()) {
                        return response()->json([
                            'success' => true,
                            'redirect' => route('projects.show', $project)
                        ]);
                    }

                    return redirect()->route('projects.show', $project)
                        ->with('success', 'Bid accepted! Project created. Please proceed with payment to start the work.');
                }

                $bid->update($validated);
                \DB::commit();

                \Log::info('Bid updated successfully', [
                    'bid_id' => $bid->id,
                    'status' => $validated['status']
                ]);

                if ($request->wantsJson()) {
                    return response()->json(['success' => true]);
                }

                return back()->with('success', 'Bid status updated successfully!');
            } catch (\Exception $e) {
                \DB::rollBack();
                \Log::error('Database transaction failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                if ($request->wantsJson()) {
                    return response()->json(['error' => 'Failed to update bid status. Please try again.'], 500);
                }
                
                return back()->with('error', 'Failed to update bid status. Please try again.');
            }
        } catch (\Exception $e) {
            \Log::error('Unexpected error in bid update', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson()) {
                return response()->json(['error' => 'An unexpected error occurred. Please try again.'], 500);
            }
            
            return back()->with('error', 'An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bid $bid)
    {
        // Only freelancer can withdraw their own bid
        if ($bid->freelancer_id !== auth()->id()) {
            abort(403);
        }

        // Can only withdraw pending bids
        if (!$bid->isPending()) {
            return back()->withErrors(['bid' => 'You can only withdraw pending bids.']);
        }

        $bid->update(['status' => 'withdrawn']);

        return back()->with('success', 'Bid withdrawn successfully!');
    }
}
