<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Inertia\Inertia;
use Inertia\Response;

class DepositController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

    public function index(): Response
    {
        // Auto-check pending deposits before showing the page
        $this->autoConfirmPendingDeposits();

        $deposits = auth()->user()->deposits()
            ->latest()
            ->with('user')
            ->paginate(10);

        // Get currency settings from PHP's locale
        $locale = localeconv();
        $currency = [
            'code' => config('app.currency', 'PHP'),
            'symbol' => '₱',
            'decimal_places' => 2,
            'decimal_separator' => $locale['decimal_point'],
            'thousands_separator' => $locale['thousands_sep']
        ];

        return Inertia::render('Deposits/Index', [
            'deposits' => $deposits,
            'stripe_key' => config('stripe.key'),
            'currency' => $currency
        ]);
    }

    /**
     * Automatically check and confirm pending deposits
     */
    private function autoConfirmPendingDeposits()
    {
        $pendingDeposits = auth()->user()->deposits()
            ->where('status', 'pending')
            ->where('created_at', '>', now()->subHours(24)) // Only check recent deposits
            ->get();

        foreach ($pendingDeposits as $deposit) {
            try {
                $intent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);

                if ($intent->status === 'succeeded') {
                    Log::info('Auto-confirming deposit', [
                        'deposit_id' => $deposit->id,
                        'payment_intent_id' => $deposit->stripe_payment_intent_id
                    ]);

                    $deposit->update([
                        'status' => 'completed',
                        'payment_method' => $intent->payment_method
                    ]);

                    // Update user's escrow balance
                    $deposit->user->increment('escrow_balance', $deposit->amount);
                }
            } catch (ApiErrorException $e) {
                Log::warning('Failed to auto-confirm deposit', [
                    'deposit_id' => $deposit->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    public function debug(): Response
    {
        $deposits = auth()->user()->deposits()
            ->latest()
            ->with('user')
            ->paginate(10);

        return Inertia::render('Deposits/Debug', [
            'deposits' => $deposits
        ]);
    }

    public function createIntent(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        try {
            $amount = $request->amount * 100; // Convert to cents for Stripe
            $user = auth()->user();

            $intent = PaymentIntent::create([
                'amount' => $amount,
                'currency' => strtolower(config('app.currency', 'php')),
                'metadata' => [
                    'user_id' => $user->id,
                    'purpose' => 'escrow_deposit'
                ]
            ]);

            // Create a pending deposit record
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

            return response()->json([
                'clientSecret' => $intent->client_secret,
                'deposit_id' => $deposit->id
            ]);

        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment intent'], 500);
        }
    }

    public function confirm(Request $request, Deposit $deposit)
    {
        try {
            $intent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);

            if ($intent->status === 'succeeded') {
                $deposit->update([
                    'status' => 'completed',
                    'payment_method' => $intent->payment_method
                ]);

                // Update user's escrow balance
                $user = auth()->user();
                $user->increment('escrow_balance', $deposit->amount);

                return response()->json(['success' => true]);
            }

            return response()->json(['error' => 'Payment not completed'], 400);

        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to confirm payment'], 500);
        }
    }

    public function forceConfirm(Request $request, Deposit $deposit)
    {
        try {
            // Force confirm a deposit for testing
            if ($deposit->status === 'pending') {
                $intent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);

                Log::info('Force confirming deposit', [
                    'deposit_id' => $deposit->id,
                    'payment_intent_id' => $deposit->stripe_payment_intent_id,
                    'stripe_status' => $intent->status
                ]);

                if ($intent->status === 'succeeded') {
                    $deposit->update([
                        'status' => 'completed',
                        'payment_method' => $intent->payment_method
                    ]);

                    // Update user's escrow balance
                    $deposit->user->increment('escrow_balance', $deposit->amount);

                    return response()->json([
                        'success' => true,
                        'message' => 'Deposit confirmed successfully',
                        'deposit' => $deposit->fresh()
                    ]);
                } else {
                    return response()->json([
                        'error' => 'Payment intent status is: ' . $intent->status
                    ], 400);
                }
            } else {
                return response()->json([
                    'error' => 'Deposit is already ' . $deposit->status
                ], 400);
            }
        } catch (ApiErrorException $e) {
            Log::error('Force confirm error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to force confirm: ' . $e->getMessage()], 500);
        }
    }

    public function handleConfirmRedirect(Request $request)
    {
        $depositId = $request->query('deposit_id');
        $deposit = Deposit::findOrFail($depositId);
        
        try {
            $intent = PaymentIntent::retrieve($deposit->stripe_payment_intent_id);
            
            if ($intent->status === 'succeeded') {
                $deposit->update([
                    'status' => 'completed',
                    'payment_method' => $intent->payment_method
                ]);

                // Update user's escrow balance
                $deposit->user->increment('escrow_balance', $deposit->amount);

                return redirect()->route('deposits.index')
                    ->with('success', 'Payment completed successfully! Funds have been added to your escrow balance.');
            }

            return redirect()->route('deposits.index')
                ->with('error', 'Payment was not completed. Please try again or contact support if the issue persists.');

        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return redirect()->route('deposits.index')
                ->with('error', 'An error occurred while processing your payment. Please contact support.');
        }
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');
        $endpoint_secret = config('stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sig_header, $endpoint_secret
            );

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;
                
                $deposit = Deposit::where('stripe_payment_intent_id', $paymentIntent->id)->first();
                if ($deposit && $deposit->status !== 'completed') {
                    $deposit->update([
                        'status' => 'completed',
                        'payment_method' => $paymentIntent->payment_method
                    ]);

                    // Update user's escrow balance
                    $deposit->user->increment('escrow_balance', $deposit->amount);
                }
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
} 