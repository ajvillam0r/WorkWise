<?php

namespace App\Http\Controllers;

use App\Models\Bid;
use App\Models\GigJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        $validated = $request->validate([
            'status' => 'required|in:accepted,rejected',
        ]);

        // Only job employer can update bid status
        if ($bid->job->employer_id !== auth()->id()) {
            abort(403);
        }

        // If accepting a bid, reject all other bids for this job
        if ($validated['status'] === 'accepted') {
            Bid::where('job_id', $bid->job_id)
                ->where('id', '!=', $bid->id)
                ->update(['status' => 'rejected']);

            // Update job status to in_progress
            $bid->job->update(['status' => 'in_progress']);
        }

        $bid->update($validated);

        return back()->with('success', 'Bid status updated successfully!');
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
