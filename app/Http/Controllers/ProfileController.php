<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
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
    protected $profileCompletionService;

    public function __construct(
        ProfileCompletionService $profileCompletionService
    ) {
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
        
        Log::info('Profile update started', [
            'user_id' => $user->id,
            'has_profile_picture' => $request->hasFile('profile_picture'),
            'has_profile_photo' => $request->hasFile('profile_photo'),
            'all_files' => array_keys($request->allFiles()),
        ]);
        
        $validated = $request->validated();

        // Handle profile picture upload to R2
        if ($request->hasFile('profile_picture')) {
            try {
                Log::info('Uploading profile picture to R2', ['user_id' => $user->id]);
                
                // Delete old profile picture from R2 if it exists
                if ($user->profile_picture) {
                    try {
                        // Extract path from URL (remove '/r2/' prefix if present)
                        $oldPath = str_replace('/r2/', '', $user->profile_picture);
                        if (Storage::disk('r2')->exists($oldPath)) {
                            Storage::disk('r2')->delete($oldPath);
                            Log::info('Old profile picture deleted from R2', [
                                'user_id' => $user->id,
                                'old_path' => $oldPath
                            ]);
                        }
                    } catch (\Exception $deleteException) {
                        // Log but don't fail the upload if old file deletion fails
                        Log::warning('Failed to delete old profile picture: ' . $deleteException->getMessage(), [
                            'user_id' => $user->id
                        ]);
                    }
                }
                
                // Upload new profile picture to R2
                $path = Storage::disk('r2')->putFile('profiles/' . $user->id, $request->file('profile_picture'));
                
                if ($path) {
                    // Use app proxy URL as fallback while R2 DNS propagates
                    $validated['profile_picture'] = '/r2/' . $path;
                    // Also sync to profile_photo for backward compatibility
                    $validated['profile_photo'] = '/r2/' . $path;
                    
                    Log::info('Profile picture uploaded successfully', [
                        'user_id' => $user->id,
                        'path' => $path,
                        'url' => $validated['profile_picture']
                    ]);
                } else {
                    Log::error('Profile picture upload returned null path', ['user_id' => $user->id]);
                    return Redirect::route('profile.edit')->with('error', 'Failed to upload profile picture. Please try again.');
                }
            } catch (\Exception $e) {
                Log::error('Profile picture upload failed: ' . $e->getMessage(), [
                    'user_id' => $user->id,
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString()
                ]);
                return Redirect::route('profile.edit')->with('error', 'Failed to upload profile picture. Please try again.');
            }
        } else {
            // Remove profile_picture from validated data if no file uploaded
            unset($validated['profile_picture']);
            // Don't unset profile_photo if it already exists (preserve existing)
        }

        // Handle legacy profile photo upload (migrate to R2)
        if ($request->hasFile('profile_photo')) {
            try {
                // Upload new profile photo to R2
                $path = Storage::disk('r2')->putFile('profiles/' . $user->id, $request->file('profile_photo'));
                
                if ($path) {
                    // Use app proxy URL as fallback while R2 DNS propagates
                    $validated['profile_photo'] = '/r2/' . $path;
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
            // Ensure profile_picture is included in fill if it was uploaded
            if (isset($validated['profile_picture'])) {
                $user->profile_picture = $validated['profile_picture'];
                $user->profile_photo = $validated['profile_picture']; // Sync both fields
            }
            
            $user->fill($validated);

            // Handle email verification reset
            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            // Update profile completion status
            $user->profile_completed = $this->calculateProfileCompletion($user);

            // Force save to ensure database update
            $user->save();
            
            // Refresh user to ensure we have latest data
            $user->refresh();

            Log::info('Profile updated successfully', [
                'user_id' => $user->id,
                'updated_profile_picture' => $user->profile_picture,
                'updated_profile_photo' => $user->profile_photo,
                'is_dirty_profile_picture' => $user->isDirty('profile_picture'),
                'was_changed' => $user->wasChanged('profile_picture'),
            ]);

            return Redirect::route('profile.edit')->with('status', 'profile-updated');
        } catch (\Exception $e) {
            Log::error('Profile update failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
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

    /**
     * Proxy R2 files through the application
     * This serves as a fallback while R2 public URL DNS propagates
     */
    public function proxyR2File($path)
    {
        try {
            $disk = Storage::disk('r2');
            
            if (!$disk->exists($path)) {
                abort(404);
            }

            $file = $disk->get($path);
            $mimeType = $disk->mimeType($path);
            
            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Cache-Control', 'public, max-age=31536000')
                ->header('Access-Control-Allow-Origin', '*');
                
        } catch (\Exception $e) {
            Log::error('R2 proxy failed: ' . $e->getMessage(), ['path' => $path]);
            abort(404);
        }
    }
}
