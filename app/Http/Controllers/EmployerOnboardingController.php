<?php

namespace App\Http\Controllers;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EmployerOnboardingController extends Controller
{
    /**
     * File upload service instance
     */
    protected FileUploadService $fileUploadService;

    /**
     * Constructor
     */
    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Show the employer onboarding page
     */
    public function show(): Response|RedirectResponse
    {
        $user = auth()->user();

        // Redirect if not an employer
        if ($user->user_type !== 'employer') {
            return redirect()->route('jobs.index');
        }

        // If profile is already completed, redirect to employer dashboard
        if ($user->profile_completed) {
            return redirect()->route('employer.dashboard');
        }

        // Load industry options and service categories
        $industries = $this->getIndustries();
        $serviceCategories = $this->getServiceCategories();

        return Inertia::render('Onboarding/EmployerOnboarding', [
            'user' => $user,
            'industries' => $industries,
            'serviceCategories' => $serviceCategories,
        ]);
    }

    /**
     * Handle the employer onboarding form submission
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        Log::info('Employer onboarding submission started', [
            'user_id' => $user->id,
            'email' => $user->email,
            'has_profile_picture' => $request->hasFile('profile_picture'),
            'has_business_document' => $request->hasFile('business_registration_document'),
            'company_name' => $request->input('company_name'),
            'company_size' => $request->input('company_size'),
            'industry' => $request->input('industry'),
        ]);

        // Validate the onboarding data
        $validated = $request->validate([
            // Step 1: Company/Individual Information
            'company_name' => 'nullable|string|max:255',
            'company_size' => 'required|in:individual,2-10,11-50,51-200,200+',
            'industry' => 'required|string|max:255',
            'company_website' => 'nullable|url|max:255',
            'company_description' => 'required|string|min:50|max:1000',
            'profile_picture' => 'nullable|image|max:2048',
            
            // Step 2: Hiring Preferences
            'primary_hiring_needs' => 'required|array|min:1',
            'primary_hiring_needs.*' => 'string|max:255',
            'typical_project_budget' => 'required|in:under_500,500-2000,2000-5000,5000-10000,10000+',
            'typical_project_duration' => 'required|in:short_term,medium_term,long_term,ongoing',
            'preferred_experience_level' => 'required|in:any,beginner,intermediate,expert',
            'hiring_frequency' => 'required|in:one_time,occasional,regular,ongoing',
            
            // Step 3: Verification (optional)
            'business_registration_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_id' => 'nullable|string|max:50',
        ], [
            // Step 1 validation messages
            'company_size.required' => 'Please select your company size to help us understand your hiring needs.',
            'company_size.in' => 'Please select a valid company size option.',
            'industry.required' => 'Please specify your industry to help match you with relevant gig workers.',
            'industry.max' => 'Industry name must not exceed 255 characters.',
            'company_website.url' => 'Please provide a valid website URL (e.g., https://example.com).',
            'company_website.max' => 'Website URL must not exceed 255 characters.',
            'company_description.required' => 'Please provide a description of your company or business needs to attract quality candidates.',
            'company_description.min' => 'Company description must be at least 50 characters to provide meaningful information to gig workers.',
            'company_description.max' => 'Company description must not exceed 1000 characters.',
            'profile_picture.image' => 'Profile picture must be an image file (JPG, PNG, GIF, or WebP).',
            'profile_picture.max' => 'Profile picture must not exceed 2MB in size.',
            
            // Step 2 validation messages
            'primary_hiring_needs.required' => 'Please select at least one category that represents your hiring needs.',
            'primary_hiring_needs.min' => 'Please select at least one hiring need category to help us match you with suitable gig workers.',
            'primary_hiring_needs.array' => 'Hiring needs must be provided as a list of categories.',
            'typical_project_budget.required' => 'Please select your typical project budget range to help gig workers understand your expectations.',
            'typical_project_budget.in' => 'Please select a valid budget range option.',
            'typical_project_duration.required' => 'Please select your typical project duration to help match you with available gig workers.',
            'typical_project_duration.in' => 'Please select a valid project duration option.',
            'preferred_experience_level.required' => 'Please select your preferred experience level for gig workers.',
            'preferred_experience_level.in' => 'Please select a valid experience level option.',
            'hiring_frequency.required' => 'Please indicate how frequently you plan to hire gig workers.',
            'hiring_frequency.in' => 'Please select a valid hiring frequency option.',
            
            // Step 3 validation messages
            'business_registration_document.file' => 'Business registration document must be a valid file.',
            'business_registration_document.mimes' => 'Business registration document must be a PDF, JPG, JPEG, or PNG file.',
            'business_registration_document.max' => 'Business registration document must not exceed 5MB in size.',
            'tax_id.max' => 'Tax ID must not exceed 50 characters.',
        ]);

        // Handle profile picture upload to R2 using FileUploadService
        if ($request->hasFile('profile_picture')) {
            // Increase execution time for file upload
            set_time_limit(120);
            
            Log::info('Employer profile picture upload started', [
                'user_id' => $user->id,
                'file_name' => $request->file('profile_picture')->getClientOriginalName(),
                'file_size' => $request->file('profile_picture')->getSize(),
            ]);

            // Validate file before upload
            $validation = $this->fileUploadService->validateFile(
                $request->file('profile_picture'),
                [
                    'type' => 'image',
                    'user_id' => $user->id,
                    'user_type' => 'employer',
                ]
            );

            if (!$validation['success']) {
                Log::warning('Employer profile picture validation failed', [
                    'user_id' => $user->id,
                    'error' => $validation['error'],
                    'error_code' => $validation['error_code'],
                ]);

                return back()->withErrors([
                    'profile_picture' => $validation['error']
                ])->withInput();
            }

            // Upload with retry logic (reduced retries to avoid timeout)
            $uploadResult = $this->fileUploadService->uploadWithRetry(
                $request->file('profile_picture'),
                'profiles',
                1, // Reduced from 2 to 1 retry to avoid timeout
                [
                    'user_id' => $user->id,
                    'user_type' => 'employer',
                    'use_proxy' => true, // Use app proxy URL for profile pictures
                ]
            );

            if ($uploadResult['success']) {
                $validated['profile_picture'] = $uploadResult['url'];
                
                Log::info('Employer profile picture uploaded successfully', [
                    'user_id' => $user->id,
                    'url' => $uploadResult['url'],
                    'path' => $uploadResult['path'],
                ]);
            } else {
                Log::error('Employer profile picture upload failed', [
                    'user_id' => $user->id,
                    'error' => $uploadResult['error'],
                    'error_code' => $uploadResult['error_code'],
                ]);

                // Profile picture is optional - continue without it but inform user
                return back()->withErrors([
                    'profile_picture' => 'Failed to upload profile picture. Please try again or continue without it.'
                ])->withInput();
            }
        }

        // Handle business registration document upload to R2 using FileUploadService
        if ($request->hasFile('business_registration_document')) {
            Log::info('Business registration document upload started', [
                'user_id' => $user->id,
                'file_name' => $request->file('business_registration_document')->getClientOriginalName(),
                'file_size' => $request->file('business_registration_document')->getSize(),
            ]);

            // Validate file before upload
            $validation = $this->fileUploadService->validateFile(
                $request->file('business_registration_document'),
                [
                    'type' => 'document',
                    'user_id' => $user->id,
                    'user_type' => 'employer',
                ]
            );

            if (!$validation['success']) {
                Log::warning('Business registration document validation failed', [
                    'user_id' => $user->id,
                    'error' => $validation['error'],
                    'error_code' => $validation['error_code'],
                ]);

                // Document is optional - show warning but don't block onboarding
                return back()->withErrors([
                    'business_registration_document' => $validation['error'] . ' You can upload this later from your profile settings.'
                ])->withInput();
            }

            // Set longer timeout for large file uploads
            set_time_limit(120);

            // Upload with retry logic
            $uploadResult = $this->fileUploadService->uploadWithRetry(
                $request->file('business_registration_document'),
                'business_documents',
                2,
                [
                    'user_id' => $user->id,
                    'user_type' => 'employer',
                ]
            );

            if ($uploadResult['success']) {
                $validated['business_registration_document'] = $uploadResult['url'];
                
                Log::info('Business registration document uploaded successfully', [
                    'user_id' => $user->id,
                    'url' => $uploadResult['url'],
                    'path' => $uploadResult['path'],
                ]);
            } else {
                Log::warning('Business registration document upload failed - continuing without it', [
                    'user_id' => $user->id,
                    'error' => $uploadResult['error'],
                    'error_code' => $uploadResult['error_code'],
                ]);

                // Document is optional - continue without it, don't block onboarding
                // Remove from validated data to avoid storing null/empty value
                unset($validated['business_registration_document']);
            }
        }

        // Update user profile with transaction for data consistency
        try {
            $user->update(array_merge($validated, [
                'profile_completed' => true,
                'profile_status' => 'approved' // Employers are auto-approved
            ]));

            Log::info('ONBOARDING_COMPLETED', [
                'event' => 'onboarding_completed',
                'user_id' => $user->id,
                'user_type' => 'employer',
                'user_email' => $user->email,
                'completion_summary' => [
                    'company_name' => $user->company_name,
                    'company_size' => $user->company_size,
                    'industry' => $user->industry,
                    'profile_picture_uploaded' => isset($validated['profile_picture']),
                    'business_document_uploaded' => isset($validated['business_registration_document']),
                    'primary_hiring_needs_count' => count($validated['primary_hiring_needs'] ?? []),
                    'typical_project_budget' => $validated['typical_project_budget'] ?? null,
                    'hiring_frequency' => $validated['hiring_frequency'] ?? null,
                    'profile_status' => 'approved',
                ],
                'timestamp' => now()->toIso8601String(),
            ]);

            return redirect()->route('employer.dashboard')->with('success',
                'Welcome to WorkWise! Your employer profile is complete. You can now start posting jobs and hiring talented gig workers.');
                
        } catch (\Exception $e) {
            Log::error('ONBOARDING_PROFILE_UPDATE_FAILED', [
                'event' => 'onboarding_profile_update_failed',
                'user_id' => $user->id,
                'user_type' => 'employer',
                'error_message' => $e->getMessage(),
                'error_type' => get_class($e),
                'stack_trace' => $e->getTraceAsString(),
                'timestamp' => now()->toIso8601String(),
            ]);

            return back()->withErrors([
                'general' => 'Failed to complete onboarding. Please try again or contact support if the issue persists.'
            ])->withInput();
        }
    }

    /**
     * Skip onboarding (optional for employers)
     */
    public function skip(): RedirectResponse
    {
        $user = auth()->user();

        $user->update([
            'profile_completed' => true,
            'profile_status' => 'approved'
        ]);

        return redirect()->route('employer.dashboard')->with('info',
            'Welcome to WorkWise! You can complete your profile later from your profile settings to attract better candidates.');
    }

    /**
     * Get list of industries
     */
    private function getIndustries(): array
    {
        return [
            'Technology & IT',
            'Healthcare & Medical',
            'Education & Training',
            'Finance & Accounting',
            'Marketing & Advertising',
            'E-commerce & Retail',
            'Real Estate',
            'Hospitality & Tourism',
            'Manufacturing',
            'Construction',
            'Legal Services',
            'Media & Entertainment',
            'Non-Profit',
            'Consulting',
            'Automotive',
            'Agriculture',
            'Energy & Utilities',
            'Transportation & Logistics',
            'Food & Beverage',
            'Fashion & Beauty',
            'Sports & Fitness',
            'Government',
            'Telecommunications',
            'Other'
        ];
    }

    /**
     * Get service categories (matches gig worker's broad_category)
     */
    private function getServiceCategories(): array
    {
        return [
            'Web Development',
            'Mobile App Development',
            'UI/UX Design',
            'Graphic Design',
            'Content Writing',
            'Copywriting',
            'SEO & Digital Marketing',
            'Social Media Management',
            'Video Editing',
            'Photography',
            'Data Entry',
            'Virtual Assistant',
            'Customer Support',
            'Accounting & Bookkeeping',
            'Legal Services',
            'Translation',
            'Voice Over',
            '3D Modeling & Animation',
            'Game Development',
            'Software Testing',
            'DevOps & Cloud',
            'Database Administration',
            'Network Administration',
            'Cybersecurity',
            'Business Consulting',
            'Project Management',
            'Architecture & Interior Design',
            'Engineering',
            'Research & Analysis',
            'Other'
        ];
    }
}

