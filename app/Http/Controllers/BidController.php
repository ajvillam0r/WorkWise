<?php

namespace App\Http\Controllers;

use App\Models\Bid;
use App\Models\GigJob;
use App\Services\ContractService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\Transaction;

class BidController extends Controller
{
    protected ContractService $contractService;

    public function __construct(ContractService $contractService)
    {
        $this->contractService = $contractService;
    }
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
        // Validate request
        $request->validate([
            'status' => 'required|in:accepted,rejected'
        ]);

        // Only job owner can accept/reject bids
        if ($bid->job->employer_id !== auth()->id()) {
            return back()->withErrors(['error' => 'You are not authorized to perform this action.']);
        }

        // Can only update pending bids
        if (!$bid->isPending()) {
            return back()->withErrors(['error' => 'You can only update pending bids.']);
        }

        try {
            DB::beginTransaction();

            if ($request->status === 'accepted') {
                // Check client balance
                $client = auth()->user();
                if ($client->escrow_balance < $bid->bid_amount) {
                    throw new \Exception('Insufficient escrow balance.');
                }

                // Reject other bids
                Bid::where('job_id', $bid->job_id)
                    ->where('id', '!=', $bid->id)
                    ->update(['status' => 'rejected']);

                // Update job status
                $bid->job->update(['status' => 'in_progress']);

                // Calculate fees
                $platformFee = $bid->bid_amount * 0.05; // 5% platform fee
                $netAmount = $bid->bid_amount - $platformFee;

                // Create project
                $project = Project::create([
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

                // Deduct from client balance
                $client->decrement('escrow_balance', $bid->bid_amount);

                // Create transaction record
                Transaction::create([
                    'project_id' => $project->id,
                    'payer_id' => $client->id,
                    'payee_id' => $bid->freelancer_id,
                    'amount' => $bid->bid_amount,
                    'platform_fee' => $platformFee,
                    'net_amount' => $netAmount,
                    'type' => 'escrow',
                    'status' => 'completed',
                    'stripe_payment_intent_id' => 'escrow_' . time(),
                    'stripe_charge_id' => 'charge_' . time(),
                    'description' => 'Escrow payment for project #' . $project->id,
                    'processed_at' => now(),
                ]);

                // Create contract
                $contract = $this->contractService->createContractFromBid($project, $bid);

                // Update bid status
                $bid->update([
                    'status' => 'accepted',
                    'accepted_at' => now()
                ]);

                DB::commit();

                // Return with success and redirect to contract
                return back()->with([
                    'success' => 'Proposal accepted successfully!',
                    'redirect' => route('contracts.sign', $contract->id)
                ]);

            } else {
                // Just update status to rejected
                $bid->update(['status' => 'rejected']);
                DB::commit();

                return back()->with('success', 'Proposal declined successfully.');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bid acceptance failed', [
                'bid_id' => $bid->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['error' => 'Failed to update bid status: ' . $e->getMessage()]);
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
