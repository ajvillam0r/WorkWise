<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\IdentityVerification;
use Stripe\Stripe;
use Stripe\Identity\VerificationSession;
use Carbon\Carbon;
use Exception;

class IdentityVerificationController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

    /**
     * Create a new identity verification session
     */
    public function createVerificationSession(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Check if user already has a pending or verified verification
            $existingVerification = IdentityVerification::where('user_id', $user->id)
                ->whereIn('status', ['requires_input', 'requires_action', 'processing', 'verified'])
                ->first();

            if ($existingVerification && $existingVerification->status === 'verified') {
                return response()->json([
                    'error' => 'User is already verified',
                    'verification' => $existingVerification
                ], 400);
            }

            if ($existingVerification && $existingVerification->isPending() && !$existingVerification->isExpired()) {
                return response()->json([
                    'success' => true,
                    'verification_session' => [
                        'id' => $existingVerification->stripe_verification_session_id,
                        'client_secret' => $existingVerification->client_secret,
                        'status' => $existingVerification->status
                    ]
                ]);
            }

            // Create Stripe Identity Verification Session
            $verificationSession = VerificationSession::create([
                'type' => 'document',
                'metadata' => [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ],
                'options' => [
                    'document' => [
                        'allowed_types' => ['driving_license', 'passport', 'id_card'],
                        'require_id_number' => true,
                        'require_live_capture' => false, // Disable live capture requirement
                        'require_matching_selfie' => false, // Disable selfie matching
                    ],
                ],
                'return_url' => config('stripe.identity.return_url'),
            ]);

            // Store verification session in database
            $verification = IdentityVerification::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'stripe_verification_session_id' => $verificationSession->id,
                    'status' => $verificationSession->status,
                    'verification_type' => 'document',
                    'client_secret' => $verificationSession->client_secret,
                    'expires_at' => Carbon::now()->addHours(24), // Sessions expire in 24 hours
                    'verification_data' => [
                        'session_id' => $verificationSession->id,
                        'type' => $verificationSession->type,
                        'created' => $verificationSession->created,
                    ]
                ]
            );

            Log::info('Identity verification session created', [
                'user_id' => $user->id,
                'session_id' => $verificationSession->id
            ]);

            return response()->json([
                'success' => true,
                'verification_url' => $verificationSession->url,
                'verification_session' => [
                    'id' => $verificationSession->id,
                    'client_secret' => $verificationSession->client_secret,
                    'status' => $verificationSession->status,
                    'url' => $verificationSession->url,
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Failed to create identity verification session', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to create verification session',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verification status
     */
    public function getVerificationStatus(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $verification = IdentityVerification::where('user_id', $user->id)
                ->latest()
                ->first();

            if (!$verification) {
                return response()->json([
                    'success' => true,
                    'status' => 'not_started',
                    'verification' => null
                ]);
            }

            // Sync with Stripe if verification is pending
            if ($verification->isPending()) {
                $this->syncVerificationWithStripe($verification);
                $verification->refresh();
            }

            return response()->json([
                'success' => true,
                'status' => $verification->status,
                'verification' => [
                    'id' => $verification->id,
                    'status' => $verification->status,
                    'status_label' => $verification->status_label,
                    'verified_at' => $verification->verified_at,
                    'expires_at' => $verification->expires_at,
                    'is_verified' => $verification->isVerified(),
                    'is_expired' => $verification->isExpired(),
                    'is_pending' => $verification->isPending(),
                    'document_data' => $verification->document_data,
                    'selfie_data' => $verification->selfie_data,
                    'liveness_check_passed' => $verification->liveness_check_passed,
                    'fraud_detection_results' => $verification->fraud_detection_results,
                    'failure_reason' => $verification->failure_reason,
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get verification status', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to get verification status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle return from Stripe Identity verification
     */
    public function handleVerificationReturn(Request $request)
    {
        try {
            $sessionId = $request->query('verification_session');
            
            if (!$sessionId) {
                return redirect('/dashboard')->with('error', 'Invalid verification session');
            }

            $verification = IdentityVerification::where('stripe_verification_session_id', $sessionId)->first();
            
            if (!$verification) {
                return redirect('/dashboard')->with('error', 'Verification session not found');
            }

            // Sync with Stripe
            $this->syncVerificationWithStripe($verification);

            return redirect('/identity/verify/status')->with('success', 'Verification completed');

        } catch (Exception $e) {
            Log::error('Failed to handle verification return', [
                'session_id' => $request->query('verification_session'),
                'error' => $e->getMessage()
            ]);

            return redirect('/dashboard')->with('error', 'Failed to process verification');
        }
    }

    /**
     * Sync verification data with Stripe
     */
    private function syncVerificationWithStripe(IdentityVerification $verification): void
    {
        try {
            $stripeSession = VerificationSession::retrieve($verification->stripe_verification_session_id);
            
            $updateData = [
                'status' => $stripeSession->status,
                'verification_data' => [
                    'session_id' => $stripeSession->id,
                    'type' => $stripeSession->type,
                    'status' => $stripeSession->status,
                    'created' => $stripeSession->created,
                    'last_error' => $stripeSession->last_error,
                ]
            ];

            // Process verification results if completed
            if ($stripeSession->status === 'verified' && $stripeSession->verified_outputs) {
                $outputs = $stripeSession->verified_outputs;
                
                $updateData['verified_at'] = Carbon::now();
                $updateData['document_data'] = [
                    'type' => $outputs->document->type ?? null,
                    'country' => $outputs->document->country ?? null,
                    'issuer' => $outputs->document->issuer ?? null,
                    'number' => $outputs->document->number ?? null,
                    'status' => $outputs->document->status ?? null,
                    'expiration_date' => $outputs->document->expiration_date ?? null,
                    'issued_date' => $outputs->document->issued_date ?? null,
                    'dob' => $outputs->document->dob ?? null,
                    'first_name' => $outputs->document->first_name ?? null,
                    'last_name' => $outputs->document->last_name ?? null,
                ];
                
                // Enhanced fraud detection results focusing on document verification
                $documentStatus = $outputs->document->status ?? null;
                $fraudRiskScore = $this->calculateFraudRiskScore($outputs, $stripeSession);
                
                $updateData['fraud_detection_results'] = [
                    'document_verified' => $documentStatus === 'verified',
                    'document_status' => $documentStatus,
                    'fraud_risk_score' => $fraudRiskScore,
                    'document_authenticity_check' => $documentStatus !== 'unverified_other',
                    'id_number_verified' => isset($outputs->document->number) && !empty($outputs->document->number),
                    'expiration_check_passed' => $this->checkDocumentExpiration($outputs->document),
                    'issuer_verification' => isset($outputs->document->issuer) && !empty($outputs->document->issuer),
                    'country_verification' => isset($outputs->document->country) && !empty($outputs->document->country),
                    'checks_passed' => $stripeSession->status === 'verified' && $fraudRiskScore < 0.5,
                    'fraud_indicators' => $this->identifyFraudIndicators($outputs, $stripeSession),
                ];
                
                // Remove selfie-related data since we're not using it
                $updateData['selfie_data'] = null;
                $updateData['liveness_check_passed'] = false;
            }

            if ($stripeSession->status === 'canceled' && $stripeSession->last_error) {
                $updateData['failure_reason'] = $stripeSession->last_error->reason ?? 'Verification was canceled';
            }

            $verification->update($updateData);

            Log::info('Verification synced with Stripe', [
                'verification_id' => $verification->id,
                'stripe_status' => $stripeSession->status
            ]);

        } catch (Exception $e) {
            Log::error('Failed to sync verification with Stripe', [
                'verification_id' => $verification->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Calculate fraud risk score based on document verification results
     */
    private function calculateFraudRiskScore($outputs, $stripeSession): float
    {
        $riskScore = 0.0;
        
        // Check document status
        $documentStatus = $outputs->document->status ?? null;
        if ($documentStatus === 'unverified_other') {
            $riskScore += 0.4;
        } elseif ($documentStatus !== 'verified') {
            $riskScore += 0.2;
        }
        
        // Check for missing critical information
        if (empty($outputs->document->number ?? null)) {
            $riskScore += 0.2;
        }
        
        if (empty($outputs->document->issuer ?? null)) {
            $riskScore += 0.1;
        }
        
        if (empty($outputs->document->country ?? null)) {
            $riskScore += 0.1;
        }
        
        // Check document expiration
        if (!$this->checkDocumentExpiration($outputs->document)) {
            $riskScore += 0.3;
        }
        
        // Check for session errors
        if ($stripeSession->last_error) {
            $riskScore += 0.2;
        }
        
        return min($riskScore, 1.0); // Cap at 1.0
    }
    
    /**
     * Check if document is not expired
     */
    private function checkDocumentExpiration($document): bool
    {
        if (!isset($document->expiration_date) || empty($document->expiration_date)) {
            return true; // If no expiration date, assume valid
        }
        
        try {
            $expirationDate = Carbon::createFromTimestamp($document->expiration_date);
            return $expirationDate->isFuture();
        } catch (Exception $e) {
            Log::warning('Failed to parse document expiration date', [
                'expiration_date' => $document->expiration_date,
                'error' => $e->getMessage()
            ]);
            return true; // If can't parse, assume valid
        }
    }
    
    /**
     * Identify potential fraud indicators
     */
    private function identifyFraudIndicators($outputs, $stripeSession): array
    {
        $indicators = [];
        
        $documentStatus = $outputs->document->status ?? null;
        
        if ($documentStatus === 'unverified_other') {
            $indicators[] = 'document_authenticity_failed';
        }
        
        if (empty($outputs->document->number ?? null)) {
            $indicators[] = 'missing_id_number';
        }
        
        if (empty($outputs->document->issuer ?? null)) {
            $indicators[] = 'missing_issuer_information';
        }
        
        if (!$this->checkDocumentExpiration($outputs->document)) {
            $indicators[] = 'expired_document';
        }
        
        if ($stripeSession->last_error) {
            $indicators[] = 'verification_session_error';
        }
        
        // Check for suspicious patterns in document data
        if (isset($outputs->document->first_name) && isset($outputs->document->last_name)) {
            $firstName = strtolower($outputs->document->first_name);
            $lastName = strtolower($outputs->document->last_name);
            
            if ($firstName === $lastName) {
                $indicators[] = 'suspicious_name_pattern';
            }
            
            if (strlen($firstName) < 2 || strlen($lastName) < 2) {
                $indicators[] = 'suspicious_name_length';
            }
        }
        
        return $indicators;
    }
}
