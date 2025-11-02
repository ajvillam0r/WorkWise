<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = null;
        
        if ($request->user()) {
            // Only serialize essential user fields to prevent circular reference issues
            $user = [
                'id' => $request->user()->id,
                'first_name' => $request->user()->first_name,
                'last_name' => $request->user()->last_name,
                'email' => $request->user()->email,
                'email_verified_at' => $request->user()->email_verified_at,
                'user_type' => $request->user()->user_type,
                'profile_photo' => $request->user()->profile_photo,
                'profile_picture' => $request->user()->profile_picture,
                'profile_picture_url' => $request->user()->profile_picture_url, // Computed accessor with fallback
                'avatar' => $request->user()->avatar,
                'professional_title' => $request->user()->professional_title,
                'is_admin' => $request->user()->is_admin,
                'profile_completed' => $request->user()->profile_completed,
                'profile_status' => $request->user()->profile_status,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'needsEmailVerification' => $request->user() ? is_null($request->user()->email_verified_at) : false,
            ],
        ];
    }
}
