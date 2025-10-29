<?php

namespace App\Services;

use App\Models\User;

class ProfileCompletionService
{
    /**
     * Calculate profile completion percentage and identify missing fields
     *
     * @param User $user
     * @return array
     */
    public function calculateCompletion(User $user): array
    {
        // Only calculate for gig workers
        if (!$user->isGigWorker()) {
            return [
                'percentage' => 100,
                'missing_fields' => [],
                'is_complete' => true,
            ];
        }

        $requiredFields = [
            'professional_title' => 'Professional Title',
            'hourly_rate' => 'Hourly Rate',
            'bio' => 'Professional Bio',
            'profile_picture' => 'Profile Picture',
            'broad_category' => 'Service Category',
            'specific_services' => 'Specific Services (min 2)',
            'skills_with_experience' => 'Skills with Experience (min 3)',
            'street_address' => 'Street Address',
            'city' => 'City',
            'country' => 'Country',
            'working_hours' => 'Working Hours',
            'timezone' => 'Timezone',
            'preferred_communication' => 'Preferred Communication Methods',
            'id_verification_status' => 'ID Verification',
            'email_verified_at' => 'Email Verification',
        ];

        $missingFields = [];
        $completedCount = 0;
        $totalCount = count($requiredFields);

        foreach ($requiredFields as $field => $label) {
            $isComplete = false;

            switch ($field) {
                case 'specific_services':
                    $isComplete = is_array($user->specific_services) && count($user->specific_services) >= 2;
                    break;

                case 'skills_with_experience':
                    $isComplete = is_array($user->skills_with_experience) && count($user->skills_with_experience) >= 3;
                    break;

                case 'id_verification_status':
                    $isComplete = $user->id_verification_status === 'verified';
                    break;

                case 'email_verified_at':
                    $isComplete = $user->email_verified_at !== null;
                    break;

                case 'working_hours':
                case 'preferred_communication':
                    $isComplete = is_array($user->$field) && !empty($user->$field);
                    break;

                case 'bio':
                    $isComplete = !empty($user->bio) && strlen($user->bio) >= 50;
                    break;

                case 'hourly_rate':
                    $isComplete = $user->hourly_rate !== null && $user->hourly_rate >= 5;
                    break;

                default:
                    $isComplete = !empty($user->$field);
                    break;
            }

            if ($isComplete) {
                $completedCount++;
            } else {
                $missingFields[] = $label;
            }
        }

        $percentage = round(($completedCount / $totalCount) * 100);

        return [
            'percentage' => $percentage,
            'missing_fields' => $missingFields,
            'is_complete' => $percentage === 100,
            'completed_count' => $completedCount,
            'total_count' => $totalCount,
        ];
    }

    /**
     * Get profile completion data for display
     *
     * @param User $user
     * @return array
     */
    public function getCompletionData(User $user): array
    {
        $completion = $this->calculateCompletion($user);

        return [
            'percentage' => $completion['percentage'],
            'is_complete' => $completion['is_complete'],
            'missing_count' => count($completion['missing_fields']),
            'missing_fields' => $completion['missing_fields'],
            'status' => $this->getCompletionStatus($completion['percentage']),
        ];
    }

    /**
     * Get completion status label
     *
     * @param int $percentage
     * @return string
     */
    private function getCompletionStatus(int $percentage): string
    {
        if ($percentage === 100) {
            return 'complete';
        } elseif ($percentage >= 75) {
            return 'almost_complete';
        } elseif ($percentage >= 50) {
            return 'in_progress';
        } else {
            return 'incomplete';
        }
    }
}



