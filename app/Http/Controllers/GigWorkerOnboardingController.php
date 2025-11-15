<?php

namespace App\Http\Controllers;

use App\Models\PortfolioItem;
use App\Mail\ProfileSubmitted;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class GigWorkerOnboardingController extends Controller
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
     * Show the gig worker onboarding page
     */
    public function show(): Response|RedirectResponse
    {
        $user = auth()->user();

        // Redirect if not a gig worker
        if ($user->user_type !== 'gig_worker') {
            return redirect()->route('jobs.index');
        }

        // If profile is already completed, redirect to jobs
        if ($user->profile_completed) {
            return redirect()->route('jobs.index');
        }

        // Load skills taxonomy
        $skillsTaxonomy = $this->getSkillsTaxonomy();

        return Inertia::render('Onboarding/GigWorkerOnboarding', [
            'user' => $user,
            'skillsTaxonomy' => $skillsTaxonomy,
        ]);
    }

    /**
     * Handle the gig worker onboarding form submission
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        Log::info('ONBOARDING_STARTED', [
            'event' => 'onboarding_started',
            'user_id' => $user->id,
            'user_type' => 'gig_worker',
            'user_email' => $user->email,
            'files_submitted' => [
                'profile_picture' => $request->hasFile('profile_picture'),
                'resume_file' => $request->hasFile('resume_file'),
            ],
            'file_sizes' => [
                'profile_picture_mb' => $request->hasFile('profile_picture') ? round($request->file('profile_picture')->getSize() / 1048576, 2) : 0,
                'resume_mb' => $request->hasFile('resume_file') ? round($request->file('resume_file')->getSize() / 1048576, 2) : 0,
            ],
            'data_submitted' => [
                'has_portfolio_link' => !empty($request->input('portfolio_link')),
                'broad_category' => $request->input('broad_category'),
                'specific_services_count' => count($request->input('specific_services', [])),
                'skills_count' => count($request->input('skills_with_experience', [])),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);

        // Validate the onboarding data with custom error messages
        $validated = $request->validate([
            // Step 1: Basic Info
            'professional_title' => 'required|string|max:255',
            'hourly_rate' => 'required|numeric|min:5|max:10000',
            'bio' => 'required|string|min:50|max:2000',
            'profile_picture' => 'nullable|image|max:2048',

            // Step 2: Hierarchical Skills
            'broad_category' => 'required|string|max:255',
            'specific_services' => 'required|array|min:2',
            'specific_services.*' => 'string|max:255',
            'skills_with_experience' => 'required|array|min:3',
            'skills_with_experience.*.skill' => 'required|string|max:100',
            'skills_with_experience.*.experience_level' => 'required|in:beginner,intermediate,expert',

            // Step 3: Portfolio (simplified)
            'portfolio_link' => 'nullable|url|max:500',
            'resume_file' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ], [
            // Custom validation messages
            'professional_title.required' => 'Professional title is required.',
            'hourly_rate.required' => 'Hourly rate is required.',
            'hourly_rate.min' => 'Hourly rate must be at least ₱5.',
            'hourly_rate.max' => 'Hourly rate cannot exceed ₱10,000.',
            'bio.required' => 'Professional bio is required.',
            'bio.min' => 'Bio must be at least 50 characters long.',
            'profile_picture.image' => 'Profile picture must be an image file.',
            'profile_picture.max' => 'Profile picture must not exceed 2MB.',
            
            'broad_category.required' => 'Service category is required.',
            'specific_services.required' => 'Please select at least 2 specific services.',
            'specific_services.min' => 'Please select at least 2 specific services.',
            'skills_with_experience.required' => 'Please add at least 3 skills with experience levels.',
            'skills_with_experience.min' => 'Please add at least 3 skills with experience levels.',
            'skills_with_experience.*.skill.required' => 'Skill name is required.',
            'skills_with_experience.*.experience_level.required' => 'Experience level is required for each skill.',
            
            'resume_file.file' => 'Resume must be a valid file.',
            'resume_file.mimes' => 'Resume must be a PDF, DOC, or DOCX file.',
            'resume_file.max' => 'Resume file must not exceed 5MB. Please compress your document.',
        ]);

        // Handle profile picture upload to R2 using FileUploadService
        if ($request->hasFile('profile_picture')) {
            $profilePicture = $request->file('profile_picture');
            
            Log::info('Profile picture upload started', [
                'user_id' => $user->id,
                'file_name' => $profilePicture->getClientOriginalName(),
                'file_size' => $profilePicture->getSize(),
                'mime_type' => $profilePicture->getMimeType(),
            ]);

            // Validate file before upload
            $validation = $this->fileUploadService->validateFile($profilePicture, [
                'type' => 'image',
                'max_size' => 2097152, // 2MB
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
            ]);

            if (!$validation['success']) {
                Log::warning('Profile picture validation failed', [
                    'user_id' => $user->id,
                    'error' => $validation['error'],
                    'error_code' => $validation['error_code'],
                ]);

                return back()
                    ->withErrors([
                        'profile_picture' => $validation['error']
                    ])
                    ->with('error_codes', [
                        'profile_picture' => $validation['error_code']
                    ])
                    ->withInput();
            }

            // Upload with retry logic
            $uploadResult = $this->fileUploadService->uploadWithRetry(
                $profilePicture,
                'profiles',
                2, // max retries
                [
                    'user_id' => $user->id,
                    'user_type' => 'gig_worker',
                    'use_proxy' => true, // Use app proxy URL for profile pictures
                ]
            );

            if (!$uploadResult['success']) {
                Log::error('Profile picture upload failed after retries', [
                    'user_id' => $user->id,
                    'error' => $uploadResult['error'],
                    'error_code' => $uploadResult['error_code'],
                ]);

                return back()
                    ->withErrors([
                        'profile_picture' => 'Failed to upload profile picture. ' . $uploadResult['error']
                    ])
                    ->with('error_codes', [
                        'profile_picture' => $uploadResult['error_code']
                    ])
                    ->withInput();
            }

            $validated['profile_picture'] = $uploadResult['url'];
            
            Log::info('Profile picture uploaded successfully', [
                'user_id' => $user->id,
                'url' => $uploadResult['url'],
                'path' => $uploadResult['path'],
            ]);
        }

        // Handle resume file upload to R2 using FileUploadService
        if ($request->hasFile('resume_file')) {
            $resumeFile = $request->file('resume_file');
            
            Log::info('Resume file upload started', [
                'user_id' => $user->id,
                'file_name' => $resumeFile->getClientOriginalName(),
                'file_size' => $resumeFile->getSize(),
                'mime_type' => $resumeFile->getMimeType(),
            ]);

            // Validate file before upload
            $validation = $this->fileUploadService->validateFile($resumeFile, [
                'type' => 'document',
                'max_size' => 5242880, // 5MB
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
            ]);

            if (!$validation['success']) {
                Log::warning('Resume file validation failed', [
                    'user_id' => $user->id,
                    'error' => $validation['error'],
                    'error_code' => $validation['error_code'],
                ]);

                // Resume is optional, so we log the error but don't block onboarding
                Log::info('Resume upload skipped due to validation error, continuing onboarding', [
                    'user_id' => $user->id,
                ]);
            } else {
                // Upload with retry logic
                // Pass full directory path: portfolios/{user_id}/documents
                $uploadResult = $this->fileUploadService->uploadWithRetry(
                    $resumeFile,
                    'portfolios/' . $user->id . '/documents',
                    2, // max retries
                    [
                        'user_id' => null, // Don't append user_id again since it's in the path
                        'user_type' => 'gig_worker',
                    ]
                );

                if (!$uploadResult['success']) {
                    Log::error('Resume file upload failed after retries', [
                        'user_id' => $user->id,
                        'error' => $uploadResult['error'],
                        'error_code' => $uploadResult['error_code'],
                    ]);

                    // Resume is optional, so we log the error but don't block onboarding
                    Log::info('Resume upload failed, continuing onboarding without resume', [
                        'user_id' => $user->id,
                    ]);
                } else {
                    $validated['resume_file'] = $uploadResult['url'];
                    
                    Log::info('Resume file uploaded successfully', [
                        'user_id' => $user->id,
                        'url' => $uploadResult['url'],
                        'path' => $uploadResult['path'],
                    ]);

                    // Rate limiting: small delay after upload (150ms)
                    usleep(150000);
                }
            }
        }

        // Update user profile
        try {
            $user->update(array_merge($validated, [
                'profile_completed' => true,
                'profile_status' => 'pending', // Requires admin approval
                'tutorial_completed' => true,
                'onboarding_step' => 4, // Completed all steps
            ]));
            
            Log::info('ONBOARDING_PROFILE_UPDATED', [
                'event' => 'onboarding_profile_updated',
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
                'profile_status' => 'pending',
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('ONBOARDING_PROFILE_UPDATE_FAILED', [
                'event' => 'onboarding_profile_update_failed',
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
                'error_message' => $e->getMessage(),
                'error_type' => get_class($e),
                'stack_trace' => $e->getTraceAsString(),
                'timestamp' => now()->toIso8601String(),
            ]);
            return back()->withErrors(['error' => 'Failed to save profile. Please try again.'])->withInput();
        }



        // Send profile submitted confirmation email
        try {
            Mail::to($user->email)->send(new ProfileSubmitted($user));
            
            Log::info('ONBOARDING_EMAIL_SENT', [
                'event' => 'onboarding_email_sent',
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
                'email' => $user->email,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('ONBOARDING_EMAIL_FAILED', [
                'event' => 'onboarding_email_failed',
                'user_id' => $user->id,
                'user_type' => 'gig_worker',
                'email' => $user->email,
                'error_message' => $e->getMessage(),
                'error_type' => get_class($e),
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        Log::info('ONBOARDING_COMPLETED', [
            'event' => 'onboarding_completed',
            'user_id' => $user->id,
            'user_type' => 'gig_worker',
            'user_email' => $user->email,
            'completion_summary' => [
                'profile_picture_uploaded' => isset($validated['profile_picture']),
                'portfolio_link_saved' => !empty($validated['portfolio_link']),
                'resume_file_uploaded' => isset($validated['resume_file']),
                'profile_status' => 'pending',
            ],
            'timestamp' => now()->toIso8601String(),
        ]);

        return redirect()->route('gig-worker.dashboard')->with('success',
            'Profile completed successfully! You\'ll be notified once your profile is approved.');
    }

    /**
     * Skip onboarding (optional for gig workers)
     */
    public function skip(): RedirectResponse
    {
        $user = auth()->user();

        $user->update([
            'profile_completed' => true,
            'profile_status' => 'approved',
            'tutorial_completed' => true,
        ]);

        return redirect()->route('jobs.index')->with('info',
            'You can complete your profile later from your profile settings.');
    }

    /**
     * Get skills taxonomy from JSON file
     */
    private function getSkillsTaxonomy(): array
    {
        $jsonPath = base_path('full_freelance_services_taxonomy.json');
        
        if (file_exists($jsonPath)) {
            $jsonContent = file_get_contents($jsonPath);
            return json_decode($jsonContent, true);
        }

        return ['services' => []];
    }
}

