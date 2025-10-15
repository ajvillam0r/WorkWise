<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFreelancerExperienceRequest extends FormRequest
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
            'job_title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'employment_type' => 'required|in:full_time,part_time,contract,freelance,internship,temporary',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'boolean',
            'description' => 'nullable|string|max:2000',
            'start_date' => 'required|date|before_or_equal:today',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'skills_used' => 'nullable|array',
            'skills_used.*' => 'string|max:100',
            'achievements' => 'nullable|array',
            'achievements.*' => 'string|max:500',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:100',
            'salary_range' => 'nullable|string|max:100',
            'company_size' => 'nullable|in:startup,small,medium,large,enterprise',
            'industry' => 'nullable|string|max:100',
            'display_order' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // If is_current is true, end_date should be null
            if ($this->is_current && $this->end_date) {
                $validator->errors()->add('end_date', 'End date should not be provided for current positions.');
            }

            // If is_current is false, end_date should be provided
            if (!$this->is_current && !$this->end_date) {
                $validator->errors()->add('end_date', 'End date is required for past positions.');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'job_title.required' => 'Job title is required.',
            'job_title.max' => 'Job title cannot exceed 255 characters.',
            'company_name.required' => 'Company name is required.',
            'company_name.max' => 'Company name cannot exceed 255 characters.',
            'employment_type.required' => 'Employment type is required.',
            'employment_type.in' => 'Please select a valid employment type.',
            'description.max' => 'Description cannot exceed 2000 characters.',
            'start_date.required' => 'Start date is required.',
            'start_date.date' => 'Please enter a valid start date.',
            'start_date.before_or_equal' => 'Start date cannot be in the future.',
            'end_date.date' => 'Please enter a valid end date.',
            'end_date.after' => 'End date must be after start date.',
            'skills_used.*.max' => 'Each skill cannot exceed 100 characters.',
            'achievements.*.max' => 'Each achievement cannot exceed 500 characters.',
            'technologies.*.max' => 'Each technology cannot exceed 100 characters.',
            'company_size.in' => 'Please select a valid company size.',
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
            'job_title' => 'job title',
            'company_name' => 'company name',
            'employment_type' => 'employment type',
            'location' => 'location',
            'is_remote' => 'remote work',
            'description' => 'job description',
            'start_date' => 'start date',
            'end_date' => 'end date',
            'is_current' => 'current position',
            'skills_used' => 'skills used',
            'achievements' => 'achievements',
            'technologies' => 'technologies',
            'salary_range' => 'salary range',
            'company_size' => 'company size',
            'industry' => 'industry',
            'display_order' => 'display order',
        ];
    }
}
