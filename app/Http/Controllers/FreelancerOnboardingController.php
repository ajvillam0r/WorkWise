<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FreelancerOnboardingController extends Controller
{
    /**
     * Show the freelancer onboarding page
     */
    public function show(): Response
    {
        $user = auth()->user();

        // Redirect if not a freelancer
        if ($user->user_type !== 'freelancer') {
            return redirect()->route('dashboard');
        }

        // If profile is already completed, redirect to dashboard
        if ($user->profile_completed) {
            return redirect()->route('dashboard');
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
            'bio' => 'required|string|min:50|max:1000',
            'skills' => 'required|array|min:3|max:15',
            'skills.*' => 'string|max:50',
            'languages' => 'required|array|min:1',
            'languages.*' => 'string|max:50',
            'portfolio_url' => 'nullable|url',
            'profile_photo' => 'nullable|image|max:2048',
        ]);

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $validated['profile_photo'] = $path;
        }

        // Update user profile
        $user->update(array_merge($validated, [
            'profile_completed' => true,
            'profile_status' => 'pending' // Requires approval
        ]));

        return redirect()->route('dashboard')->with('success',
            'Your profile has been submitted for review. You\'ll be notified once it\'s approved.');
    }
}
