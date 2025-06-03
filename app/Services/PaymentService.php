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
     * Create payment intent for escrow
     */
    public function createEscrowPayment(Project $project): array
    {
        try {
            $amount = $this->convertToStripeAmount($project->agreed_amount);
            $platformFee = $this->calculatePlatformFee($project->agreed_amount);

            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $amount,
                'currency' => 'php',
                'payment_method_types' => ['card'],
                'capture_method' => 'manual', // For escrow - capture later
                'metadata' => [
                    'project_id' => $project->id,
                    'client_id' => $project->client_id,
                    'freelancer_id' => $project->freelancer_id,
                    'type' => 'escrow'
                ],
                'description' => "Escrow payment for project: {$project->job->title}"
            ]);

            // Create transaction record
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
                'metadata' => [
                    'payment_intent' => $paymentIntent->toArray()
                ]
            ]);

            return [
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe payment creation failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } catch (\Exception $e) {
            Log::error('Payment Service Error', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Confirm escrow payment
     */
    public function confirmEscrowPayment(string $paymentIntentId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);
            
            if ($paymentIntent->status === 'requires_capture') {
                // Payment is authorized but not captured (perfect for escrow)
                $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();
                
                if ($transaction) {
                    $transaction->update([
                        'status' => 'completed',
                        'processed_at' => now()
                    ]);
                }

                return ['success' => true, 'status' => 'escrowed'];
            }

            return ['success' => false, 'error' => 'Payment not in correct state for escrow'];

        } catch (ApiErrorException $e) {
            Log::error('Stripe payment confirmation failed', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Release payment to freelancer
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

            // Capture the payment
            $paymentIntent = $this->stripe->paymentIntents->capture(
                $escrowTransaction->stripe_payment_intent_id
            );

            // Create release transaction
            Transaction::create([
                'project_id' => $project->id,
                'payer_id' => $project->client_id,
                'payee_id' => $project->freelancer_id,
                'amount' => $escrowTransaction->net_amount,
                'platform_fee' => 0,
                'net_amount' => $escrowTransaction->net_amount,
                'type' => 'release',
                'status' => 'completed',
                'stripe_charge_id' => $paymentIntent->charges->data[0]->id ?? null,
                'description' => "Payment release for completed project: {$project->job->title}",
                'processed_at' => now()
            ]);

            // Mark project payment as released
            $project->update(['payment_released' => true]);

            return ['success' => true, 'amount' => $escrowTransaction->net_amount];

        } catch (ApiErrorException $e) {
            Log::error('Payment release failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Refund payment to client
     */
    public function refundPayment(Project $project, string $reason = ''): array
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
                'reason' => 'requested_by_customer',
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
                'platform_fee' => -$escrowTransaction->platform_fee, // Refund platform fee too
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
                'amount' => $transaction->amount,
                'net_amount' => $transaction->net_amount,
                'platform_fee' => $transaction->platform_fee,
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

    /**
     * Get demo test cards for presentation
     */
    public function getTestCards(): array
    {
        return [
            [
                'number' => '4242424242424242',
                'brand' => 'Visa',
                'description' => 'Successful payment'
            ],
            [
                'number' => '5555555555554444',
                'brand' => 'Mastercard', 
                'description' => 'Successful payment'
            ],
            [
                'number' => '4000000000000002',
                'brand' => 'Visa',
                'description' => 'Declined payment (for testing)'
            ]
        ];
    }
}
