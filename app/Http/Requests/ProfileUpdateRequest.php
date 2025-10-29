<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isGigWorker = $user->user_type === 'gig_worker';

        $rules = [
            // Basic information
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'bio' => ['nullable', 'string', 'max:1000'],
            
            // Address fields
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'street_address' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            
            'profile_photo' => ['nullable', 'image', 'max:2048'], // 2MB max
            'profile_picture' => ['nullable', 'image', 'max:5120'], // 5MB max for Cloudinary
        ];

        if ($isGigWorker) {
            // Gig worker-specific fields
            $rules = array_merge($rules, [
                'professional_title' => ['nullable', 'string', 'max:255'],
                'hourly_rate' => ['nullable', 'numeric', 'min:5', 'max:500'],
                
                // Gig worker onboarding fields (AI matching basis)
                'broad_category' => ['nullable', 'string', 'max:255'],
                'specific_services' => ['nullable', 'array'],
                'specific_services.*' => ['string', 'max:255'],
                'skills_with_experience' => ['nullable', 'array'],
                'working_hours' => ['nullable', 'array'],
                'timezone' => ['nullable', 'string', 'max:255'],
                'preferred_communication' => ['nullable', 'array'],
                'availability_notes' => ['nullable', 'string', 'max:500'],
            ]);
        } else {
            // Employer-specific fields
            $rules = array_merge($rules, [
                'company_name' => ['nullable', 'string', 'max:255'],
                'work_type_needed' => ['nullable', 'string', 'max:255'],
                'budget_range' => ['nullable', 'string', 'max:255'],
                'project_intent' => ['nullable', 'string', 'max:1000'],
            ]);
        }

        return $rules;
    }
}
