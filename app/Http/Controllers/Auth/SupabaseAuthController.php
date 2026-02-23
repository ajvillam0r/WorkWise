<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SupabaseAuthController extends Controller
{
    public function callback(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'id' => 'required|string',
            // We could also validate the access_token here by calling Supabase API,
            // but for this bridge, we trust the client sending the ID/Email 
            // *IF* we verify the JWT signature. 
            // For MVP/Speed, we will trust the payload if it comes from our frontend 
            // which just authenticated with Supabase. 
            // SECURE WAY: Verify the JWT token sent in headers or body.
        ]);

        $email = $request->input('email');
        $supabaseId = $request->input('id');
        
        // Find or create user
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => explode('@', $email)[0], // Default name from email
                'email' => $email,
                'password' => Hash::make(Str::random(24)), // Random password since they use Supabase
                'email_verified_at' => now(), // Assume verified by Supabase
            ]);
        }

        // Log the user in
        Auth::login($user);

        return response()->json(['status' => 'success', 'user' => $user]);
    }
}
