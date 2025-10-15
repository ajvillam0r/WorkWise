<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFreelancerSkillRequest extends FormRequest
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
        $freelancerId = auth()->user()->freelancer->id ?? null;

        return [
            'skill_id' => [
                'required',
                'exists:skills,id',
                Rule::unique('freelancer_skills')->where(function ($query) use ($freelancerId) {
                    return $query->where('freelancer_id', $freelancerId);
                })->ignore($this->route('skill')),
            ],
            'proficiency_level' => 'required|in:beginner,intermediate,advanced,expert',
            'years_of_experience' => 'nullable|integer|min:0|max:50',
            'description' => 'nullable|string|max:1000',
            'is_featured' => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
            'projects_completed' => 'nullable|integer|min:0',
            'average_rating' => 'nullable|numeric|min:0|max:5',
            'last_used' => 'nullable|date|before_or_equal:today',
            'display_order' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Validate that average_rating is provided only if projects_completed > 0
            if ($this->average_rating !== null && (!$this->projects_completed || $this->projects_completed == 0)) {
                $validator->errors()->add('average_rating', 'Average rating can only be provided if you have completed projects.');
            }

            // Validate years of experience vs proficiency level
            if ($this->years_of_experience !== null && $this->proficiency_level) {
                $minYears = [
                    'beginner' => 0,
                    'intermediate' => 1,
                    'advanced' => 3,
                    'expert' => 5
                ];

                if ($this->years_of_experience < $minYears[$this->proficiency_level]) {
                    $validator->errors()->add('years_of_experience', 
                        "Years of experience should be at least {$minYears[$this->proficiency_level]} for {$this->proficiency_level} level."
                    );
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'skill_id.required' => 'Please select a skill.',
            'skill_id.exists' => 'The selected skill is invalid.',
            'skill_id.unique' => 'You have already added this skill to your profile.',
            'proficiency_level.required' => 'Proficiency level is required.',
            'proficiency_level.in' => 'Please select a valid proficiency level.',
            'years_of_experience.integer' => 'Years of experience must be a whole number.',
            'years_of_experience.min' => 'Years of experience cannot be negative.',
            'years_of_experience.max' => 'Years of experience cannot exceed 50 years.',
            'description.max' => 'Description cannot exceed 1000 characters.',
            'hourly_rate.numeric' => 'Hourly rate must be a valid number.',
            'hourly_rate.min' => 'Hourly rate cannot be negative.',
            'hourly_rate.max' => 'Hourly rate is too high.',
            'projects_completed.integer' => 'Projects completed must be a whole number.',
            'projects_completed.min' => 'Projects completed cannot be negative.',
            'average_rating.numeric' => 'Average rating must be a valid number.',
            'average_rating.min' => 'Average rating cannot be negative.',
            'average_rating.max' => 'Average rating cannot exceed 5.',
            'last_used.date' => 'Please enter a valid date for last used.',
            'last_used.before_or_equal' => 'Last used date cannot be in the future.',
            'display_order.integer' => 'Display order must be a number.',
            'display_order.min' => 'Display order cannot be negative.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'skill_id' => 'skill',
            'proficiency_level' => 'proficiency level',
            'years_of_experience' => 'years of experience',
            'description' => 'description',
            'is_featured' => 'featured skill',
            'hourly_rate' => 'hourly rate',
            'projects_completed' => 'projects completed',
            'average_rating' => 'average rating',
            'last_used' => 'last used',
            'display_order' => 'display order',
        ];
    }
}
