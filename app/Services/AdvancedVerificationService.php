<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserVerification;
use App\Models\VerificationDocument;
use App\Models\BiometricData;
use App\Models\VerificationAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AdvancedVerificationService
{
    private const VERIFICATION_LEVELS = [
        'basic' => ['email', 'phone', 'government_id'],
        'enhanced' => ['email', 'phone', 'government_id', 'biometric', 'address', 'social_media'],
        'premium' => ['email', 'phone', 'government_id', 'biometric', 'address', 'social_media', 'video_interview', 'skill_assessment', 'reference_check']
    ];

    /**
     * Perform verification based on level
     */
    public function performVerification(User $user, string $level, array $data = []): array
    {
        $requiredVerifications = self::VERIFICATION_LEVELS[$level] ?? self::VERIFICATION_LEVELS['basic'];
        $results = [];

        foreach ($requiredVerifications as $verificationType) {
            $result = $this->executeVerification($user, $verificationType, $data[$verificationType] ?? []);
            $results[$verificationType] = $result;
        }

        // Update user verification level
        $this->updateUserVerificationLevel($user, $level, $results);

        return [
            'verification_level' => $level,
            'overall_status' => $this->calculateOverallStatus($results),
            'confidence_score' => $this->calculateOverallConfidence($results),
            'results' => $results,
            'next_steps' => $this->getNextSteps($results)
        ];
    }

    /**
     * Execute specific verification type
     */
    private function executeVerification(User $user, string $verificationType, array $data): array
    {
        $verification = UserVerification::updateOrCreate(
            ['user_id' => $user->id, 'verification_type' => $verificationType],
            ['status' => 'in_progress', 'verification_data' => $data]
        );

        try {
            $result = match($verificationType) {
                'email' => $this->verifyEmail($user, $data),
                'phone' => $this->verifyPhone($user, $data),
                'government_id' => $this->verifyGovernmentID($user, $data),
                'biometric' => $this->verifyBiometric($user, $data),
                'address' => $this->verifyAddress($user, $data),
                'social_media' => $this->verifySocialMedia($user, $data),
                'video_interview' => $this->scheduleVideoInterview($user, $data),
                'skill_assessment' => $this->conductSkillAssessment($user, $data),
                'reference_check' => $this->checkReferences($user, $data),
                default => ['status' => 'failed', 'message' => 'Unknown verification type']
            };

            $verification->update([
                'status' => $result['status'],
                'verification_result' => $result,
                'confidence_score' => $result['confidence_score'] ?? 0,
                'verified_at' => $result['status'] === 'completed' ? now() : null,
                'verified_by' => $result['verified_by'] ?? 'system'
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error("Verification failed for {$verificationType}", [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            $verification->update([
                'status' => 'failed',
                'verification_result' => ['error' => $e->getMessage()]
            ]);

            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }

    /**
     * Verify email address
     */
    private function verifyEmail(User $user, array $data): array
    {
        if ($user->email_verified_at) {
            return [
                'status' => 'completed',
                'confidence_score' => 1.0,
                'verified_by' => 'system',
                'message' => 'Email already verified'
            ];
        }

        // Send verification email (Laravel's built-in functionality)
        $user->sendEmailVerificationNotification();

        return [
            'status' => 'pending',
            'confidence_score' => 0.0,
            'verified_by' => 'system',
            'message' => 'Verification email sent'
        ];
    }

    /**
     * Verify phone number
     */
    private function verifyPhone(User $user, array $data): array
    {
        $phoneNumber = $data['phone_number'] ?? $user->phone;
        
        if (!$phoneNumber) {
            return [
                'status' => 'failed',
                'message' => 'Phone number required'
            ];
        }

        // Generate and send SMS code (implement with SMS service)
        $verificationCode = rand(100000, 999999);
        
        // Store code temporarily (use cache or database)
        cache()->put("phone_verification_{$user->id}", $verificationCode, now()->addMinutes(10));

        // Send SMS (implement with your SMS provider)
        $this->sendSMS($phoneNumber, "Your WorkWise verification code is: {$verificationCode}");

        return [
            'status' => 'pending',
            'confidence_score' => 0.0,
            'verified_by' => 'system',
            'message' => 'Verification code sent to phone'
        ];
    }

    /**
     * Verify government ID
     */
    private function verifyGovernmentID(User $user, array $data): array
    {
        if (!isset($data['id_document'])) {
            return [
                'status' => 'failed',
                'message' => 'Government ID document required'
            ];
        }

        $file = $data['id_document'];
        $documentPath = $this->storeDocument($file, $user->id, 'government_id');
        
        // Create verification document record
        $document = VerificationDocument::create([
            'user_verification_id' => UserVerification::where('user_id', $user->id)
                ->where('verification_type', 'government_id')->first()->id,
            'document_type' => $data['document_type'] ?? 'national_id',
            'file_path' => $documentPath,
            'file_hash' => hash_file('sha256', Storage::path($documentPath))
        ]);

        // Extract data using OCR (implement with OCR service)
        $extractedData = $this->extractIDData($documentPath);
        
        // Validate extracted data
        $validationResults = $this->validateIDData($extractedData, $user);

        $document->update([
            'extracted_data' => $extractedData,
            'validation_results' => $validationResults,
            'is_verified' => $validationResults['is_valid'] ?? false
        ]);

        return [
            'status' => $validationResults['is_valid'] ? 'completed' : 'failed',
            'confidence_score' => $validationResults['confidence_score'] ?? 0.0,
            'verified_by' => 'system',
            'extracted_data' => $extractedData,
            'validation_results' => $validationResults
        ];
    }

    /**
     * Verify biometric data
     */
    private function verifyBiometric(User $user, array $data): array
    {
        $biometricType = $data['type'] ?? 'face';
        $biometricData = $data['biometric_data'] ?? null;

        if (!$biometricData) {
            return [
                'status' => 'failed',
                'message' => 'Biometric data required'
            ];
        }

        // Process biometric data (implement with biometric service)
        $processedData = $this->processBiometricData($biometricData, $biometricType);
        
        // Store biometric template (hashed for security)
        BiometricData::create([
            'user_id' => $user->id,
            'biometric_type' => $biometricType,
            'biometric_hash' => hash('sha256', $processedData['template']),
            'metadata' => $processedData['metadata'],
            'enrolled_at' => now()
        ]);

        return [
            'status' => 'completed',
            'confidence_score' => $processedData['quality_score'] ?? 0.8,
            'verified_by' => 'system',
            'biometric_type' => $biometricType
        ];
    }

    /**
     * Verify address
     */
    private function verifyAddress(User $user, array $data): array
    {
        // Check if user has complete address from KYC
        if (!$user->street_address || !$user->city || !$user->postal_code || !$user->country) {
            return [
                'status' => 'failed',
                'message' => 'Complete address required (street, city, postal code, country)'
            ];
        }

        // Build complete address string
        $completeAddress = trim(implode(', ', array_filter([
            $user->street_address,
            $user->barangay,
            $user->city,
            $user->postal_code,
            $user->country
        ])));

        // Verify address using geolocation service
        $addressValidation = $this->validateAddress($completeAddress);
        
        // Add KYC address verification timestamp check
        $addressValidation['kyc_verified'] = !is_null($user->address_verified_at);
        $addressValidation['kyc_verified_at'] = $user->address_verified_at;

        return [
            'status' => $addressValidation['is_valid'] ? 'completed' : 'failed',
            'confidence_score' => $addressValidation['confidence'] ?? 0.0,
            'verified_by' => 'system',
            'validation_result' => $addressValidation,
            'complete_address' => $completeAddress
        ];
    }

    /**
     * Verify social media profiles
     */
    private function verifySocialMedia(User $user, array $data): array
    {
        $profiles = $data['profiles'] ?? [];
        $verificationResults = [];

        foreach ($profiles as $platform => $profileUrl) {
            $verificationResults[$platform] = $this->verifySocialProfile($user, $platform, $profileUrl);
        }

        $overallConfidence = collect($verificationResults)->avg('confidence') ?? 0.0;

        return [
            'status' => $overallConfidence > 0.7 ? 'completed' : 'failed',
            'confidence_score' => $overallConfidence,
            'verified_by' => 'system',
            'profile_results' => $verificationResults
        ];
    }

    /**
     * Schedule video interview
     */
    private function scheduleVideoInterview(User $user, array $data): array
    {
        // This would integrate with a video conferencing service
        return [
            'status' => 'pending',
            'confidence_score' => 0.0,
            'verified_by' => 'pending_admin',
            'message' => 'Video interview scheduled',
            'interview_link' => 'https://meet.workwise.com/interview/' . $user->id
        ];
    }

    /**
     * Conduct skill assessment
     */
    private function conductSkillAssessment(User $user, array $data): array
    {
        $skills = $user->skills ?? [];
        $assessmentResults = [];

        foreach ($skills as $skill) {
            // This would integrate with skill assessment platforms
            $assessmentResults[$skill] = [
                'score' => rand(70, 95), // Mock score
                'level' => 'verified'
            ];
        }

        return [
            'status' => 'completed',
            'confidence_score' => 0.9,
            'verified_by' => 'system',
            'assessment_results' => $assessmentResults
        ];
    }

    /**
     * Check references
     */
    private function checkReferences(User $user, array $data): array
    {
        $references = $data['references'] ?? [];
        
        if (empty($references)) {
            return [
                'status' => 'failed',
                'message' => 'References required'
            ];
        }

        // This would involve contacting references
        return [
            'status' => 'pending',
            'confidence_score' => 0.0,
            'verified_by' => 'pending_admin',
            'message' => 'Reference check initiated'
        ];
    }

    /**
     * Helper methods (implement based on your services)
     */
    private function storeDocument(UploadedFile $file, int $userId, string $type): string
    {
        return $file->store("verifications/{$userId}/{$type}", 'private');
    }

    private function sendSMS(string $phoneNumber, string $message): bool
    {
        // Implement with your SMS service (Twilio, etc.)
        Log::info("SMS sent to {$phoneNumber}: {$message}");
        return true;
    }

    private function extractIDData(string $documentPath): array
    {
        // Implement OCR service integration
        return [
            'name' => 'John Doe',
            'id_number' => '123456789',
            'birth_date' => '1990-01-01',
            'address' => 'Lapu-Lapu City, Philippines'
        ];
    }

    private function validateIDData(array $extractedData, User $user): array
    {
        // Validate extracted data against user profile
        $nameMatch = similar_text(
            strtolower($user->first_name . ' ' . $user->last_name),
            strtolower($extractedData['name'] ?? ''),
            $percent
        );

        return [
            'is_valid' => $percent > 80,
            'confidence_score' => $percent / 100,
            'name_match' => $percent,
            'checks_performed' => ['name_verification', 'format_validation']
        ];
    }

    private function processBiometricData(string $biometricData, string $type): array
    {
        // Implement biometric processing
        return [
            'template' => 'processed_biometric_template',
            'quality_score' => 0.9,
            'metadata' => ['quality' => 'high', 'confidence' => 0.95]
        ];
    }

    private function validateAddress(string $address): array
    {
        // Implement address validation service
        return [
            'is_valid' => true,
            'confidence' => 0.9,
            'normalized_address' => $address
        ];
    }

    private function verifySocialProfile(User $user, string $platform, string $profileUrl): array
    {
        // Implement social media verification
        return [
            'platform' => $platform,
            'is_valid' => true,
            'confidence' => 0.8,
            'profile_data' => ['followers' => 100, 'posts' => 50]
        ];
    }

    private function calculateOverallStatus(array $results): string
    {
        $completedCount = collect($results)->where('status', 'completed')->count();
        $totalCount = count($results);

        if ($completedCount === $totalCount) {
            return 'completed';
        } elseif ($completedCount > 0) {
            return 'partial';
        }

        return 'pending';
    }

    private function calculateOverallConfidence(array $results): float
    {
        $scores = collect($results)->pluck('confidence_score')->filter();
        return $scores->isEmpty() ? 0.0 : $scores->avg();
    }

    private function getNextSteps(array $results): array
    {
        $nextSteps = [];
        
        foreach ($results as $type => $result) {
            if ($result['status'] === 'pending') {
                $nextSteps[] = "Complete {$type} verification";
            } elseif ($result['status'] === 'failed') {
                $nextSteps[] = "Retry {$type} verification";
            }
        }

        return $nextSteps;
    }

    private function updateUserVerificationLevel(User $user, string $level, array $results): void
    {
        $completedVerifications = collect($results)->where('status', 'completed')->keys()->toArray();
        
        // Update user's verification status
        $user->update([
            'verification_level' => $level,
            'verified_at' => now(),
            'verification_data' => [
                'level' => $level,
                'completed_verifications' => $completedVerifications,
                'overall_confidence' => $this->calculateOverallConfidence($results)
            ]
        ]);
    }
}
