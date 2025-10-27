<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FreelancerOnboardingController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Show the freelancer onboarding page
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

        return Inertia::render('Onboarding/FreelancerOnboarding', [
            'user' => $user
        ]);
    }

    /**
     * Handle the freelancer onboarding form submission
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        // Validate the onboarding data
        $validated = $request->validate([
            'professional_title' => 'required|string|max:255',
            'hourly_rate' => 'required|numeric|min:5|max:1000',
            'experience_level' => 'required|in:beginner,intermediate,expert',
            'bio' => 'required|string|min:50|max:1000',
            'skills' => 'required|array|min:3|max:15',
            'skills.*' => 'string|max:50',
            'languages' => 'required|array|min:1',
            'languages.*' => 'string|max:50',
            'portfolio_url' => 'nullable|url',
            'profile_photo' => 'nullable|image|max:2048',
        ]);

        // Handle profile photo upload to Cloudinary
        if ($request->hasFile('profile_photo')) {
            $result = $this->cloudinaryService->uploadProfilePicture($request->file('profile_photo'), $user->id);
            if ($result) {
                $validated['profile_photo'] = $result['secure_url'];
            }
        }

        // Update user profile
        $user->update(array_merge($validated, [
            'profile_completed' => true,
            'profile_status' => 'pending' // Requires approval
        ]));

        return redirect()->route('jobs.index')->with('success',
            'Your profile has been submitted for review. You\'ll be notified once it\'s approved.');
    }

    /**
     * Skip onboarding (optional for freelancers)
     */
    public function skip(): RedirectResponse
    {
        $user = auth()->user();

        $user->update([
            'profile_completed' => true,
            'profile_status' => 'approved'
        ]);

        return redirect()->route('jobs.index')->with('info',
            'You can complete your profile later from your profile settings.');
    }
}
