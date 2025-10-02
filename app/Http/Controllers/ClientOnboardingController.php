<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientOnboardingController extends Controller
{
    /**
     * Show the client onboarding page
     */
    public function show(): Response|RedirectResponse
    {
        $user = auth()->user();

        // Redirect if not a client
        if ($user->user_type !== 'client') {
            return redirect()->route('jobs.index');
        }

        return Inertia::render('Onboarding/ClientOnboarding', [
            'user' => $user
        ]);
    }

    /**
     * Handle the client onboarding form submission
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        // Validate the onboarding data
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'work_type_needed' => 'required|string|max:255',
            'budget_range' => 'required|string|max:255',
            'project_intent' => 'required|string|min:20|max:500',
        ]);

        // Update user profile
        $user->update(array_merge($validated, [
            'profile_completed' => true,
            'profile_status' => 'approved' // Clients are auto-approved
        ]));

        return redirect()->route('jobs.index')->with('success',
            'Welcome to WorkWise! You can now start posting projects and hiring freelancers.');
    }

    /**
     * Skip onboarding (optional for clients)
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
