<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployerVerificationController extends Controller
{
    /**
     * Display a listing of Employer verification submissions
     */
    public function index(Request $request)
    {
        Log::info('Admin accessed Employer verifications list', [
            'admin_id' => Auth::id(),
            'filters' => $request->only(['status', 'search'])
        ]);

        $query = User::where('user_type', 'employer')
            ->where(function($q) {
                $q->whereNotNull('business_registration_document')
                  ->orWhereNotNull('tax_id');
            });

        // Filter by status (we use profile_status for employers)
        if ($request->filled('status')) {
            $query->where('profile_status', $request->status);
        }

        // Search by name, email or company
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $verifications = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $verifications->getCollection()->each(function ($user) {
            $user->append('profile_picture_url');
        });

        // Calculate statistics based on profile_status for employers
        $baseQuery = User::where('user_type', 'employer');
        $stats = [
            'pending' => (clone $baseQuery)->where('profile_status', 'pending')->count(),
            'verified' => (clone $baseQuery)->where('profile_status', 'approved')->count(),
            'rejected' => (clone $baseQuery)->where('profile_status', 'rejected')->count(),
            'total' => $baseQuery->count(),
        ];

        return Inertia::render('Admin/Employers/Verifications/Index', [
            'verifications' => $verifications,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Approve an Employer Profile (Verification)
     */
    public function approve($userId)
    {
        $user = User::findOrFail($userId);
        
        $user->update([
            'profile_status' => 'approved',
        ]);

        return redirect()->back()->with('success', 'Employer profile approved successfully.');
    }

    /**
     * Reject an Employer Profile
     */
    public function reject(Request $request, $userId)
    {
        $request->validate(['notes' => 'required|string|max:500']);

        $user = User::findOrFail($userId);
        $user->update([
            'profile_status' => 'rejected',
        ]);

        return redirect()->back()->with('success', 'Employer profile rejected.');
    }
}
