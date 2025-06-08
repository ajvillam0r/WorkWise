<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;
use App\Models\Deposit;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
{
    public function handleStripeWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');
        $endpoint_secret = config('stripe.webhook_secret');

        Log::info('Webhook received', [
            'has_signature' => !empty($sig_header),
            'has_secret' => !empty($endpoint_secret),
            'payload_length' => strlen($payload)
        ]);

        try {
            $event = Webhook::constructEvent(
                $payload, $sig_header, $endpoint_secret
            );

            Log::info('Webhook event processed', [
                'type' => $event->type,
                'id' => $event->id
            ]);

            // Handle the event
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event->data->object;

                    Log::info('Payment intent succeeded', [
                        'payment_intent_id' => $paymentIntent->id,
                        'metadata' => $paymentIntent->metadata->toArray()
                    ]);

                    // Check if this is a deposit payment
                    if (isset($paymentIntent->metadata->purpose) && $paymentIntent->metadata->purpose === 'escrow_deposit') {
                        Log::info('Processing as deposit payment');
                        $this->handleDepositSuccess($paymentIntent);
                    } else {
                        Log::info('Processing as regular payment');
                        $this->handlePaymentSuccess($paymentIntent);
                    }
                    break;

                case 'payment_intent.payment_failed':
                    $paymentIntent = $event->data->object;
                    
                    // Check if this is a deposit payment
                    if ($paymentIntent->metadata->purpose === 'escrow_deposit') {
                        $this->handleDepositFailure($paymentIntent);
                    } else {
                        $this->handlePaymentFailure($paymentIntent);
                    }
                    break;

                default:
                    Log::info('Unhandled event type: ' . $event->type);
            }

            return response()->json(['status' => 'success']);

        } catch (SignatureVerificationException $e) {
            Log::error('Webhook signature verification failed: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    protected function handleDepositSuccess($paymentIntent)
    {
        Log::info('Processing deposit success for payment intent: ' . $paymentIntent->id);

        $deposit = Deposit::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($deposit) {
            Log::info('Found deposit: ' . $deposit->id . ' with status: ' . $deposit->status);

            if ($deposit->status !== 'completed') {
                $deposit->update([
                    'status' => 'completed',
                    'payment_method' => $paymentIntent->payment_method
                ]);

                // Update user's escrow balance
                $deposit->user->increment('escrow_balance', $deposit->amount);

                Log::info('Deposit ' . $deposit->id . ' marked as completed and escrow balance updated');
            } else {
                Log::info('Deposit ' . $deposit->id . ' already completed');
            }
        } else {
            Log::warning('No deposit found for payment intent: ' . $paymentIntent->id);
        }
    }

    protected function handleDepositFailure($paymentIntent)
    {
        $deposit = Deposit::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        
        if ($deposit) {
            $deposit->update([
                'status' => 'failed',
                'metadata' => array_merge($deposit->metadata ?? [], [
                    'failure_message' => $paymentIntent->last_payment_error->message ?? 'Payment failed'
                ])
            ]);
        }
    }

    protected function handlePaymentSuccess($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        
        if ($transaction && $transaction->status !== 'completed') {
            $transaction->update([
                'status' => 'completed',
                'payment_method' => $paymentIntent->payment_method,
                'completed_at' => now()
            ]);
        }
    }

    protected function handlePaymentFailure($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        
        if ($transaction) {
            $transaction->update([
                'status' => 'failed',
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'failure_message' => $paymentIntent->last_payment_error->message ?? 'Payment failed'
                ])
            ]);
        }
    }
} 