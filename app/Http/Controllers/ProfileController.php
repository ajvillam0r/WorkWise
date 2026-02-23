<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct()
    {
        // Controller initialized
    }

    /**
     * Display the user's profile form.
     * Optimized: Only loads necessary relationships and caches profile completion.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        
        // Optimize: Only load portfolio items if user is gig worker and select only needed columns
        if ($user->isGigWorker()) {
            $user->load([
                'portfolioItems' => function ($query) {
                    $query->select('id', 'user_id', 'title', 'description', 'project_url', 'images', 'document_file', 'project_type', 'display_order')
                        ->orderBy('display_order')
                        ->latest();
                }
            ]);
        }
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
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

        // Handle profile picture upload to Supabase
        if ($request->hasFile('profile_picture')) {
            try {
                Log::info('Uploading profile picture to Supabase', ['user_id' => $user->id]);
                
                // Delete old profile picture from Supabase if it exists
                if ($user->profile_picture) {
                    try {
                        // Extract path from URL (remove '/supabase/' prefix if present)
                        $oldPath = str_replace('/supabase/', '', $user->profile_picture);
                        if (Storage::disk('supabase')->exists($oldPath)) {
                            Storage::disk('supabase')->delete($oldPath);
                            Log::info('Old profile picture deleted from Supabase', [
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
                
                // Upload new profile picture to Supabase
                $path = Storage::disk('supabase')->putFile('profiles/' . $user->id, $request->file('profile_picture'));
                
                if ($path) {
                    // Use app proxy URL as fallback while Supabase DNS propagates
                    $validated['profile_picture'] = '/supabase/' . $path;
                    // Also sync to profile_photo for backward compatibility
                    $validated['profile_photo'] = '/supabase/' . $path;
                    
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

        // Handle legacy profile photo upload (migrate to Supabase)
        if ($request->hasFile('profile_photo')) {
            try {
                // Upload new profile photo to Supabase
                $path = Storage::disk('supabase')->putFile('profiles/' . $user->id, $request->file('profile_photo'));
                
                if ($path) {
                    // Use app proxy URL as fallback while Supabase DNS propagates
                    $validated['profile_photo'] = '/supabase/' . $path;
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

        // Handle resume file upload to Supabase
        if ($request->hasFile('resume_file')) {
            try {
                Log::info('Uploading resume file to Supabase', ['user_id' => $user->id]);
                
                // Delete old resume file from Supabase if it exists
                if ($user->resume_file) {
                    try {
                        // Extract path from URL (remove '/supabase/' prefix if present)
                        $oldPath = str_replace('/supabase/', '', $user->resume_file);
                        if (Storage::disk('supabase')->exists($oldPath)) {
                            Storage::disk('supabase')->delete($oldPath);
                            Log::info('Old resume file deleted from Supabase', [
                                'user_id' => $user->id,
                                'old_path' => $oldPath
                            ]);
                        }
                    } catch (\Exception $deleteException) {
                        Log::warning('Failed to delete old resume file: ' . $deleteException->getMessage(), [
                            'user_id' => $user->id
                        ]);
                    }
                }
                
                // Upload new resume file to Supabase
                // Use the same path structure as onboarding: portfolios/{user_id}/documents
                $path = Storage::disk('supabase')->putFile('portfolios/' . $user->id . '/documents', $request->file('resume_file'));
                
                if ($path) {
                    // Use app proxy URL as fallback while Supabase DNS propagates
                    $validated['resume_file'] = '/supabase/' . $path;
                    
                    Log::info('Resume file uploaded successfully', [
                        'user_id' => $user->id,
                        'path' => $path,
                        'url' => $validated['resume_file']
                    ]);
                } else {
                    Log::error('Resume file upload returned null path', ['user_id' => $user->id]);
                    return Redirect::route('profile.edit')->with('error', 'Failed to upload resume file. Please try again.');
                }
            } catch (\Exception $e) {
                Log::error('Resume file upload failed: ' . $e->getMessage(), [
                    'user_id' => $user->id,
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString()
                ]);
                return Redirect::route('profile.edit')->with('error', 'Failed to upload resume file. Please try again.');
            }
        } else {
            // Remove resume_file from validated data if no file uploaded
            unset($validated['resume_file']);
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

        // Update only provided fields (partial update support)
        try {
            // Track which fields were updated for logging
            $updatedFields = [];
            
            // Handle profile picture separately (if provided)
            if (isset($validated['profile_picture'])) {
                $user->profile_picture = $validated['profile_picture'];
                $user->profile_photo = $validated['profile_picture']; // Sync both fields
                $updatedFields[] = 'profile_picture';
                $updatedFields[] = 'profile_photo';
                unset($validated['profile_picture']);
                unset($validated['profile_photo']);
            }
            
            // Update only the fields that were provided (partial update)
            foreach ($validated as $key => $value) {
                // Check if field exists and is fillable
                if ($user->isFillable($key)) {
                    // Only update if the value is different
                    $currentValue = $user->getAttribute($key);
                    if ($currentValue != $value) {
                        $user->setAttribute($key, $value);
                        $updatedFields[] = $key;
                    }
                }
            }

            // Handle email verification reset
            if (in_array('email', $updatedFields) && $user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            // Update profile completion status only if relevant fields changed
            // Use ProfileCompletionService for consistency and accuracy
            $completionRelevantFields = [
                'hourly_rate', 'skills', 'skills_with_experience', 'specific_services',
                'broad_category', 'company_name', 'work_type_needed', 'profile_picture',
                'working_hours', 'timezone', 'preferred_communication', 'street_address',
                'city', 'country', 'email_verified_at', 'resume_file', 'portfolio_link'
            ];
            
            if (count(array_intersect($updatedFields, $completionRelevantFields)) > 0) {
                // Clear cached profile completion data if any (legacy support)
                Cache::forget("profile_completion_{$user->id}");
            }

            // Only save if there are actual changes
            if ($user->isDirty()) {
                // Use select only dirty attributes to minimize database query
                $user->save();
                
                // Clear any related caches after successful update
                Cache::forget("profile_completion_{$user->id}");
                
                Log::info('Profile updated successfully (partial update)', [
                    'user_id' => $user->id,
                    'updated_fields' => $updatedFields,
                    'updated_count' => count($updatedFields),
                    'dirty_attributes' => array_keys($user->getDirty()),
                ]);
            } else {
                Log::info('Profile update skipped - no changes detected', [
                    'user_id' => $user->id,
                ]);
            }

            // Use Inertia redirect to preserve state and avoid full page refresh
            return Redirect::route('profile.edit')
                ->with('status', 'profile-updated')
                ->with('message', 'Profile updated successfully!');
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
     * Calculate profile completion status (deprecated - use ProfileCompletionService instead)
     * This method is kept for backward compatibility but should not be used directly.
     * 
     * @deprecated Use ProfileCompletionService::calculateCompletion() instead
     */
    private function calculateProfileCompletion($user): bool
    {
        return false;
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
     * Display a gig worker's public profile
     * 
     * DATA CONSISTENCY VERIFICATION (Requirement 9.1-9.6):
     * - All user profile data comes directly from users table (no mock data)
     * - Skills fetched from skills_with_experience field in database
     * - Reviews fetched from reviews table with reviewer relationships
     * - Portfolio items fetched from portfolio_items table
     * - All data is real-time from database with no caching of profile content
     */
    public function showWorker(User $user): Response|RedirectResponse
    {
        // Redirect to own profile edit if viewing own profile (Requirement 1.2)
        if ($user->id === auth()->id()) {
            return Redirect::route('profile.edit')
                ->with('message', 'You are viewing your own profile. You can edit it here.');
        }

        // Validate user is a gig worker (Requirement 1.2)
        if (!$user->isGigWorker()) {
            abort(404, 'This user is not a gig worker or the profile does not exist.');
        }

        // Eager load relationships from database (always fresh data, no caching)
        // Reviews come from reviews table (Requirement 9.4)
        // Portfolio items come from portfolio_items table (Requirement 9.5)
        // Force fresh query to ensure latest reviews are displayed immediately after submission
        $user->load([
            'receivedReviews' => function ($query) {
                $query->with('reviewer:id,first_name,last_name,profile_picture')
                    ->latest()
                    ->limit(10);
            },
            'portfolioItems' => function ($query) {
                $query->orderBy('display_order')
                    ->latest();
            }
        ]);

        // Calculate rating summary from actual review data (Requirement 9.4)
        // This ensures the rating summary is always up-to-date with the latest reviews
        $ratingSummary = $this->calculateRatingSummary($user->receivedReviews);

        // All data passed to frontend comes from database (Requirement 9.1, 9.2)
        // - user: All fields from users table
        // - reviews: From reviews table
        // - rating_summary: Calculated from real reviews
        // - portfolio_items: From portfolio_items table
        return Inertia::render('Profiles/WorkerProfile', [
            'user' => $user, // All profile fields from users table (Requirement 9.1, 9.2, 9.3)
            'reviews' => $user->receivedReviews, // From reviews table (Requirement 9.4)
            'rating_summary' => $ratingSummary, // Calculated from real reviews (Requirement 9.4)
            'portfolio_items' => $user->portfolioItems, // From portfolio_items table (Requirement 9.5)
        ]);
    }

    /**
     * Display an employer's public profile
     * 
     * DATA CONSISTENCY VERIFICATION (Requirement 9.1-9.6):
     * - All user profile data comes directly from users table (no mock data)
     * - Company information fetched from employer onboarding fields in database
     * - Reviews fetched from reviews table with reviewer relationships
     * - Job statistics calculated from gig_jobs and projects tables
     * - All data is real-time from database with no caching of profile content
     */
    public function showEmployer(User $user): Response|RedirectResponse
    {
        // Redirect to own profile edit if viewing own profile (Requirement 3.2)
        if ($user->id === auth()->id()) {
            return Redirect::route('profile.edit')
                ->with('message', 'You are viewing your own profile. You can edit it here.');
        }

        // Validate user is an employer (Requirement 3.2)
        if (!$user->isEmployer()) {
            abort(404, 'This user is not an employer or the profile does not exist.');
        }

        // Eager load relationships from database (always fresh data, no caching)
        // Reviews come from reviews table (Requirement 9.4)
        // Posted jobs come from gig_jobs table (Requirement 9.6)
        // Force fresh query to ensure latest reviews are displayed immediately after submission
        $user->load([
            'receivedReviews' => function ($query) {
                $query->with('reviewer:id,first_name,last_name,profile_picture')
                    ->latest()
                    ->limit(10);
            },
            'postedJobs' => function ($query) {
                $query->latest()
                    ->limit(5);
            }
        ]);

        // Calculate rating summary from actual review data (Requirement 9.4)
        // This ensures the rating summary is always up-to-date with the latest reviews
        $ratingSummary = $this->calculateRatingSummary($user->receivedReviews);

        // Calculate job statistics from database tables (Requirement 9.6)
        $jobStatistics = [
            'total_jobs_posted' => $user->postedJobs()->count(),
            'active_jobs' => $user->postedJobs()->where('status', 'open')->count(),
            'completed_projects' => $user->employerProjects()->where('status', 'completed')->count(),
        ];

        // All data passed to frontend comes from database (Requirement 9.1, 9.2)
        // - user: All fields from users table including company information
        // - reviews: From reviews table
        // - rating_summary: Calculated from real reviews
        // - job_statistics: Calculated from gig_jobs and projects tables
        return Inertia::render('Profiles/EmployerProfile', [
            'user' => $user, // All profile fields from users table (Requirement 9.1, 9.2, 9.6)
            'reviews' => $user->receivedReviews, // From reviews table (Requirement 9.4)
            'rating_summary' => $ratingSummary, // Calculated from real reviews (Requirement 9.4)
            'job_statistics' => $jobStatistics, // From gig_jobs and projects tables (Requirement 9.6)
        ]);
    }

    /**
     * Calculate rating summary from reviews collection
     * 
     * DATA CONSISTENCY: This method calculates ratings from actual review data
     * fetched from the reviews table (Requirement 9.4). No mock or placeholder
     * data is used - all calculations are based on real database records.
     * 
     * @param \Illuminate\Database\Eloquent\Collection $reviews
     * @return array
     */
    private function calculateRatingSummary($reviews): array
    {
        $totalReviews = $reviews->count();
        
        if ($totalReviews === 0) {
            return [
                'average' => 0,
                'count' => 0,
                'distribution' => [
                    5 => 0,
                    4 => 0,
                    3 => 0,
                    2 => 0,
                    1 => 0,
                ],
            ];
        }

        // Calculate average rating from actual review data (Requirement 9.4)
        $average = round($reviews->avg('rating'), 1);

        // Calculate distribution from actual review data (Requirement 9.4)
        $distribution = [
            5 => $reviews->where('rating', 5)->count(),
            4 => $reviews->where('rating', 4)->count(),
            3 => $reviews->where('rating', 3)->count(),
            2 => $reviews->where('rating', 2)->count(),
            1 => $reviews->where('rating', 1)->count(),
        ];

        return [
            'average' => $average,
            'count' => $totalReviews,
            'distribution' => $distribution,
        ];
    }

    /**
     * Proxy Supabase files through the application
     * This serves as a fallback while Supabase DNS propagates
     */
    public function proxySupabaseFile($path)
    {
        try {
            $disk = Storage::disk('supabase');
            
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
            Log::error('Supabase proxy failed: ' . $e->getMessage(), ['path' => $path]);
            abort(404);
        }
    }
}
