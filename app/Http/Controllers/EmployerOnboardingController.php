<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EmployerOnboardingController extends Controller
{

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

        // If profile is already completed, redirect to jobs
        if ($user->profile_completed) {
            return redirect()->route('jobs.index');
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

        \Log::info('Employer onboarding started', [
            'user_id' => $user->id,
            'has_profile_picture' => $request->hasFile('profile_picture'),
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
            'company_size.required' => 'Please select your company size.',
            'industry.required' => 'Please specify your industry.',
            'company_description.required' => 'Please provide a description of your company or business needs.',
            'company_description.min' => 'Company description must be at least 50 characters.',
            'primary_hiring_needs.required' => 'Please select at least one hiring need category.',
            'primary_hiring_needs.min' => 'Please select at least one hiring need category.',
            'typical_project_budget.required' => 'Please select your typical project budget range.',
            'typical_project_duration.required' => 'Please select your typical project duration.',
            'preferred_experience_level.required' => 'Please select your preferred experience level.',
            'hiring_frequency.required' => 'Please select how frequently you hire.',
        ]);

        // Handle profile picture upload to R2
        if ($request->hasFile('profile_picture')) {
            try {
                $path = Storage::disk('r2')->putFile('profiles/' . $user->id, $request->file('profile_picture'));
                if ($path) {
                    // Use app proxy URL as fallback while R2 DNS propagates
                    $validated['profile_picture'] = '/r2/' . $path;
                    
                    \Log::info('Profile picture uploaded successfully', [
                        'user_id' => $user->id,
                        'url' => $validated['profile_picture']
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to upload profile picture: ' . $e->getMessage());
                // Continue without profile picture
            }
        }

        // Handle business registration document upload to R2
        if ($request->hasFile('business_registration_document')) {
            try {
                // Set longer timeout for large file uploads
                set_time_limit(120);
                
                $file = $request->file('business_registration_document');
                $path = Storage::disk('r2')->putFile('business_documents/' . $user->id, $file);
                if ($path) {
                    $validated['business_registration_document'] = Storage::disk('r2')->url($path);
                    
                    \Log::info('Business registration document uploaded successfully', [
                        'user_id' => $user->id,
                        'url' => $validated['business_registration_document']
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to upload business registration document: ' . $e->getMessage());
                // Continue without document - don't block onboarding for failed upload
                unset($validated['business_registration_document']);
            }
        }

        // Update user profile
        $user->update(array_merge($validated, [
            'profile_completed' => true,
            'profile_status' => 'approved' // Employers are auto-approved
        ]));

        \Log::info('Employer onboarding completed successfully', [
            'user_id' => $user->id,
            'company_name' => $user->company_name,
            'industry' => $user->industry
        ]);

        return redirect()->route('jobs.index')->with('success',
            'Welcome to WorkWise! Your profile is complete. You can now start posting jobs and hiring gig workers.');
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

        return redirect()->route('jobs.index')->with('info',
            'You can complete your profile later from your profile settings to attract better candidates.');
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

