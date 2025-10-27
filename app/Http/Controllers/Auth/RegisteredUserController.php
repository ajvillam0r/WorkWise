<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create()
    {
        // Get the selected user type from session, or redirect to role selection
        $selectedUserType = session('selected_user_type');

        \Log::info('RegisteredUserController::create called', [
            'selected_user_type' => $selectedUserType,
            'session_id' => session()->getId(),
            'all_session_data' => session()->all()
        ]);

        if (!$selectedUserType) {
            \Log::warning('No user type selected, redirecting to role selection');
            return redirect()->route('role.selection');
        }

        return Inertia::render('Auth/Register', [
            'selectedUserType' => $selectedUserType
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        \Log::info('RegisteredUserController::store called', [
            'request_data' => $request->all(),
            'session_id' => session()->getId(),
            'selected_user_type' => session('selected_user_type')
        ]);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
            'password_confirmation' => 'required|same:password',
            'country' => 'required|string|max:100',
            'user_type' => 'required|in:gig_worker,employer',
            'terms_agreed' => 'required|accepted',
            'marketing_emails' => 'boolean',
        ]);

        $userData = [
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_type' => $request->user_type,
            'country' => $request->country,
        ];

        $user = User::create($userData);

        // Clear the session data
        session()->forget('selected_user_type');

        event(new Registered($user));

        Auth::login($user);

        \Log::info('User registered successfully', [
            'user_id' => $user->id,
            'user_type' => $user->user_type,
            'email' => $user->email
        ]);

        // Redirect based on user type
        if ($user->user_type === 'gig_worker') {
            \Log::info('Redirecting to gig-worker onboarding');
            return redirect()->route('gig-worker.onboarding');
        } elseif ($user->user_type === 'employer') {
            \Log::info('Redirecting to employer onboarding');
            return redirect()->route('employer.onboarding');
        } else {
            \Log::warning('Unknown user type, redirecting to dashboard', ['user_type' => $user->user_type]);
            // Fallback to dashboard if user type is unknown
            return redirect()->route('dashboard');
        }
    }
}
