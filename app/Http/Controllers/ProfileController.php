<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\CloudinaryService;
use App\Services\ProfileCompletionService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    protected $cloudinaryService;
    protected $profileCompletionService;

    public function __construct(
        CloudinaryService $cloudinaryService,
        ProfileCompletionService $profileCompletionService
    ) {
        $this->cloudinaryService = $cloudinaryService;
        $this->profileCompletionService = $profileCompletionService;
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        // Load portfolio items for gig workers
        $user = $request->user();
        $user->load('portfolioItems');
        
        // Get profile completion data for gig workers
        $profileCompletion = null;
        if ($user->isGigWorker()) {
            $profileCompletion = $this->profileCompletionService->getCompletionData($user);
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'profileCompletion' => $profileCompletion,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Handle profile picture upload to Cloudinary
        if ($request->hasFile('profile_picture')) {
            try {
                // Delete old profile picture from Cloudinary if exists
                if ($user->profile_picture) {
                    $publicId = $this->cloudinaryService->extractPublicId($user->profile_picture);
                    if ($publicId) {
                        $this->cloudinaryService->deleteImage($publicId);
                    }
                }

                // Upload new profile picture to Cloudinary
                $uploadResult = $this->cloudinaryService->uploadProfilePicture(
                    $request->file('profile_picture'), 
                    $user->id
                );

                if ($uploadResult) {
                    $validated['profile_picture'] = $uploadResult['secure_url'];
                } else {
                    return Redirect::route('profile.edit')->with('error', 'Failed to upload profile picture. Please try again.');
                }
            } catch (\Exception $e) {
                Log::error('Profile picture upload failed: ' . $e->getMessage());
                return Redirect::route('profile.edit')->with('error', 'Failed to upload profile picture. Please try again.');
            }
        } else {
            // Remove profile_picture from validated data if no file uploaded
            unset($validated['profile_picture']);
        }

        // Handle legacy profile photo upload (migrate to Cloudinary)
        if ($request->hasFile('profile_photo')) {
            try {
                // Delete old profile photo from Cloudinary if exists
                if ($user->profile_photo && str_contains($user->profile_photo, 'cloudinary')) {
                    $publicId = $this->cloudinaryService->extractPublicId($user->profile_photo);
                    if ($publicId) {
                        $this->cloudinaryService->deleteImage($publicId);
                    }
                }

                // Upload new profile photo to Cloudinary
                $result = $this->cloudinaryService->uploadProfilePicture($request->file('profile_photo'), $user->id);
                if ($result) {
                    $validated['profile_photo'] = $result['secure_url'];
                } else {
                    return Redirect::route('profile.edit')->with('error', 'Failed to upload profile photo. Please try again.');
                }
            } catch (\Exception $e) {
                Log::error('Profile photo upload failed: ' . $e->getMessage());
                return Redirect::route('profile.edit')->with('error', 'Failed to upload profile photo.');
            }
        } else {
            // Remove profile_photo from validated data if no file uploaded
            unset($validated['profile_photo']);
        }

        // Handle skills array properly
        if (isset($validated['skills'])) {
            if (is_string($validated['skills'])) {
                // If skills is a string, convert to array
                $validated['skills'] = array_filter(array_map('trim', explode(',', $validated['skills'])));
            } elseif (is_array($validated['skills'])) {
                // If skills is already an array, clean it up
                $validated['skills'] = array_filter(array_map('trim', $validated['skills']));
            }
        }

        // Handle languages array properly
        if (isset($validated['languages'])) {
            if (is_string($validated['languages'])) {
                // If languages is a string, convert to array
                $validated['languages'] = array_filter(array_map('trim', explode(',', $validated['languages'])));
            } elseif (is_array($validated['languages'])) {
                // If languages is already an array, clean it up
                $validated['languages'] = array_filter(array_map('trim', $validated['languages']));
            }
        }

        // Fill user with validated data
        try {
            $user->fill($validated);

            // Handle email verification reset
            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            // Update profile completion status
            $user->profile_completed = $this->calculateProfileCompletion($user);

            // Save the user
            $user->save();

            return Redirect::route('profile.edit')->with('status', 'profile-updated');
        } catch (\Exception $e) {
            Log::error('Profile update failed: ' . $e->getMessage());
            return Redirect::route('profile.edit')->with('error', 'Failed to update profile. Please try again.');
        }
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateProfileCompletion($user): bool
    {
        $requiredFields = ['first_name', 'last_name', 'email', 'bio', 'barangay'];

        if ($user->user_type === 'gig_worker') {
            $requiredFields = array_merge($requiredFields, [
                'professional_title', 'hourly_rate', 'skills'
            ]);
        } else {
            $requiredFields = array_merge($requiredFields, [
                'company_name', 'work_type_needed'
            ]);
        }

        $completedFields = 0;
        foreach ($requiredFields as $field) {
            if ($field === 'skills' && is_array($user->skills) && count($user->skills) > 0) {
                $completedFields++;
            } elseif ($field !== 'skills' && !empty($user->$field)) {
                $completedFields++;
            }
        }

        // Consider profile complete if 80% or more fields are filled
        return ($completedFields / count($requiredFields)) >= 0.8;
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
