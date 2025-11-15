<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\Transaction;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Illuminate\Support\Facades\Log;

class ClientWalletController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

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
            'user_type' => 'employer',
            'error_message' => $exception->getMessage(),
            'error_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Show client wallet with escrow balance and deposit functionality
     */
    public function index(): Response
    {
        try {
            $user = auth()->user();
            
            // Auto-check pending deposits before showing the page
            $this->autoConfirmPendingDeposits();

            // Get deposit history with null safety
            try {
                $deposits = $user->deposits()
                    ->latest()
                    ->paginate(10);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: deposits', $e, [
                    'query_type' => 'deposits',
                    'operation' => 'paginate'
                ]);
                $deposits = collect([]);
            }

            // Get projects where client made payments
            // Updated to use 'gigWorker' instead of deprecated 'freelancer' relationship
            try {
                $paidProjects = Project::where('client_id', $user->id)
                    ->whereHas('transactions', function($query) {
                        $query->where('type', 'escrow')->where('status', 'completed');
                    })
                    ->with(['job', 'gigWorker', 'transactions'])
                    ->latest()
                    ->take(5)
                    ->get();
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: paid projects', $e, [
                    'query_type' => 'paid_projects',
                    'operation' => 'get_with_relationships',
                    'relationships' => ['job', 'gigWorker', 'transactions']
                ]);
                $paidProjects = collect([]);
            }

            // Get transaction history (payments made)
            try {
                $transactions = Transaction::where('payer_id', $user->id)
                    ->where('type', 'escrow')
                    ->where('status', 'completed')
                    ->with(['project.job', 'payee'])
                    ->latest()
                    ->paginate(10);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: transactions', $e, [
                    'query_type' => 'transactions',
                    'operation' => 'paginate_with_relationships',
                    'relationships' => ['project.job', 'payee']
                ]);
                $transactions = collect([]);
            }

            // Calculate total spent with null safety
            try {
                $totalSpent = Transaction::where('payer_id', $user->id)
                    ->where('type', 'escrow')
                    ->where('status', 'completed')
                    ->sum('amount') ?? 0;
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: total spent calculation', $e, [
                    'query_type' => 'total_spent',
                    'operation' => 'sum'
                ]);
                $totalSpent = 0;
            }

            return Inertia::render('Client/Wallet', [
                'deposits' => $deposits,
                'paidProjects' => $paidProjects,
                'transactions' => $transactions,
                'totalSpent' => $totalSpent,
                'escrowBalance' => $user->escrow_balance ?? 0,
                'stripe_key' => config('stripe.key'),
                'currency' => [
                    'code' => config('app.currency', 'PHP'),
                    'symbol' => '₱',
                    'decimal_places' => 2
                ]
            ]);
            
        } catch (\Exception $e) {
            // Log error with comprehensive context
            $this->logWalletError('Client wallet page error - complete failure', $e, [
                'error_type' => 'page_load_failure',
                'endpoint' => '/employer/wallet'
            ]);
            
            // Return graceful fallback data instead of crashing
            return Inertia::render('Client/Wallet', [
                'error' => 'Unable to load wallet data. Please try again later.',
                'deposits' => collect([]),
                'paidProjects' => collect([]),
                'transactions' => collect([]),
                'totalSpent' => 0,
                'escrowBalance' => 0,
                'stripe_key' => config('stripe.key'),
                'currency' => [
                    'code' => config('app.currency', 'PHP'),
                    'symbol' => '₱',
                    'decimal_places' => 2
                ]
            ]);
        }
    }

    /**
     * Create payment intent for adding funds to escrow
     */
    public function createIntent(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        try {
            $amount = $request->amount * 100; // Convert to cents for Stripe
            $user = auth()->user();

            // Log Stripe API call attempt
            Log::info('Creating Stripe payment intent', [
                'user_id' => $user->id,
                'user_type' => 'employer',
                'amount' => $request->amount,
                'currency' => strtolower(config('app.currency', 'php'))
            ]);

            $intent = PaymentIntent::create([
                'amount' => $amount,
                'currency' => strtolower(config('app.currency', 'php')),
                'metadata' => [
                    'user_id' => $user->id,
                    'purpose' => 'escrow_deposit'
                ]
            ]);

            // Create a pending deposit record
            try {
                $deposit = Deposit::create([
                    'user_id' => $user->id,
                    'amount' => $request->amount,
                    'currency' => strtolower(config('app.currency', 'php')),
                    'stripe_payment_intent_id' => $intent->id,
                    'status' => 'pending',
                    'metadata' => [
                        'client_secret' => $intent->client_secret
                    ]
                ]);

                Log::info('Deposit record created successfully', [
                    'user_id' => $user->id,
                    'deposit_id' => $deposit->id,
                    'payment_intent_id' => $intent->id
                ]);
            } catch (\Exception $e) {
                $this->logWalletError('Database query failed: deposit creation', $e, [
                    'query_type' => 'deposit_create',
                    'operation' => 'create',
                    'payment_intent_id' => $intent->id,
                    'amount' => $request->amount
                ]);
                throw $e; // Re-throw to be caught by outer catch
            }

            return response()->json([
                'clientSecret' => $intent->client_secret,
                'deposit_id' => $deposit->id
            ]);

        } catch (\Stripe\Exception\CardException $e) {
            // Stripe card error
            $this->logWalletError('Stripe card error', $e, [
                'error_type' => 'stripe_card_error',
                'amount' => $request->amount ?? null,
                'stripe_error_code' => $e->getStripeCode(),
                'stripe_error_type' => $e->getError()->type ?? null
            ]);
            
            return response()->json([
                'error' => 'Card error: ' . $e->getMessage()
            ], 400);
            
        } catch (\Stripe\Exception\RateLimitException $e) {
            // Too many requests to Stripe API
            $this->logWalletError('Stripe rate limit exceeded', $e, [
                'error_type' => 'stripe_rate_limit',
                'amount' => $request->amount ?? null
            ]);
            
            return response()->json([
                'error' => 'Too many requests. Please try again later.'
            ], 429);
            
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Invalid parameters sent to Stripe
            $this->logWalletError('Stripe invalid request', $e, [
                'error_type' => 'stripe_invalid_request',
                'amount' => $request->amount ?? null,
                'stripe_error_param' => $e->getStripeParam() ?? null
            ]);
            
            return response()->json([
                'error' => 'Invalid payment request: ' . $e->getMessage()
            ], 400);
            
        } catch (\Stripe\Exception\AuthenticationException $e) {
            // Authentication with Stripe failed
            $this->logWalletError('Stripe authentication failed', $e, [
                'error_type' => 'stripe_authentication_error',
                'amount' => $request->amount ?? null
            ]);
            
            return response()->json([
                'error' => 'Payment system authentication error. Please contact support.'
            ], 500);
            
        } catch (\Stripe\Exception\ApiConnectionException $e) {
            // Network communication with Stripe failed
            $this->logWalletError('Stripe API connection failed', $e, [
                'error_type' => 'stripe_connection_error',
                'amount' => $request->amount ?? null
            ]);
            
            return response()->json([
                'error' => 'Unable to connect to payment system. Please try again.'
            ], 503);
            
        } catch (\Stripe\Exception\ApiErrorException $e) {
            // Generic Stripe API error
            $this->logWalletError('Stripe API error', $e, [
                'error_type' => 'stripe_api_error',
                'amount' => $request->amount ?? null
            ]);
            
            return response()->json([
                'error' => 'Payment system error: ' . $e->getMessage()
            ], 500);
            
        } catch (\Exception $e) {
            // Generic error
            $this->logWalletError('Payment intent creation failed', $e, [
                'error_type' => 'generic_error',
                'amount' => $request->amount ?? null
            ]);
            
            return response()->json([
                'error' => 'Failed to create payment intent: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auto-confirm pending deposits by checking with Stripe
     */
    private function autoConfirmPendingDeposits()
    {
        try {
            $pendingDeposits = auth()->user()->deposits()
                ->where('status', 'pending')
                ->get();

            Log::info('Checking pending deposits', [
                'user_id' => auth()->id(),
                'pending_count' => $pendingDeposits->count()
            ]);

            foreach ($pendingDeposits as $deposit) {
                try {
                    $paymentIntent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);
                    
                    Log::info('Retrieved payment intent status', [
                        'user_id' => auth()->id(),
                        'deposit_id' => $deposit->id,
                        'payment_intent_id' => $deposit->stripe_payment_intent_id,
                        'status' => $paymentIntent->status
                    ]);
                    
                    if ($paymentIntent->status === 'succeeded') {
                        try {
                            $deposit->update([
                                'status' => 'completed',
                                'payment_method' => $paymentIntent->payment_method
                            ]);

                            // Update user's escrow balance
                            $deposit->user->increment('escrow_balance', $deposit->amount);
                            
                            Log::info('Deposit confirmed and balance updated', [
                                'user_id' => auth()->id(),
                                'deposit_id' => $deposit->id,
                                'amount' => $deposit->amount,
                                'new_balance' => $deposit->user->fresh()->escrow_balance
                            ]);
                        } catch (\Exception $e) {
                            $this->logWalletError('Database query failed: deposit confirmation', $e, [
                                'query_type' => 'deposit_update',
                                'operation' => 'update_and_increment',
                                'deposit_id' => $deposit->id,
                                'payment_intent_id' => $deposit->stripe_payment_intent_id
                            ]);
                        }
                    }
                } catch (\Stripe\Exception\ApiErrorException $e) {
                    // Log Stripe API error but continue processing other deposits
                    $this->logWalletError('Stripe API error while checking deposit status', $e, [
                        'error_type' => 'stripe_retrieve_error',
                        'deposit_id' => $deposit->id,
                        'payment_intent_id' => $deposit->stripe_payment_intent_id
                    ]);
                } catch (\Exception $e) {
                    // Log generic error but continue processing other deposits
                    $this->logWalletError('Failed to check deposit status', $e, [
                        'error_type' => 'deposit_check_error',
                        'deposit_id' => $deposit->id,
                        'payment_intent_id' => $deposit->stripe_payment_intent_id
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Log error when fetching pending deposits
            $this->logWalletError('Database query failed: fetching pending deposits', $e, [
                'query_type' => 'pending_deposits',
                'operation' => 'get'
            ]);
        }
    }
}
