<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserVerification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminVerificationController extends Controller
{
    /**
     * Display pending verifications
     */
    public function index(Request $request): Response
    {
        $query = UserVerification::with(['user:id,first_name,last_name,email,user_type,profile_status']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by verification type
        if ($request->filled('verification_type')) {
            $query->where('verification_type', $request->verification_type);
        }

        // Search by user name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $verifications = $query->orderBy('created_at', 'desc')->paginate(15);

        $stats = [
            'pending_verifications' => UserVerification::where('status', 'pending')->count(),
            'approved_verifications' => UserVerification::where('status', 'approved')->count(),
            'rejected_verifications' => UserVerification::where('status', 'rejected')->count(),
            'total_verifications' => UserVerification::count(),
        ];

        return Inertia::render('Admin/Verifications/Index', [
            'verifications' => $verifications,
            'stats' => $stats,
            'filters' => $request->only(['status', 'verification_type', 'search']),
        ]);
    }

    /**
     * Show specific verification details
     */
    public function show(UserVerification $verification): Response
    {
        $verification->load([
            'user:id,first_name,last_name,email,user_type,profile_status,created_at',
            'verifier:id,first_name,last_name'
        ]);

        return Inertia::render('Admin/Verifications/Show', [
            'verification' => $verification,
        ]);
    }

    /**
     * Approve verification
     */
    public function approve(Request $request, UserVerification $verification)
    {
        $request->validate([
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $verification->update([
            'status' => 'approved',
            'admin_notes' => $request->admin_notes,
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        // Update user profile status if this was a profile verification
        if ($verification->verification_type === 'profile') {
            $verification->user->update([
                'profile_status' => 'approved',
                'profile_completed' => true,
            ]);
        }

        return back()->with('success', 'Verification approved successfully.');
    }

    /**
     * Reject verification
     */
    public function reject(Request $request, UserVerification $verification)
    {
        $request->validate([
            'admin_notes' => 'required|string|max:1000',
            'rejection_reason' => 'required|string|max:500',
        ]);

        $verification->update([
            'status' => 'rejected',
            'admin_notes' => $request->admin_notes,
            'rejection_reason' => $request->rejection_reason,
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        // Update user profile status if this was a profile verification
        if ($verification->verification_type === 'profile') {
            $verification->user->update([
                'profile_status' => 'rejected',
            ]);
        }

        return back()->with('success', 'Verification rejected successfully.');
    }

    /**
     * Request additional information
     */
    public function requestInfo(Request $request, UserVerification $verification)
    {
        $request->validate([
            'admin_notes' => 'required|string|max:1000',
            'additional_info_required' => 'required|string|max:500',
        ]);

        $verification->update([
            'status' => 'pending',
            'admin_notes' => $request->admin_notes,
            'additional_info_required' => $request->additional_info_required,
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        return back()->with('success', 'Additional information requested from user.');
    }

    /**
     * Bulk approve verifications
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'verification_ids' => 'required|array',
            'verification_ids.*' => 'exists:user_verifications,id',
        ]);

        $verifications = UserVerification::whereIn('id', $request->verification_ids)->get();

        foreach ($verifications as $verification) {
            $verification->update([
                'status' => 'approved',
                'verified_at' => now(),
                'verified_by' => auth()->id(),
            ]);

            // Update user profile status if this was a profile verification
            if ($verification->verification_type === 'profile') {
                $verification->user->update([
                    'profile_status' => 'approved',
                    'profile_completed' => true,
                ]);
            }
        }

        return back()->with('success', count($request->verification_ids) . ' verifications approved successfully.');
    }

    /**
     * Bulk reject verifications
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'verification_ids' => 'required|array',
            'verification_ids.*' => 'exists:user_verifications,id',
            'rejection_reason' => 'required|string|max:500',
        ]);

        $verifications = UserVerification::whereIn('id', $request->verification_ids)->get();

        foreach ($verifications as $verification) {
            $verification->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'verified_at' => now(),
                'verified_by' => auth()->id(),
            ]);

            // Update user profile status if this was a profile verification
            if ($verification->verification_type === 'profile') {
                $verification->user->update([
                    'profile_status' => 'rejected',
                ]);
            }
        }

        return back()->with('success', count($request->verification_ids) . ' verifications rejected successfully.');
    }

    /**
     * Get verification analytics
     */
    public function analytics(): Response
    {
        $driver = DB::connection()->getDriverName();
        $monthFormat = $driver === 'pgsql' 
            ? "TO_CHAR(created_at, 'YYYY-MM')" 
            : "DATE_FORMAT(created_at, '%Y-%m')";
            
        $hourDiff = $driver === 'pgsql' 
            ? "EXTRACT(EPOCH FROM (verified_at - created_at))/3600" 
            : "TIMESTAMPDIFF(HOUR, created_at, verified_at)";

        $analytics = [
            'verification_trends' => UserVerification::selectRaw("
                    {$monthFormat} as month,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                ")
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get(),

            'by_verification_type' => UserVerification::selectRaw("
                    verification_type,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                ")
                ->groupBy('verification_type')
                ->get(),

            'average_processing_time' => UserVerification::whereNotNull('verified_at')
                ->selectRaw("AVG({$hourDiff}) as avg_hours")
                ->value('avg_hours') ?? 0,

            'pending_by_type' => UserVerification::where('status', 'pending')
                ->selectRaw('verification_type, COUNT(*) as count')
                ->groupBy('verification_type')
                ->pluck('count', 'verification_type'),
        ];

        return Inertia::render('Admin/Verifications/Analytics', [
            'analytics' => $analytics,
        ]);
    }
}
