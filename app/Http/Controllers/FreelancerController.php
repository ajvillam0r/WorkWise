<?php

namespace App\Http\Controllers;

use App\Models\Freelancer;
use App\Models\FreelancerExperience;
use App\Models\FreelancerEducation;
use App\Models\FreelancerPortfolio;
use App\Models\FreelancerCertification;
use App\Models\FreelancerLanguage;
use App\Models\FreelancerSkill;
use App\Models\Skill;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FreelancerController extends Controller
{
    /**
     * Display freelancer profile (public view for employers)
     */
    public function show(Freelancer $freelancer): Response
    {
        // Only show public profiles
        if (!$freelancer->is_profile_public) {
            abort(404);
        }

        $freelancer->load([
            'experiences' => function ($query) {
                $query->ordered();
            },
            'educations' => function ($query) {
                $query->ordered();
            },
            'portfolios' => function ($query) {
                $query->public()->ordered();
            },
            'certifications' => function ($query) {
                $query->active()->ordered();
            },
            'languages' => function ($query) {
                $query->ordered();
            },
            'skills' => function ($query) {
                $query->with('skill')->ordered();
            },
            'reviews' => function ($query) {
                $query->public()->with(['employer', 'project'])->latest()->limit(10);
            }
        ]);

        // Increment profile views
        $freelancer->increment('profile_views');

        return Inertia::render('Freelancer/Profile/Public', [
            'freelancer' => $freelancer,
            'stats' => [
                'total_projects' => $freelancer->total_projects_completed,
                'total_earnings' => $freelancer->total_earnings,
                'average_rating' => $freelancer->average_rating,
                'success_rate' => $freelancer->success_rate,
                'response_time' => $freelancer->average_response_time,
                'profile_views' => $freelancer->profile_views,
            ]
        ]);
    }

    /**
     * Display freelancer's own profile dashboard
     */
    public function dashboard(): Response
    {
        $user = auth()->user();
        
        if (!$user->isFreelancer()) {
            abort(403, 'Access denied');
        }

        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $freelancer->load([
            'experiences' => function ($query) {
                $query->ordered();
            },
            'educations' => function ($query) {
                $query->ordered();
            },
            'portfolios' => function ($query) {
                $query->ordered();
            },
            'certifications' => function ($query) {
                $query->ordered();
            },
            'languages' => function ($query) {
                $query->ordered();
            },
            'skills' => function ($query) {
                $query->with('skill')->ordered();
            }
        ]);

        return Inertia::render('Freelancer/Profile/Dashboard', [
            'freelancer' => $freelancer,
            'profileCompletion' => $freelancer->calculateProfileCompletion(),
            'stats' => [
                'total_projects' => $freelancer->total_projects_completed,
                'total_earnings' => $freelancer->total_earnings,
                'average_rating' => $freelancer->average_rating,
                'success_rate' => $freelancer->success_rate,
                'profile_views' => $freelancer->profile_views,
                'pending_invitations' => 0, // TODO: Implement invitations
            ]
        ]);
    }

    /**
     * Update basic profile information
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
            'availability_status' => 'nullable|in:available,busy,unavailable',
            'is_available_for_work' => 'boolean',
            'location' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:100',
            'website_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'github_url' => 'nullable|url|max:255',
            'portfolio_url' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'is_profile_public' => 'boolean',
        ]);

        $freelancer->update($validated);
        $freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Profile updated successfully',
            'freelancer' => $freelancer->fresh(),
            'profileCompletion' => $freelancer->calculateProfileCompletion()
        ]);
    }

    /**
     * Upload profile avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120' // 5MB
        ]);

        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        try {
            $cloudinaryService = app(CloudinaryService::class);
            
            // Delete old avatar if exists
            if ($freelancer->avatar_url) {
                $publicId = $cloudinaryService->extractPublicId($freelancer->avatar_url);
                if ($publicId) {
                    $cloudinaryService->deleteImage($publicId);
                }
            }

            // Upload new avatar to Cloudinary
            $result = $cloudinaryService->uploadProfilePicture($request->file('avatar'), $user->id);
            
            if (!$result) {
                return response()->json(['error' => 'Failed to upload avatar'], 500);
            }

            $freelancer->update(['avatar_url' => $result['secure_url']]);
            $freelancer->updateProfileCompletion();

            return response()->json([
                'message' => 'Avatar updated successfully',
                'avatar_url' => $result['secure_url']
            ]);

        } catch (Exception $e) {
            Log::error('Avatar upload failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to upload avatar'], 500);
        }
    }

    /**
     * Get all experiences
     */
    public function getExperiences(): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile;

        if (!$freelancer) {
            return response()->json(['experiences' => []]);
        }

        $experiences = $freelancer->experiences()->ordered()->get();

        return response()->json(['experiences' => $experiences]);
    }

    /**
     * Store new experience
     */
    public function storeExperience(Request $request): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'job_title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|in:full_time,part_time,contract,freelance,internship',
            'skills_used' => 'nullable|array',
            'achievements' => 'nullable|string|max:1000',
            'display_order' => 'nullable|integer|min:0'
        ]);

        $validated['freelancer_id'] = $freelancer->id;

        if ($validated['is_current'] ?? false) {
            $validated['end_date'] = null;
        }

        $experience = FreelancerExperience::create($validated);
        $freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Experience added successfully',
            'experience' => $experience
        ]);
    }

    /**
     * Update experience
     */
    public function updateExperience(Request $request, FreelancerExperience $experience): JsonResponse
    {
        $user = auth()->user();
        
        if ($experience->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'job_title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'location' => 'nullable|string|max:255',
            'employment_type' => 'nullable|in:full_time,part_time,contract,freelance,internship',
            'skills_used' => 'nullable|array',
            'achievements' => 'nullable|string|max:1000',
            'display_order' => 'nullable|integer|min:0'
        ]);

        if ($validated['is_current'] ?? false) {
            $validated['end_date'] = null;
        }

        $experience->update($validated);
        $experience->freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Experience updated successfully',
            'experience' => $experience->fresh()
        ]);
    }

    /**
     * Delete experience
     */
    public function deleteExperience(FreelancerExperience $experience): JsonResponse
    {
        $user = auth()->user();
        
        if ($experience->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $experience->delete();
        $experience->freelancer->updateProfileCompletion();

        return response()->json(['message' => 'Experience deleted successfully']);
    }

    /**
     * Get all educations
     */
    public function getEducations(): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile;

        if (!$freelancer) {
            return response()->json(['educations' => []]);
        }

        $educations = $freelancer->educations()->ordered()->get();

        return response()->json(['educations' => $educations]);
    }

    /**
     * Store new education
     */
    public function storeEducation(Request $request): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'degree_type' => 'required|in:high_school,associate,bachelor,master,doctorate,certificate,diploma',
            'field_of_study' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'gpa' => 'nullable|numeric|min:0|max:4',
            'location' => 'nullable|string|max:255',
            'activities_and_societies' => 'nullable|string|max:1000',
            'display_order' => 'nullable|integer|min:0'
        ]);

        $validated['freelancer_id'] = $freelancer->id;

        if ($validated['is_current'] ?? false) {
            $validated['end_date'] = null;
        }

        $education = FreelancerEducation::create($validated);
        $freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Education added successfully',
            'education' => $education
        ]);
    }

    /**
     * Update education
     */
    public function updateEducation(Request $request, FreelancerEducation $education): JsonResponse
    {
        $user = auth()->user();
        
        if ($education->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'degree_type' => 'required|in:high_school,associate,bachelor,master,doctorate,certificate,diploma',
            'field_of_study' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'gpa' => 'nullable|numeric|min:0|max:4',
            'location' => 'nullable|string|max:255',
            'activities_and_societies' => 'nullable|string|max:1000',
            'display_order' => 'nullable|integer|min:0'
        ]);

        if ($validated['is_current'] ?? false) {
            $validated['end_date'] = null;
        }

        $education->update($validated);
        $education->freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Education updated successfully',
            'education' => $education->fresh()
        ]);
    }

    /**
     * Delete education
     */
    public function deleteEducation(FreelancerEducation $education): JsonResponse
    {
        $user = auth()->user();
        
        if ($education->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $education->delete();
        $education->freelancer->updateProfileCompletion();

        return response()->json(['message' => 'Education deleted successfully']);
    }

    /**
     * Get all skills
     */
    public function getSkills(): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile;

        if (!$freelancer) {
            return response()->json(['skills' => [], 'availableSkills' => Skill::all()]);
        }

        $skills = $freelancer->skills()->with('skill')->ordered()->get();
        $availableSkills = Skill::whereNotIn('id', $skills->pluck('skill_id'))->get();

        return response()->json([
            'skills' => $skills,
            'availableSkills' => $availableSkills
        ]);
    }

    /**
     * Store new skill
     */
    public function storeSkill(Request $request): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $validated = $request->validate([
            'skill_id' => 'required|exists:skills,id',
            'proficiency_level' => 'required|in:beginner,intermediate,advanced,expert',
            'years_of_experience' => 'nullable|integer|min:0|max:50',
            'description' => 'nullable|string|max:500',
            'is_featured' => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
            'display_order' => 'nullable|integer|min:0'
        ]);

        $validated['freelancer_id'] = $freelancer->id;

        // Check if skill already exists for this freelancer
        $existingSkill = FreelancerSkill::where('freelancer_id', $freelancer->id)
            ->where('skill_id', $validated['skill_id'])
            ->first();

        if ($existingSkill) {
            return response()->json([
                'message' => 'This skill is already added to your profile'
            ], 422);
        }

        $skill = FreelancerSkill::create($validated);
        $freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Skill added successfully',
            'skill' => $skill->load('skill')
        ]);
    }

    /**
     * Update skill
     */
    public function updateSkill(Request $request, FreelancerSkill $skill): JsonResponse
    {
        $user = auth()->user();
        
        if ($skill->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'proficiency_level' => 'required|in:beginner,intermediate,advanced,expert',
            'years_of_experience' => 'nullable|integer|min:0|max:50',
            'description' => 'nullable|string|max:500',
            'is_featured' => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
            'display_order' => 'nullable|integer|min:0'
        ]);

        $skill->update($validated);
        $skill->freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Skill updated successfully',
            'skill' => $skill->fresh()->load('skill')
        ]);
    }

    /**
     * Delete skill
     */
    public function deleteSkill(FreelancerSkill $skill): JsonResponse
    {
        $user = auth()->user();
        
        if ($skill->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $skill->delete();
        $skill->freelancer->updateProfileCompletion();

        return response()->json(['message' => 'Skill deleted successfully']);
    }

    /**
     * Get all portfolio items
     */
    public function getPortfolios(): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile;

        if (!$freelancer) {
            return response()->json(['portfolios' => []]);
        }

        $portfolios = $freelancer->portfolios()->ordered()->get();

        return response()->json(['portfolios' => $portfolios]);
    }

    /**
     * Store new portfolio item
     */
    public function storePortfolio(Request $request): JsonResponse
    {
        $user = auth()->user();
        $freelancer = $user->freelancerProfile ?? Freelancer::create(['user_id' => $user->id]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'project_type' => 'required|in:web_development,mobile_app,design,writing,marketing,other',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50',
            'project_url' => 'nullable|url|max:500',
            'github_url' => 'nullable|url|max:500',
            'project_value' => 'nullable|numeric|min:0|max:999999.99',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'completion_date' => 'nullable|date',
            'client_name' => 'nullable|string|max:255',
            'is_featured' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240' // 10MB
        ]);

        $validated['freelancer_id'] = $freelancer->id;

        // Handle image uploads
        if ($request->hasFile('images')) {
            $cloudinaryService = app(CloudinaryService::class);
            $imageUrls = [];

            foreach ($request->file('images') as $index => $image) {
                $result = $cloudinaryService->uploadPortfolioImage($image, $user->id, $validated['title'] . '_' . $index);
                if ($result) {
                    $imageUrls[] = $result['secure_url'];
                }
            }

            $validated['images'] = $imageUrls;
        }

        $portfolio = FreelancerPortfolio::create($validated);
        $freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Portfolio item added successfully',
            'portfolio' => $portfolio
        ]);
    }

    /**
     * Update portfolio item
     */
    public function updatePortfolio(Request $request, FreelancerPortfolio $portfolio): JsonResponse
    {
        $user = auth()->user();
        
        if ($portfolio->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'project_type' => 'required|in:web_development,mobile_app,design,writing,marketing,other',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50',
            'project_url' => 'nullable|url|max:500',
            'github_url' => 'nullable|url|max:500',
            'project_value' => 'nullable|numeric|min:0|max:999999.99',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'completion_date' => 'nullable|date',
            'client_name' => 'nullable|string|max:255',
            'is_featured' => 'boolean',
            'display_order' => 'nullable|integer|min:0',
            'new_images' => 'nullable|array|max:5',
            'new_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB
            'remove_images' => 'nullable|array',
            'remove_images.*' => 'string'
        ]);

        // Handle new image uploads
        if ($request->hasFile('new_images')) {
            $cloudinaryService = app(CloudinaryService::class);
            $currentImages = $portfolio->images ?? [];

            foreach ($request->file('new_images') as $index => $image) {
                $result = $cloudinaryService->uploadPortfolioImage($image, $user->id, $validated['title'] . '_' . time() . '_' . $index);
                if ($result) {
                    $currentImages[] = $result['secure_url'];
                }
            }

            $validated['images'] = $currentImages;
        }

        // Handle image removal
        if ($request->has('remove_images')) {
            $cloudinaryService = app(CloudinaryService::class);
            $currentImages = $portfolio->images ?? [];
            $imagesToRemove = $request->input('remove_images');

            foreach ($imagesToRemove as $imageUrl) {
                $publicId = $cloudinaryService->extractPublicId($imageUrl);
                if ($publicId) {
                    $cloudinaryService->deleteImage($publicId);
                }
                $currentImages = array_filter($currentImages, fn($img) => $img !== $imageUrl);
            }

            $validated['images'] = array_values($currentImages);
        }

        $portfolio->update($validated);
        $portfolio->freelancer->updateProfileCompletion();

        return response()->json([
            'message' => 'Portfolio item updated successfully',
            'portfolio' => $portfolio->fresh()
        ]);
    }

    /**
     * Delete portfolio item
     */
    public function deletePortfolio(FreelancerPortfolio $portfolio): JsonResponse
    {
        $user = auth()->user();
        
        if ($portfolio->freelancer->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        // Delete associated images from Cloudinary
        if ($portfolio->images) {
            $cloudinaryService = app(CloudinaryService::class);
            foreach ($portfolio->images as $imageUrl) {
                $publicId = $cloudinaryService->extractPublicId($imageUrl);
                if ($publicId) {
                    $cloudinaryService->deleteImage($publicId);
                }
            }
        }

        $portfolio->delete();
        $portfolio->freelancer->updateProfileCompletion();

        return response()->json(['message' => 'Portfolio item deleted successfully']);
    }
}
