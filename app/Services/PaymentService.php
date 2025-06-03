<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Transaction;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    private StripeClient $stripe;
    private float $platformFeePercentage = 0.05; // 5% platform fee

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Create a payment intent for escrow
     */
    public function createEscrowPayment(Project $project): array
    {
        try {
            $amount = $this->convertToStripeAmount($project->agreed_amount);
            $platformFee = $this->calculatePlatformFee($project->agreed_amount);

            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $amount,
                'currency' => config('services.stripe.currency'),
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'project_id' => $project->id,
                    'type' => 'escrow',
                    'platform_fee' => $platformFee,
                ],
            ]);

            // Create pending transaction
            Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->client_id,
                'payee_id' => $project->freelancer_id,
                'amount' => $project->agreed_amount,
                'platform_fee' => $platformFee,
                'net_amount' => $project->agreed_amount - $platformFee,
                'type' => 'escrow',
                'status' => 'pending',
                'stripe_payment_intent_id' => $paymentIntent->id,
                'description' => "Escrow payment for project: {$project->job->title}",
            ]);

            return [
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Payment intent creation failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Confirm and process payment
     */
    public function confirmPayment(string $paymentIntentId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);
            
            if ($paymentIntent->status !== 'succeeded') {
                return ['success' => false, 'error' => 'Payment not successful'];
            }

            // Update transaction status
            $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();
            
            if (!$transaction) {
                return ['success' => false, 'error' => 'Transaction not found'];
            }

            $transaction->update([
                'status' => 'completed',
                'stripe_charge_id' => $paymentIntent->charges->data[0]->id ?? null,
                'processed_at' => now(),
            ]);

            return ['success' => true];

        } catch (ApiErrorException $e) {
            Log::error('Payment confirmation failed', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Release payment from escrow to freelancer
     */
    public function releasePayment(Project $project): array
    {
        try {
            $escrowTransaction = $project->transactions()
                ->where('type', 'escrow')
                ->where('status', 'completed')
                ->first();

            if (!$escrowTransaction) {
                return ['success' => false, 'error' => 'No escrow payment found'];
            }

            // Create transfer to freelancer's connected account
            $transfer = $this->stripe->transfers->create([
                'amount' => $this->convertToStripeAmount($escrowTransaction->net_amount),
                'currency' => config('services.stripe.currency'),
                'destination' => $project->freelancer->stripe_account_id,
                'transfer_group' => "project_{$project->id}",
                'metadata' => [
                    'project_id' => $project->id,
                    'transaction_id' => $escrowTransaction->id,
                ],
            ]);

            // Create release transaction
            Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->client_id,
                'payee_id' => $project->freelancer_id,
                'amount' => $escrowTransaction->amount,
                'platform_fee' => $escrowTransaction->platform_fee,
                'net_amount' => $escrowTransaction->net_amount,
                'type' => 'release',
                'status' => 'completed',
                'stripe_payment_intent_id' => $escrowTransaction->stripe_payment_intent_id,
                'description' => "Payment release for project: {$project->job->title}",
                'metadata' => ['transfer_id' => $transfer->id],
                'processed_at' => now(),
            ]);

            return ['success' => true];

        } catch (ApiErrorException $e) {
            Log::error('Payment release failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Process refund
     */
    public function refundPayment(Project $project, string $reason = 'requested_by_customer'): array
    {
        try {
            $escrowTransaction = $project->transactions()
                ->where('type', 'escrow')
                ->where('status', 'completed')
                ->first();

            if (!$escrowTransaction) {
                return ['success' => false, 'error' => 'No escrow payment found'];
            }

            // Create refund
            $refund = $this->stripe->refunds->create([
                'payment_intent' => $escrowTransaction->stripe_payment_intent_id,
                'reason' => $reason,
                'metadata' => [
                    'project_id' => $project->id,
                    'reason' => $reason
                ]
            ]);

            // Create refund transaction
            Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->freelancer_id,
                'payee_id' => $project->client_id,
                'amount' => $escrowTransaction->amount,
                'platform_fee' => -$escrowTransaction->platform_fee,
                'net_amount' => $escrowTransaction->amount,
                'type' => 'refund',
                'status' => 'completed',
                'description' => "Refund for project: {$project->job->title}. Reason: {$reason}",
                'metadata' => ['refund_id' => $refund->id],
                'processed_at' => now()
            ]);

            return ['success' => true, 'refund_id' => $refund->id];

        } catch (ApiErrorException $e) {
            Log::error('Payment refund failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get payment history for user
     */
    public function getPaymentHistory(int $userId, int $limit = 50): array
    {
        $transactions = Transaction::where(function($query) use ($userId) {
            $query->where('payer_id', $userId)
                  ->orWhere('payee_id', $userId);
        })
        ->with(['project.job', 'payer', 'payee'])
        ->orderBy('created_at', 'desc')
        ->limit($limit)
        ->get();

        return $transactions->map(function($transaction) use ($userId) {
            return [
                'id' => $transaction->id,
                'project_title' => $transaction->project->job->title ?? 'N/A',
                'amount' => (float) $transaction->amount,
                'net_amount' => (float) $transaction->net_amount,
                'platform_fee' => (float) $transaction->platform_fee,
                'type' => $transaction->type,
                'status' => $transaction->status,
                'description' => $transaction->description,
                'is_incoming' => $transaction->payee_id === $userId,
                'other_party' => $transaction->payee_id === $userId 
                    ? $transaction->payer->first_name . ' ' . $transaction->payer->last_name
                    : $transaction->payee->first_name . ' ' . $transaction->payee->last_name,
                'date' => $transaction->created_at->format('M d, Y'),
                'processed_at' => $transaction->processed_at?->format('M d, Y H:i')
            ];
        })->toArray();
    }

    /**
     * Get demo test cards for presentation
     */
    public function getTestCards(): array
    {
        return [
            [
                'number' => '4242424242424242',
                'description' => 'Succeeds and immediately processes the payment',
            ],
            [
                'number' => '4000002500003155',
                'description' => 'Requires authentication',
            ],
            [
                'number' => '4000000000009995',
                'description' => 'Declined payment',
            ],
        ];
    }

    /**
     * Calculate platform fee
     */
    private function calculatePlatformFee(float $amount): float
    {
        return round($amount * $this->platformFeePercentage, 2);
    }

    /**
     * Convert amount to Stripe format (cents)
     */
    private function convertToStripeAmount(float $amount): int
    {
        return (int) round($amount * 100);
    }
}
