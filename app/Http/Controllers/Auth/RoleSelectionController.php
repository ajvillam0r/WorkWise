<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleSelectionController extends Controller
{
    /**
     * Show the role selection page
     */
    public function show(): Response
    {
        return Inertia::render('Auth/RoleSelection');
    }

    /**
     * Handle role selection and redirect to registration
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_type' => 'required|in:freelancer,client'
        ]);

        // Store the selected role in session
        session(['selected_user_type' => $request->user_type]);

        return redirect()->route('register');
    }
}
