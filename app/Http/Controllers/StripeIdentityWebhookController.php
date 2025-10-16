<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use App\Models\IdentityVerification;
use Stripe\Stripe;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use Carbon\Carbon;
use Exception;

class StripeIdentityWebhookController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

    /**
     * Handle Stripe Identity webhook events
     */
    public function handleWebhook(Request $request): Response
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('stripe.identity.webhook_secret');

        try {
            // Verify webhook signature
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe Identity webhook signature verification failed', [
                'error' => $e->getMessage()
            ]);
            return response('Invalid signature', 400);
        } catch (Exception $e) {
            Log::error('Stripe Identity webhook error', [
                'error' => $e->getMessage()
            ]);
            return response('Webhook error', 400);
        }

        // Handle the event
        try {
            switch ($event->type) {
                case 'identity.verification_session.verified':
                    $this->handleVerificationVerified($event->data->object);
                    break;

                case 'identity.verification_session.requires_input':
                    $this->handleVerificationRequiresInput($event->data->object);
                    break;

                case 'identity.verification_session.canceled':
                    $this->handleVerificationCanceled($event->data->object);
                    break;

                case 'identity.verification_session.processing':
                    $this->handleVerificationProcessing($event->data->object);
                    break;

                case 'identity.verification_session.requires_action':
                    $this->handleVerificationRequiresAction($event->data->object);
                    break;

                default:
                    Log::info('Unhandled Stripe Identity webhook event', [
                        'type' => $event->type,
                        'id' => $event->id
                    ]);
            }

            return response('Webhook handled', 200);

        } catch (Exception $e) {
            Log::error('Error processing Stripe Identity webhook', [
                'event_type' => $event->type,
                'event_id' => $event->id,
                'error' => $e->getMessage()
            ]);
            return response('Webhook processing error', 500);
        }
    }

    /**
     * Handle verification verified event
     */
    private function handleVerificationVerified($verificationSession): void
    {
        $verification = IdentityVerification::where('stripe_verification_session_id', $verificationSession->id)->first();
        
        if (!$verification) {
            Log::warning('Verification session not found for verified event', [
                'session_id' => $verificationSession->id
            ]);
            return;
        }

        $outputs = $verificationSession->verified_outputs;
        
        $verification->update([
            'status' => 'verified',
            'verified_at' => Carbon::now(),
            'document_data' => [
                'type' => $outputs->document->type ?? null,
                'country' => $outputs->document->country ?? null,
                'issuer' => $outputs->document->issuer ?? null,
                'number' => $outputs->document->number ?? null,
                'status' => $outputs->document->status ?? null,
            ],
            'selfie_data' => [
                'status' => $outputs->selfie->status ?? null,
            ],
            'liveness_check_passed' => ($outputs->selfie->status ?? null) === 'verified',
            'fraud_detection_results' => [
                'document_unverified_other' => ($outputs->document->status ?? null) === 'unverified_other',
                'selfie_unverified_other' => ($outputs->selfie->status ?? null) === 'unverified_other',
                'checks_passed' => true,
                'verification_method' => 'stripe_identity',
                'verified_at' => Carbon::now()->toISOString(),
            ],
            'verification_data' => [
                'session_id' => $verificationSession->id,
                'type' => $verificationSession->type,
                'status' => $verificationSession->status,
                'verified_outputs' => $outputs,
                'webhook_processed_at' => Carbon::now()->toISOString(),
            ]
        ]);

        Log::info('Identity verification completed successfully', [
            'verification_id' => $verification->id,
            'user_id' => $verification->user_id,
            'session_id' => $verificationSession->id
        ]);
    }

    /**
     * Handle verification requires input event
     */
    private function handleVerificationRequiresInput($verificationSession): void
    {
        $verification = IdentityVerification::where('stripe_verification_session_id', $verificationSession->id)->first();
        
        if (!$verification) {
            Log::warning('Verification session not found for requires_input event', [
                'session_id' => $verificationSession->id
            ]);
            return;
        }

        $verification->update([
            'status' => 'requires_input',
            'verification_data' => array_merge($verification->verification_data ?? [], [
                'status' => $verificationSession->status,
                'last_error' => $verificationSession->last_error,
                'webhook_processed_at' => Carbon::now()->toISOString(),
            ])
        ]);

        Log::info('Identity verification requires input', [
            'verification_id' => $verification->id,
            'session_id' => $verificationSession->id
        ]);
    }

    /**
     * Handle verification canceled event
     */
    private function handleVerificationCanceled($verificationSession): void
    {
        $verification = IdentityVerification::where('stripe_verification_session_id', $verificationSession->id)->first();
        
        if (!$verification) {
            Log::warning('Verification session not found for canceled event', [
                'session_id' => $verificationSession->id
            ]);
            return;
        }

        $verification->update([
            'status' => 'canceled',
            'failure_reason' => $verificationSession->last_error->reason ?? 'Verification was canceled by user',
            'verification_data' => array_merge($verification->verification_data ?? [], [
                'status' => $verificationSession->status,
                'last_error' => $verificationSession->last_error,
                'canceled_at' => Carbon::now()->toISOString(),
                'webhook_processed_at' => Carbon::now()->toISOString(),
            ])
        ]);

        Log::info('Identity verification canceled', [
            'verification_id' => $verification->id,
            'session_id' => $verificationSession->id,
            'reason' => $verificationSession->last_error->reason ?? 'User canceled'
        ]);
    }

    /**
     * Handle verification processing event
     */
    private function handleVerificationProcessing($verificationSession): void
    {
        $verification = IdentityVerification::where('stripe_verification_session_id', $verificationSession->id)->first();
        
        if (!$verification) {
            Log::warning('Verification session not found for processing event', [
                'session_id' => $verificationSession->id
            ]);
            return;
        }

        $verification->update([
            'status' => 'processing',
            'verification_data' => array_merge($verification->verification_data ?? [], [
                'status' => $verificationSession->status,
                'processing_started_at' => Carbon::now()->toISOString(),
                'webhook_processed_at' => Carbon::now()->toISOString(),
            ])
        ]);

        Log::info('Identity verification processing', [
            'verification_id' => $verification->id,
            'session_id' => $verificationSession->id
        ]);
    }

    /**
     * Handle verification requires action event
     */
    private function handleVerificationRequiresAction($verificationSession): void
    {
        $verification = IdentityVerification::where('stripe_verification_session_id', $verificationSession->id)->first();
        
        if (!$verification) {
            Log::warning('Verification session not found for requires_action event', [
                'session_id' => $verificationSession->id
            ]);
            return;
        }

        $verification->update([
            'status' => 'requires_action',
            'verification_data' => array_merge($verification->verification_data ?? [], [
                'status' => $verificationSession->status,
                'last_error' => $verificationSession->last_error,
                'webhook_processed_at' => Carbon::now()->toISOString(),
            ])
        ]);

        Log::info('Identity verification requires action', [
            'verification_id' => $verification->id,
            'session_id' => $verificationSession->id
        ]);
    }
}
