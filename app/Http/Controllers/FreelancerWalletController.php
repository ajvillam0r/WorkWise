<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FreelancerWalletController extends Controller
{
    /**
     * Show freelancer wallet with earnings and withdrawal options
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        // Get freelancer's earnings from completed projects
        $completedProjects = Project::where('freelancer_id', $user->id)
            ->where('status', 'completed')
            ->where('payment_released', true)
            ->with(['job', 'client'])
            ->get();

        // Get pending payments (completed projects awaiting payment release)
        $pendingPayments = Project::where('freelancer_id', $user->id)
            ->where('status', 'completed')
            ->where('payment_released', false)
            ->with(['job', 'client'])
            ->get();

        // Get transaction history (payments received)
        $transactions = Transaction::where('payee_id', $user->id)
            ->where('type', 'release')
            ->where('status', 'completed')
            ->with(['project.job', 'payer'])
            ->latest()
            ->paginate(10);

        // Calculate total earnings
        $totalEarnings = $completedProjects->sum('net_amount');
        
        // Calculate pending earnings
        $pendingEarnings = $pendingPayments->sum('net_amount');

        // Calculate available balance (for future withdrawal feature)
        $availableBalance = $totalEarnings; // In real implementation, subtract withdrawn amounts

        return Inertia::render('Freelancer/Wallet', [
            'totalEarnings' => $totalEarnings,
            'pendingEarnings' => $pendingEarnings,
            'availableBalance' => $availableBalance,
            'completedProjects' => $completedProjects,
            'pendingPayments' => $pendingPayments,
            'transactions' => $transactions,
            'currency' => [
                'code' => config('app.currency', 'PHP'),
                'symbol' => '₱',
                'decimal_places' => 2
            ]
        ]);
    }

    /**
     * Request withdrawal (placeholder for future implementation)
     */
    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'bank_account' => 'required|string'
        ]);

        // TODO: Implement withdrawal to bank account via Stripe Connect
        // For now, just return success message
        
        return back()->with('success', 'Withdrawal request submitted. Funds will be transferred to your bank account within 2-3 business days.');
    }
}
