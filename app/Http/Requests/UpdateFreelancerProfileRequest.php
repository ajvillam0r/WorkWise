<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFreelancerProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isFreelancer();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
            'availability_status' => 'nullable|in:available,busy,unavailable',
            'is_available_for_work' => 'boolean',
            'location' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:100',
            'website_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'portfolio_url' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20|regex:/^[\+]?[0-9\s\-\(\)]+$/',
            'is_profile_public' => 'boolean',
            'preferred_project_size' => 'nullable|in:small,medium,large',
            'work_preference' => 'nullable|in:remote,onsite,hybrid',
            'minimum_project_budget' => 'nullable|numeric|min:0',
            'maximum_project_budget' => 'nullable|numeric|min:0|gte:minimum_project_budget',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.max' => 'The professional title cannot exceed 255 characters.',
            'bio.max' => 'The bio cannot exceed 2000 characters.',
            'hourly_rate.numeric' => 'The hourly rate must be a valid number.',
            'hourly_rate.min' => 'The hourly rate cannot be negative.',
            'hourly_rate.max' => 'The hourly rate is too high.',
            'availability_status.in' => 'Please select a valid availability status.',
            'website_url.url' => 'Please enter a valid website URL.',
            'linkedin_url.url' => 'Please enter a valid LinkedIn URL.',
            'github_url.url' => 'Please enter a valid GitHub URL.',
            'portfolio_url.url' => 'Please enter a valid portfolio URL.',
            'phone.regex' => 'Please enter a valid phone number.',
            'maximum_project_budget.gte' => 'Maximum budget must be greater than or equal to minimum budget.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'title' => 'professional title',
            'bio' => 'biography',
            'hourly_rate' => 'hourly rate',
            'availability_status' => 'availability status',
            'is_available_for_work' => 'work availability',
            'location' => 'location',
            'timezone' => 'timezone',
            'website_url' => 'website URL',
            'linkedin_url' => 'LinkedIn URL',
            'github_url' => 'GitHub URL',
            'portfolio_url' => 'portfolio URL',
            'phone' => 'phone number',
            'is_profile_public' => 'profile visibility',
            'preferred_project_size' => 'preferred project size',
            'work_preference' => 'work preference',
            'minimum_project_budget' => 'minimum project budget',
            'maximum_project_budget' => 'maximum project budget',
        ];
    }
}
