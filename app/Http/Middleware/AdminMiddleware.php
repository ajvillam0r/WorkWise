<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Authentication required.'], 401);
            }
            return redirect('/login')->with('error', 'Please log in to access this page.');
        }

        $user = auth()->user();

        if (!$user->isAdmin()) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Admin access required.'], 403);
            }
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access this area.');
        }

        return $next($request);
    }
}
