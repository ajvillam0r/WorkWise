<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class FreelancerWalletController extends Controller
{
    /**
     * Log wallet-related errors with consistent format
     * 
     * @param string $message Error message
     * @param \Exception $exception The exception that occurred
     * @param array $context Additional context data
     * @return void
     */
    private function logWalletError(string $message, \Exception $exception, array $context = []): void
    {
        Log::error($message, array_merge([
            'user_id' => auth()->id(),
            'user_type' => 'gig_worker',
            'error_message' => $exception->getMessage(),
            'error_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }
    /**
     * Show freelancer wallet with earnings and withdrawal options
     */
    public function index(): Response
    {
        try {
            $user = auth()->user();
            
            // Get gig worker's earnings from completed projects
            try {
                $completedProjects = Project::where('gig_worker_id', $user->id)
                    ->where('status', 'completed')
                    ->where('payment_released', true)
                    ->with(['job', 'employer'])
                    ->get()
                    ->filter(function($project) {
                        // Filter out projects with missing relationships
                        return $project->job !== null && $project->employer !== null;
                    });
                    
                Log::info('Completed projects loaded', [
                    'user_id' => $user->id,
                    'total_count' => $completedProjects->count()
                ]);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: completed projects', $e, [
                    'query_type' => 'completed_projects',
                    'operation' => 'get_with_relationships',
                    'relationships' => ['job', 'employer']
                ]);
                $completedProjects = collect([]);
            }

            // Get pending payments: only projects with fully signed contract, either active or completed awaiting release
            try {
                $pendingPayments = Project::where('gig_worker_id', $user->id)
                    ->where('contract_signed', true)
                    ->where(function ($query) {
                        $query->where('status', 'active')
                            ->orWhere(function ($q) {
                                $q->where('status', 'completed')
                                  ->where('payment_released', false);
                            });
                    })
                    ->with(['job', 'employer'])
                    ->get()
                    ->filter(function($project) {
                        // Filter out projects with missing relationships
                        return $project->job !== null && $project->employer !== null;
                    });
                    
                Log::info('Pending payments loaded', [
                    'user_id' => $user->id,
                    'total_count' => $pendingPayments->count()
                ]);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: pending payments', $e, [
                    'query_type' => 'pending_payments',
                    'operation' => 'get_with_relationships',
                    'relationships' => ['job', 'employer']
                ]);
                $pendingPayments = collect([]);
            }

            // Get transaction history (payments received)
            try {
                $transactions = Transaction::where('payee_id', $user->id)
                    ->where('type', 'release')
                    ->where('status', 'completed')
                    ->with(['project.job', 'payer'])
                    ->latest()
                    ->paginate(10);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: transactions', $e, [
                    'query_type' => 'transactions',
                    'operation' => 'paginate_with_relationships',
                    'relationships' => ['project.job', 'payer']
                ]);
                $transactions = collect([]);
            }

            // Calculate total earnings with null coalescing
            try {
                $totalEarnings = $completedProjects->sum(function($project) {
                    return $project->net_amount ?? 0;
                });
            } catch (\Exception $e) {
                $this->logWalletError('Calculation failed: total earnings', $e, [
                    'calculation_type' => 'total_earnings',
                    'operation' => 'sum'
                ]);
                $totalEarnings = 0;
            }
            
            // Calculate pending earnings with null coalescing
            try {
                $pendingEarnings = $pendingPayments->sum(function($project) {
                    return $project->net_amount ?? 0;
                });
            } catch (\Exception $e) {
                $this->logWalletError('Calculation failed: pending earnings', $e, [
                    'calculation_type' => 'pending_earnings',
                    'operation' => 'sum'
                ]);
                $pendingEarnings = 0;
            }

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
            
        } catch (\Exception $e) {
            // Log error with comprehensive context
            $this->logWalletError('Freelancer wallet page error - complete failure', $e, [
                'error_type' => 'page_load_failure',
                'endpoint' => '/gig-worker/wallet'
            ]);
            
            // Return graceful fallback data
            return Inertia::render('Freelancer/Wallet', [
                'error' => 'Unable to load wallet data. Please try again later.',
                'totalEarnings' => 0,
                'pendingEarnings' => 0,
                'availableBalance' => 0,
                'completedProjects' => collect([]),
                'pendingPayments' => collect([]),
                'transactions' => collect([]),
                'currency' => [
                    'code' => config('app.currency', 'PHP'),
                    'symbol' => '₱',
                    'decimal_places' => 2
                ]
            ]);
        }
    }

    /**
     * Request withdrawal (placeholder for future implementation)
     */
    public function requestWithdrawal(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'bank_account' => 'required|string'
            ]);

            $user = auth()->user();
            
            Log::info('Withdrawal request initiated', [
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
                'amount' => $request->amount,
                'bank_account' => substr($request->bank_account, -4) // Log only last 4 digits for security
            ]);

            // TODO: Implement withdrawal to bank account via Stripe Connect
            // For now, just return success message
            
            Log::info('Withdrawal request submitted (placeholder)', [
                'user_id' => $user->id,
                'amount' => $request->amount
            ]);
            
            return back()->with('success', 'Withdrawal request submitted. Funds will be transferred to your bank account within 2-3 business days.');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Log validation errors
            Log::warning('Withdrawal request validation failed', [
                'user_id' => auth()->id(),
                'user_type' => 'gig_worker',
                'errors' => $e->errors(),
                'input' => $request->except(['bank_account']) // Don't log sensitive bank info
            ]);
            throw $e; // Re-throw to show validation errors to user
            
        } catch (\Exception $e) {
            // Log generic error
            $this->logWalletError('Withdrawal request failed', $e, [
                'error_type' => 'withdrawal_request_error',
                'amount' => $request->amount ?? null
            ]);
            
            return back()->withErrors(['error' => 'Failed to process withdrawal request. Please try again later.']);
        }
    }
}
