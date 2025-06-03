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

        if (!$selectedUserType) {
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
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
            'barangay' => 'required|string|max:255',
            'user_type' => 'required|in:freelancer,client',
            'terms_agreed' => 'required|accepted',
            'marketing_emails' => 'boolean',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'barangay' => $request->barangay,
            'user_type' => $request->user_type,
        ]);

        // Clear the session data
        session()->forget('selected_user_type');

        event(new Registered($user));

        Auth::login($user);

        // Redirect based on user type
        if ($user->user_type === 'freelancer') {
            return redirect()->route('freelancer.onboarding');
        } else {
            return redirect()->route('client.onboarding');
        }
    }
}
