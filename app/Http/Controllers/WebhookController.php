<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class WebhookController extends Controller
{
    public function handleStripeWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sigHeader,
                config('services.stripe.webhook.secret')
            );
        } catch (SignatureVerificationException $e) {
            Log::error('Webhook signature verification failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Handle the event
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;
            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;
            case 'transfer.created':
                $this->handleTransferCreated($event->data->object);
                break;
            case 'transfer.failed':
                $this->handleTransferFailed($event->data->object);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    private function handlePaymentIntentSucceeded($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        
        if ($transaction) {
            $transaction->update([
                'status' => 'completed',
                'stripe_charge_id' => $paymentIntent->charges->data[0]->id ?? null,
                'processed_at' => now(),
            ]);
        }
    }

    private function handlePaymentIntentFailed($paymentIntent)
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

    private function handleTransferCreated($transfer)
    {
        // Handle successful transfer to freelancer
        if (isset($transfer->metadata['transaction_id'])) {
            $transaction = Transaction::find($transfer->metadata['transaction_id']);
            if ($transaction) {
                $transaction->update([
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'transfer_id' => $transfer->id,
                        'transfer_status' => 'succeeded'
                    ])
                ]);
            }
        }
    }

    private function handleTransferFailed($transfer)
    {
        // Handle failed transfer to freelancer
        if (isset($transfer->metadata['transaction_id'])) {
            $transaction = Transaction::find($transfer->metadata['transaction_id']);
            if ($transaction) {
                $transaction->update([
                    'status' => 'failed',
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'transfer_id' => $transfer->id,
                        'transfer_status' => 'failed',
                        'failure_message' => $transfer->failure_message ?? 'Transfer failed'
                    ])
                ]);
            }
        }
    }
} 