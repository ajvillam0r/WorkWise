<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService
    ) {}

    /**
     * Show payment page for project
     */
    public function show(Project $project): Response
    {
        // Ensure user is the client for this project
        if ($project->client_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('Payment/Show', [
            'project' => $project->load(['job', 'freelancer', 'acceptedBid']),
            'testCards' => $this->paymentService->getTestCards(),
            'stripeKey' => config('services.stripe.key')
        ]);
    }

    /**
     * Create payment intent for escrow
     */
    public function createPaymentIntent(Request $request, Project $project)
    {
        // Ensure user is the client for this project
        if ($project->client_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check if payment already exists
        $existingTransaction = $project->transactions()
            ->where('type', 'escrow')
            ->where('status', 'completed')
            ->first();

        if ($existingTransaction) {
            return response()->json([
                'success' => false,
                'error' => 'Payment already completed for this project'
            ]);
        }

        $result = $this->paymentService->createEscrowPayment($project);

        return response()->json($result);
    }

    /**
     * Confirm payment
     */
    public function confirmPayment(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string'
        ]);

        $result = $this->paymentService->confirmEscrowPayment($request->payment_intent_id);

        if ($result['success']) {
            return redirect()->route('projects.show', ['project' => $request->project_id])
                ->with('success', 'Payment completed successfully! Funds are now in escrow.');
        }

        return back()->withErrors(['payment' => $result['error']]);
    }

    /**
     * Release payment to freelancer
     */
    public function releasePayment(Request $request, Project $project)
    {
        // Ensure user is the client for this project
        if ($project->client_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Ensure project is completed
        if (!$project->isCompleted()) {
            return back()->withErrors(['payment' => 'Project must be completed before releasing payment']);
        }

        $result = $this->paymentService->releasePayment($project);

        if ($result['success']) {
            return back()->with('success', "Payment of $" . number_format($result['amount'], 2) . " released to freelancer!");
        }

        return back()->withErrors(['payment' => $result['error']]);
    }

    /**
     * Refund payment to client
     */
    public function refundPayment(Request $request, Project $project)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        // Ensure user is authorized (client or admin)
        if ($project->client_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403, 'Unauthorized');
        }

        $result = $this->paymentService->refundPayment($project, $request->reason);

        if ($result['success']) {
            return back()->with('success', 'Payment refunded successfully!');
        }

        return back()->withErrors(['payment' => $result['error']]);
    }

    /**
     * Show payment history
     */
    public function history(): Response
    {
        $transactions = $this->paymentService->getPaymentHistory(auth()->id());

        // Calculate summary stats
        $totalEarned = collect($transactions)
            ->where('is_incoming', true)
            ->where('type', 'release')
            ->sum('net_amount');

        $totalSpent = collect($transactions)
            ->where('is_incoming', false)
            ->where('type', 'escrow')
            ->sum('amount');

        $pendingEscrow = collect($transactions)
            ->where('type', 'escrow')
            ->where('status', 'completed')
            ->sum('amount');

        return Inertia::render('Payment/History', [
            'transactions' => $transactions,
            'summary' => [
                'total_earned' => $totalEarned,
                'total_spent' => $totalSpent,
                'pending_escrow' => $pendingEscrow,
                'transaction_count' => count($transactions)
            ]
        ]);
    }

    /**
     * Show transaction details
     */
    public function transaction(Transaction $transaction): Response
    {
        // Ensure user is involved in this transaction
        if ($transaction->payer_id !== auth()->id() && $transaction->payee_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('Payment/Transaction', [
            'transaction' => $transaction->load(['project.job', 'payer', 'payee'])
        ]);
    }
}
