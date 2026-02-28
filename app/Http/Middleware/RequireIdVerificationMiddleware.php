<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireIdVerificationMiddleware
{
    /**
     * Routes that are allowed when user is under mandatory KYC (so they can complete verification or logout).
     *
     * @var array<string>
     */
    protected $allowedRouteNames = [
        'id-verification.show',
        'id-verification.upload',
        'id-verification.upload-front',
        'id-verification.upload-back',
        'id-verification.resubmit',
        'logout',
        'profile.destroy', // allow account deletion if needed
    ];

    /**
     * Handle an incoming request.
     * Block sensitive actions until user completes ID verification when admin has required it.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Admin users are never blocked by mandatory KYC
        if ($user->isAdmin()) {
            return $next($request);
        }

        if (empty($user->id_verification_required_by_admin)) {
            return $next($request);
        }

        if ($user->id_verification_status === 'verified') {
            return $next($request);
        }

        // Allow specific routes so user can complete verification or logout
        if ($request->routeIs($this->allowedRouteNames)) {
            return $next($request);
        }

        // Allow GET requests to dashboard and home so we can show a banner (optional)
        if ($request->isMethod('GET') && $request->routeIs(['dashboard', 'employer.dashboard'])) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'message' => 'ID verification required. Please complete identity verification to continue.',
                'redirect' => route('id-verification.show'),
            ], 403);
        }

        return redirect()->route('id-verification.show')
            ->with('error', 'You must complete ID verification before continuing. Please upload a valid government ID.');
    }
}
