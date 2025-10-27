<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\IdVerificationApproved;
use App\Mail\IdVerificationRejected;
use App\Mail\ProfileApproved;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminIdVerificationController extends Controller
{
    /**
     * Display a listing of ID verifications
     */
    public function index(Request $request): Response
    {
        $query = User::where('user_type', 'gig_worker')
            ->whereNotNull('id_type')
            ->whereNotNull('id_front_image')
            ->whereNotNull('id_back_image');

        // Filter by verification status
        if ($request->filled('status')) {
            $query->where('id_verification_status', $request->status);
        }

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sort by submission date (newest first by default)
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate(15)->withQueryString();

        // Calculate statistics
        $stats = [
            'pending' => User::where('user_type', 'gig_worker')
                ->where('id_verification_status', 'pending')
                ->whereNotNull('id_front_image')
                ->count(),
            'verified' => User::where('user_type', 'gig_worker')
                ->where('id_verification_status', 'verified')
                ->count(),
            'rejected' => User::where('user_type', 'gig_worker')
                ->where('id_verification_status', 'rejected')
                ->count(),
            'total' => User::where('user_type', 'gig_worker')
                ->whereNotNull('id_front_image')
                ->count(),
        ];

        return Inertia::render('Admin/IdVerifications/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Show specific user's ID verification details
     */
    public function show(User $user): Response
    {
        // Ensure user has submitted ID
        if (!$user->id_front_image || !$user->id_back_image) {
            abort(404, 'No ID verification found for this user');
        }

        // Load relationships
        $user->load('portfolioItems');

        // Get full URLs for images (handle both Cloudinary URLs and local storage)
        $user->id_front_image_url = $user->id_front_image 
            ? (str_starts_with($user->id_front_image, 'http') 
                ? $user->id_front_image 
                : Storage::url($user->id_front_image))
            : null;
        $user->id_back_image_url = $user->id_back_image 
            ? (str_starts_with($user->id_back_image, 'http') 
                ? $user->id_back_image 
                : Storage::url($user->id_back_image))
            : null;
        $user->profile_photo_url = $user->profile_photo 
            ? (str_starts_with($user->profile_photo, 'http') 
                ? $user->profile_photo 
                : Storage::url($user->profile_photo))
            : null;

        // Get ID type label
        $idTypes = [
            'national_id' => 'National ID (PhilSys)',
            'drivers_license' => "Driver's License",
            'passport' => 'Passport',
            'philhealth_id' => 'PhilHealth ID',
            'sss_id' => 'SSS ID',
            'umid' => 'UMID',
            'voters_id' => "Voter's ID",
            'prc_id' => 'PRC ID',
        ];

        $user->id_type_label = $idTypes[$user->id_type] ?? $user->id_type;

        return Inertia::render('Admin/IdVerifications/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Approve user's ID verification
     */
    public function approve(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $user->update([
            'id_verification_status' => 'verified',
            'id_verification_notes' => $request->notes,
            'id_verified_at' => now(),
        ]);

        // If profile is also pending, approve it
        if ($user->profile_status === 'pending') {
            $user->update([
                'profile_status' => 'approved',
            ]);

            // Send profile approved email
            try {
                Mail::to($user->email)->send(new ProfileApproved($user));
            } catch (\Exception $e) {
                \Log::error('Failed to send profile approved email: ' . $e->getMessage());
            }
        } else {
            // Send just ID verification approved email
            try {
                Mail::to($user->email)->send(new IdVerificationApproved($user));
            } catch (\Exception $e) {
                \Log::error('Failed to send ID verification approved email: ' . $e->getMessage());
            }
        }

        return redirect()
            ->route('admin.id-verifications.index')
            ->with('success', "ID verification approved for {$user->first_name} {$user->last_name}");
    }

    /**
     * Reject user's ID verification
     */
    public function reject(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user->update([
            'id_verification_status' => 'rejected',
            'id_verification_notes' => $request->notes . "\n\nRejection Reason: " . $request->reason,
        ]);

        // Send rejection email
        try {
            Mail::to($user->email)->send(new IdVerificationRejected($user, $request->reason));
        } catch (\Exception $e) {
            \Log::error('Failed to send ID verification rejected email: ' . $e->getMessage());
        }

        return redirect()
            ->route('admin.id-verifications.index')
            ->with('success', "ID verification rejected for {$user->first_name} {$user->last_name}");
    }

    /**
     * Request user to resubmit ID
     */
    public function requestResubmit(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user->update([
            'id_verification_status' => 'pending',
            'id_verification_notes' => "Resubmission requested: " . $request->reason,
        ]);

        // Send resubmission request email (can reuse rejection email)
        try {
            Mail::to($user->email)->send(new IdVerificationRejected($user, $request->reason, true));
        } catch (\Exception $e) {
            \Log::error('Failed to send ID resubmission request email: ' . $e->getMessage());
        }

        return redirect()
            ->route('admin.id-verifications.index')
            ->with('success', "Resubmission requested from {$user->first_name} {$user->last_name}");
    }
}

