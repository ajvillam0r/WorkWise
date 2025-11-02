<?php

namespace App\Http\Controllers;

use App\Models\PortfolioItem;
use App\Mail\ProfileSubmitted;
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
            'has_profile_picture' => $request->hasFile('profile_picture'),
            'profile_picture_size' => $request->hasFile('profile_picture') ? $request->file('profile_picture')->getSize() : 0,
            'has_id_front' => $request->hasFile('id_front_image'),
            'has_id_back' => $request->hasFile('id_back_image'),
            'portfolio_count' => count($request->input('portfolio_items', [])),
            'all_files' => array_keys($request->allFiles())
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

            // Step 3: Portfolio Items (optional)
            'portfolio_items' => 'nullable|array|max:10',
            'portfolio_items.*.title' => 'required|string|max:255',
            'portfolio_items.*.description' => 'nullable|string|max:1000',
            'portfolio_items.*.project_url' => 'nullable|url',
            'portfolio_items.*.project_type' => 'required|in:web,mobile,design,writing,other',
            'portfolio_items.*.images' => 'nullable|array|max:5',
            'portfolio_items.*.images.*' => 'image|max:2048',

            // Step 4: ID Verification & Address
            'id_type' => 'nullable|string|in:national_id,drivers_license,passport,philhealth_id,sss_id,umid,voters_id,prc_id',
            'id_front_image' => 'nullable|image|max:5120',
            'id_back_image' => 'nullable|image|max:5120',
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'kyc_country' => 'required|string|max:100',

            // Step 5: Availability
            'working_hours' => 'required|array',
            'timezone' => 'required|string|max:100',
            'preferred_communication' => 'required|array|min:1',
            'preferred_communication.*' => 'string|in:email,chat,video_call,phone',
            'availability_notes' => 'nullable|string|max:500',
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
            
            'id_front_image.image' => 'ID front must be an image file.',
            'id_front_image.max' => 'ID front image must not exceed 5MB.',
            'id_back_image.image' => 'ID back must be an image file.',
            'id_back_image.max' => 'ID back image must not exceed 5MB.',
            'street_address.required' => 'Street address is required.',
            'city.required' => 'City is required.',
            'postal_code.required' => 'Postal code is required.',
            'kyc_country.required' => 'Country is required.',
            
            'working_hours.required' => 'Please set your working hours.',
            'timezone.required' => 'Timezone selection is required.',
            'preferred_communication.required' => 'Please select at least one communication method.',
            'preferred_communication.min' => 'Please select at least one communication method.',
        ]);

        // Handle profile picture upload to R2
        if ($request->hasFile('profile_picture')) {
            try {
                \Log::info('Uploading profile picture to R2', ['user_id' => $user->id]);
                $path = Storage::disk('r2')->putFile('profiles/' . $user->id, $request->file('profile_picture'));
                if ($path) {
                    // Use app proxy URL as fallback while R2 DNS propagates
                    $validated['profile_picture'] = '/r2/' . $path;
                    \Log::info('Profile picture uploaded successfully', ['url' => $validated['profile_picture']]);
                } else {
                    \Log::error('Failed to upload profile picture', ['user_id' => $user->id]);
                    return back()->withErrors(['profile_picture' => 'Failed to upload profile picture. Please try again.'])->withInput();
                }
            } catch (\Exception $e) {
                \Log::error('Profile picture upload failed: ' . $e->getMessage(), ['user_id' => $user->id]);
                return back()->withErrors(['profile_picture' => 'Failed to upload profile picture. Please try again.'])->withInput();
            }
        }

        // Handle ID images upload to R2
        if ($request->hasFile('id_front_image')) {
            try {
                \Log::info('Uploading ID front image to R2', ['user_id' => $user->id]);
                $path = Storage::disk('r2')->putFile('id_verification/' . $user->id, $request->file('id_front_image'));
                if ($path) {
                    $validated['id_front_image'] = Storage::disk('r2')->url($path);
                    \Log::info('ID front image uploaded successfully', ['url' => $validated['id_front_image']]);
                } else {
                    \Log::error('Failed to upload ID front image', ['user_id' => $user->id]);
                    return back()->withErrors(['id_front_image' => 'Failed to upload ID front image. Please try again.'])->withInput();
                }
            } catch (\Exception $e) {
                \Log::error('ID front image upload failed: ' . $e->getMessage(), ['user_id' => $user->id]);
                return back()->withErrors(['id_front_image' => 'Failed to upload ID front image. Please try again.'])->withInput();
            }
        }
        if ($request->hasFile('id_back_image')) {
            try {
                \Log::info('Uploading ID back image to R2', ['user_id' => $user->id]);
                $path = Storage::disk('r2')->putFile('id_verification/' . $user->id, $request->file('id_back_image'));
                if ($path) {
                    $validated['id_back_image'] = Storage::disk('r2')->url($path);
                    \Log::info('ID back image uploaded successfully', ['url' => $validated['id_back_image']]);
                } else {
                    \Log::error('Failed to upload ID back image', ['user_id' => $user->id]);
                    return back()->withErrors(['id_back_image' => 'Failed to upload ID back image. Please try again.'])->withInput();
                }
            } catch (\Exception $e) {
                \Log::error('ID back image upload failed: ' . $e->getMessage(), ['user_id' => $user->id]);
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

        // Create portfolio items with sequential image uploads
        if (!empty($validated['portfolio_items'])) {
            \Log::info('Uploading portfolio items', [
                'user_id' => $user->id,
                'count' => count($validated['portfolio_items'])
            ]);
            
            // Step 1: Collect all images that need to be uploaded
            $allImagesToUpload = [];
            foreach ($validated['portfolio_items'] as $itemIndex => $portfolioData) {
                if (isset($portfolioData['images']) && is_array($portfolioData['images'])) {
                    foreach ($portfolioData['images'] as $imageIndex => $image) {
                        if ($image instanceof \Illuminate\Http\UploadedFile) {
                            $combinedIndex = ($itemIndex * 100) + $imageIndex;
                            $allImagesToUpload[] = [
                                'file' => $image,
                                'itemIndex' => $itemIndex,
                                'imageIndex' => $imageIndex,
                                'combinedIndex' => $combinedIndex,
                            ];
                        }
                    }
                }
            }
            
            \Log::info('Total portfolio images to upload', ['count' => count($allImagesToUpload)]);
            
            // Step 2: Upload all images sequentially (one at a time)
            $uploadedUrls = []; // Indexed by itemIndex
            $uploadedCount = 0;
            $failedCount = 0;
            
            foreach ($allImagesToUpload as $imageData) {
                try {
                    \Log::info('Uploading portfolio image sequentially', [
                        'user_id' => $user->id,
                        'portfolio_index' => $imageData['itemIndex'],
                        'image_index' => $imageData['imageIndex'],
                        'progress' => ($uploadedCount + $failedCount + 1) . '/' . count($allImagesToUpload)
                    ]);
                    
                    // Upload to R2
                    $path = Storage::disk('r2')->putFile('portfolios/' . $user->id, $imageData['file']);
                    
                    if ($path) {
                        $url = Storage::disk('r2')->url($path);
                        
                        // Store URL indexed by portfolio item
                        if (!isset($uploadedUrls[$imageData['itemIndex']])) {
                            $uploadedUrls[$imageData['itemIndex']] = [];
                        }
                        $uploadedUrls[$imageData['itemIndex']][] = $url;
                        $uploadedCount++;
                        
                        \Log::info('Portfolio image uploaded successfully', [
                            'url' => $url,
                            'item_index' => $imageData['itemIndex']
                        ]);
                        
                        // Small delay to avoid rate limiting (100ms)
                        usleep(100000);
                    } else {
                        $failedCount++;
                        \Log::warning('Portfolio image upload returned no result', [
                            'user_id' => $user->id,
                            'portfolio_index' => $imageData['itemIndex'],
                            'image_index' => $imageData['imageIndex']
                        ]);
                    }
                } catch (\Exception $e) {
                    $failedCount++;
                    \Log::error('Portfolio image upload exception', [
                        'user_id' => $user->id,
                        'portfolio_index' => $imageData['itemIndex'],
                        'image_index' => $imageData['imageIndex'],
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Continue with other images even if one fails
                }
            }
            
            \Log::info('Portfolio upload summary', [
                'user_id' => $user->id,
                'total' => count($allImagesToUpload),
                'uploaded' => $uploadedCount,
                'failed' => $failedCount
            ]);
            
            // Step 3: Create portfolio items with their uploaded image URLs
            foreach ($validated['portfolio_items'] as $index => $portfolioData) {
                $imageUrls = $uploadedUrls[$index] ?? [];
                
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
                
                \Log::info('Portfolio item created', [
                    'user_id' => $user->id,
                    'item_index' => $index,
                    'images_count' => count($imageUrls)
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
            'profile_picture_uploaded' => isset($validated['profile_picture']),
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

