<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFreelancerEducationRequest extends FormRequest
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
            'institution_name' => 'required|string|max:255',
            'degree_type' => 'required|in:high_school,associate,bachelor,master,doctorate,certificate,diploma,other',
            'field_of_study' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date|before_or_equal:today',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'gpa' => 'nullable|numeric|min:0|max:4.0',
            'location' => 'nullable|string|max:255',
            'activities_and_societies' => 'nullable|string|max:1000',
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
                $validator->errors()->add('end_date', 'End date should not be provided for current education.');
            }

            // If is_current is false, end_date should be provided
            if (!$this->is_current && !$this->end_date) {
                $validator->errors()->add('end_date', 'End date is required for completed education.');
            }

            // Validate GPA based on common scales
            if ($this->gpa !== null) {
                if ($this->gpa < 0 || $this->gpa > 4.0) {
                    $validator->errors()->add('gpa', 'GPA must be between 0.0 and 4.0.');
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
            'institution_name.required' => 'Institution name is required.',
            'institution_name.max' => 'Institution name cannot exceed 255 characters.',
            'degree_type.required' => 'Degree type is required.',
            'degree_type.in' => 'Please select a valid degree type.',
            'field_of_study.max' => 'Field of study cannot exceed 255 characters.',
            'description.max' => 'Description cannot exceed 1000 characters.',
            'start_date.required' => 'Start date is required.',
            'start_date.date' => 'Please enter a valid start date.',
            'start_date.before_or_equal' => 'Start date cannot be in the future.',
            'end_date.date' => 'Please enter a valid end date.',
            'end_date.after' => 'End date must be after start date.',
            'gpa.numeric' => 'GPA must be a valid number.',
            'gpa.min' => 'GPA cannot be negative.',
            'gpa.max' => 'GPA cannot exceed 4.0.',
            'location.max' => 'Location cannot exceed 255 characters.',
            'activities_and_societies.max' => 'Activities and societies cannot exceed 1000 characters.',
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
            'institution_name' => 'institution name',
            'degree_type' => 'degree type',
            'field_of_study' => 'field of study',
            'description' => 'description',
            'start_date' => 'start date',
            'end_date' => 'end date',
            'is_current' => 'current education',
            'gpa' => 'GPA',
            'location' => 'location',
            'activities_and_societies' => 'activities and societies',
            'display_order' => 'display order',
        ];
    }
}
