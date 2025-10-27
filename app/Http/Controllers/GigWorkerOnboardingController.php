<?php

namespace App\Http\Controllers;

use App\Models\PortfolioItem;
use App\Mail\ProfileSubmitted;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GigWorkerOnboardingController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
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

        \Log::info('Gig worker onboarding started', [
            'user_id' => $user->id,
            'has_profile_photo' => $request->hasFile('profile_photo'),
            'profile_photo_size' => $request->hasFile('profile_photo') ? $request->file('profile_photo')->getSize() : 0,
            'has_id_front' => $request->hasFile('id_front_image'),
            'has_id_back' => $request->hasFile('id_back_image'),
            'portfolio_count' => count($request->input('portfolio_items', [])),
            'all_files' => array_keys($request->allFiles())
        ]);

        // Validate the onboarding data
        $validated = $request->validate([
            // Step 1: Basic Info
            'professional_title' => 'required|string|max:255',
            'hourly_rate' => 'required|numeric|min:5|max:10000',
            'bio' => 'required|string|min:50|max:2000',
            'profile_photo' => 'nullable|image|max:2048',

            // Step 2: Hierarchical Skills
            'broad_category' => 'required|string|max:255',
            'specific_services' => 'required|array|min:2',
            'specific_services.*' => 'string|max:255',
            'skills_with_experience' => 'required|array|min:3',
            'skills_with_experience.*.skill' => 'required|string|max:100',
            'skills_with_experience.*.experience_level' => 'required|in:beginner,intermediate,expert',

            // Step 3: Portfolio Items (optional)
            'portfolio_items' => 'nullable|array|max:10',
            'portfolio_items.*.title' => 'required|string|max:255',
            'portfolio_items.*.description' => 'nullable|string|max:1000',
            'portfolio_items.*.project_url' => 'nullable|url',
            'portfolio_items.*.project_type' => 'required|in:web,mobile,design,writing,other',
            'portfolio_items.*.images' => 'nullable|array|max:5',
            'portfolio_items.*.images.*' => 'image|max:2048',

            // Step 4: ID Verification & Address
            'id_type' => 'required|string|in:national_id,drivers_license,passport,philhealth_id,sss_id,umid,voters_id,prc_id',
            'id_front_image' => 'required|image|max:5120',
            'id_back_image' => 'required|image|max:5120',
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'barangay' => 'nullable|string|max:100',
            'postal_code' => 'required|string|max:20',
            'kyc_country' => 'required|string|max:100',

            // Step 5: Availability
            'working_hours' => 'required|array',
            'timezone' => 'required|string|max:100',
            'preferred_communication' => 'required|array|min:1',
            'preferred_communication.*' => 'string|in:email,chat,video_call,phone',
            'availability_notes' => 'nullable|string|max:500',
        ]);

        // Handle profile photo upload to Cloudinary
        if ($request->hasFile('profile_photo')) {
            \Log::info('Uploading profile photo to Cloudinary', ['user_id' => $user->id]);
            $result = $this->cloudinaryService->uploadProfilePicture($request->file('profile_photo'), $user->id);
            if ($result) {
                $validated['profile_photo'] = $result['secure_url'];
                \Log::info('Profile photo uploaded successfully', ['url' => $result['secure_url']]);
            } else {
                \Log::error('Failed to upload profile photo', ['user_id' => $user->id]);
                return back()->withErrors(['profile_photo' => 'Failed to upload profile photo. Please try again.'])->withInput();
            }
        }

        // Handle ID images upload with secure storage to Cloudinary
        if ($request->hasFile('id_front_image')) {
            \Log::info('Uploading ID front image to Cloudinary', ['user_id' => $user->id]);
            $result = $this->cloudinaryService->uploadIdVerification($request->file('id_front_image'), $user->id, 'front');
            if ($result) {
                $validated['id_front_image'] = $result['secure_url'];
                \Log::info('ID front image uploaded successfully', ['url' => $result['secure_url']]);
            } else {
                \Log::error('Failed to upload ID front image', ['user_id' => $user->id]);
                return back()->withErrors(['id_front_image' => 'Failed to upload ID front image. Please try again.'])->withInput();
            }
        }
        if ($request->hasFile('id_back_image')) {
            \Log::info('Uploading ID back image to Cloudinary', ['user_id' => $user->id]);
            $result = $this->cloudinaryService->uploadIdVerification($request->file('id_back_image'), $user->id, 'back');
            if ($result) {
                $validated['id_back_image'] = $result['secure_url'];
                \Log::info('ID back image uploaded successfully', ['url' => $result['secure_url']]);
            } else {
                \Log::error('Failed to upload ID back image', ['user_id' => $user->id]);
                return back()->withErrors(['id_back_image' => 'Failed to upload ID back image. Please try again.'])->withInput();
            }
        }
        $validated['id_verification_status'] = 'pending';

        // Map kyc_country to country field (override registration country with KYC verified country)
        if (isset($validated['kyc_country'])) {
            $validated['country'] = $validated['kyc_country'];
        }
        unset($validated['kyc_country']); // Remove temporary field
        
        // Mark address as verified when ID is submitted
        $validated['address_verified_at'] = now();

        // Update user profile
        try {
            $user->update(array_merge($validated, [
                'profile_completed' => true,
                'profile_status' => 'pending', // Requires admin approval
                'tutorial_completed' => true,
                'onboarding_step' => 6, // Completed all steps (changed from 7 after removing language step)
            ]));
            
            \Log::info('User profile updated successfully', ['user_id' => $user->id]);
        } catch (\Exception $e) {
            \Log::error('User profile update failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Failed to save profile. Please try again.'])->withInput();
        }

        // Create portfolio items
        if (!empty($validated['portfolio_items'])) {
            \Log::info('Uploading portfolio items', [
                'user_id' => $user->id,
                'count' => count($validated['portfolio_items'])
            ]);
            
            foreach ($validated['portfolio_items'] as $index => $portfolioData) {
                // Handle portfolio images upload to Cloudinary
                $imageUrls = [];
                if (isset($portfolioData['images'])) {
                    foreach ($portfolioData['images'] as $imageIndex => $image) {
                        if ($image instanceof \Illuminate\Http\UploadedFile) {
                            // Use combined index as integer (portfolio index * 100 + image index for uniqueness)
                            $combinedIndex = ($index * 100) + $imageIndex;
                            \Log::info('Uploading portfolio image', [
                                'user_id' => $user->id,
                                'portfolio_index' => $index,
                                'image_index' => $imageIndex
                            ]);
                            $result = $this->cloudinaryService->uploadPortfolioItem($image, $user->id, $combinedIndex);
                            if ($result) {
                                $imageUrls[] = $result['secure_url'];
                                \Log::info('Portfolio image uploaded successfully', ['url' => $result['secure_url']]);
                            } else {
                                \Log::warning('Portfolio image upload failed', [
                                    'user_id' => $user->id,
                                    'portfolio_index' => $index,
                                    'image_index' => $imageIndex
                                ]);
                            }
                        }
                    }
                }

                PortfolioItem::create([
                    'user_id' => $user->id,
                    'title' => $portfolioData['title'],
                    'description' => $portfolioData['description'] ?? null,
                    'project_url' => $portfolioData['project_url'] ?? null,
                    'project_type' => $portfolioData['project_type'],
                    'images' => $imageUrls,
                    'tags' => $validated['skills_with_experience'] ? array_column($validated['skills_with_experience'], 'skill') : [],
                    'display_order' => $index,
                ]);
            }
        }

        // Send profile submitted confirmation email
        try {
            Mail::to($user->email)->send(new ProfileSubmitted($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send profile submitted email: ' . $e->getMessage());
        }

        \Log::info('Gig worker onboarding completed successfully', [
            'user_id' => $user->id,
            'profile_photo_uploaded' => isset($validated['profile_photo']),
            'id_verification_uploaded' => isset($validated['id_front_image']) && isset($validated['id_back_image']),
            'portfolio_items_count' => !empty($validated['portfolio_items']) ? count($validated['portfolio_items']) : 0
        ]);

        return redirect()->route('jobs.index')->with('success',
            'Your profile has been submitted for review. You\'ll be notified once your ID is verified and profile is approved.');
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

