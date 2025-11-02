<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\IdVerificationApproved;
use App\Mail\IdVerificationRejected;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class IdVerificationController extends Controller
{
    /**
     * Display a listing of ID verification submissions
     */
    public function index(Request $request)
    {
        $query = User::select([
                'id',
                'first_name',
                'last_name',
                'email',
                'id_type',
                'id_verification_status',
                'id_front_image',
                'id_back_image',
                'created_at',
                'profile_photo_url'
            ])
            ->whereNotNull('id_front_image');

        // Filter by status
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

        $verifications = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Calculate statistics
        $stats = [
            'pending' => User::where('id_verification_status', 'pending')
                ->whereNotNull('id_front_image')
                ->count(),
            'verified' => User::where('id_verification_status', 'verified')->count(),
            'rejected' => User::where('id_verification_status', 'rejected')->count(),
            'total' => User::whereNotNull('id_front_image')->count(),
        ];

        return Inertia::render('Admin/IdVerifications/Index', [
            'verifications' => $verifications,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Display the specified ID verification
     */
    public function show($userId)
    {
        $user = User::findOrFail($userId);

        // Check if user has uploaded ID images
        if (!$user->id_front_image || !$user->id_back_image) {
            return redirect()->route('admin.id-verifications.index')
                ->with('error', 'This user has not uploaded ID images yet.');
        }

        // Add ID type label
        $idTypeLabels = [
            'national_id' => 'National ID',
            'drivers_license' => "Driver's License",
            'passport' => 'Passport',
            'philhealth_id' => 'PhilHealth',
            'sss_id' => 'SSS',
            'umid' => 'UMID',
            'voters_id' => "Voter's ID",
            'prc_id' => 'PRC',
        ];

        $user->id_type_label = $idTypeLabels[$user->id_type] ?? $user->id_type ?? 'Unknown';
        $user->id_front_image_url = $user->id_front_image;
        $user->id_back_image_url = $user->id_back_image;

        return Inertia::render('Admin/IdVerifications/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Approve an ID verification
     */
    public function approve($userId)
    {
        $user = User::findOrFail($userId);

        $user->update([
            'id_verification_status' => 'verified',
            'id_verified_at' => now(),
            'id_verification_notes' => null,
        ]);

        // Send approval email
        try {
            Mail::to($user->email)->send(new IdVerificationApproved($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send ID verification approval email', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'ID verified successfully. User has been notified via email.');
    }

    /**
     * Reject an ID verification
     */
    public function reject(Request $request, $userId)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:500'
        ], [
            'notes.required' => 'Please provide a reason for rejection.',
            'notes.max' => 'Rejection notes cannot exceed 500 characters.'
        ]);

        $user = User::findOrFail($userId);

        $user->update([
            'id_verification_status' => 'rejected',
            'id_verification_notes' => $validated['notes'],
            'id_verified_at' => null,
        ]);

        // Send rejection email
        try {
            Mail::to($user->email)->send(new IdVerificationRejected($user, $validated['notes']));
        } catch (\Exception $e) {
            \Log::error('Failed to send ID verification rejection email', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'ID verification rejected. User has been notified via email.');
    }

    /**
     * Request ID resubmission
     */
    public function requestResubmit(Request $request, $userId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500'
        ], [
            'reason.required' => 'Please provide a reason for resubmission request.',
            'reason.max' => 'Reason cannot exceed 500 characters.'
        ]);

        $user = User::findOrFail($userId);

        $user->update([
            'id_verification_status' => 'pending',
            'id_verification_notes' => 'Resubmission requested: ' . $validated['reason'],
        ]);

        // Send email notification requesting resubmission
        try {
            Mail::to($user->email)->send(new IdVerificationRejected($user, $validated['reason']));
        } catch (\Exception $e) {
            \Log::error('Failed to send ID resubmission request email', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'Resubmission request sent. User has been notified via email.');
    }

    /**
     * Bulk approve multiple ID verifications
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id'
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->update([
                'id_verification_status' => 'verified',
                'id_verified_at' => now(),
                'id_verification_notes' => null,
            ]);

        // Send approval emails to each user (in queue for performance)
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                \Log::info('Sending ID verification approval email', ['user_id' => $user->id]);
                try {
                    Mail::to($user->email)->send(new IdVerificationApproved($user));
                } catch (\Exception $e) {
                    \Log::error('Failed to send ID verification approval email', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return back()->with('success', "{$count} ID verification(s) approved successfully.");
    }

    /**
     * Bulk reject multiple ID verifications
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'reason' => 'required|string|max:500'
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->update([
                'id_verification_status' => 'rejected',
                'id_verification_notes' => $request->reason,
                'id_verified_at' => null,
            ]);

        // Send rejection emails
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                try {
                    Mail::to($user->email)->send(new IdVerificationRejected($user, $request->reason));
                } catch (\Exception $e) {
                    \Log::error('Failed to send ID verification rejection email', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return back()->with('success', "{$count} ID verification(s) rejected.");
    }

    /**
     * Bulk request resubmission
     */
    public function bulkRequestResubmit(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'reason' => 'required|string|max:500'
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->update([
                'id_verification_status' => 'pending',
                'id_verification_notes' => 'Resubmission requested: ' . $request->reason,
            ]);

        // Send resubmission request emails
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                try {
                    Mail::to($user->email)->send(new IdVerificationRejected($user, $request->reason));
                } catch (\Exception $e) {
                    \Log::error('Failed to send ID resubmission request email', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return back()->with('success', "{$count} resubmission request(s) sent.");
    }

    /**
     * Get verification statistics
     */
    public function getStatistics()
    {
        return response()->json([
            'pending' => User::where('id_verification_status', 'pending')
                ->whereNotNull('id_front_image')->count(),
            'verified' => User::where('id_verification_status', 'verified')->count(),
            'rejected' => User::where('id_verification_status', 'rejected')->count(),
            'total' => User::whereNotNull('id_front_image')->count(),
        ]);
    }

    /**
     * Export ID verifications to CSV
     */
    public function exportCsv(Request $request)
    {
        $query = User::select([
            'id', 'first_name', 'last_name', 'email', 'id_type',
            'id_verification_status', 'created_at'
        ])->whereNotNull('id_front_image');

        // Apply filters from request
        if ($request->filled('status')) {
            $query->where('id_verification_status', $request->status);
        }

        if ($request->filled('id_type')) {
            $query->where('id_type', $request->id_type);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $verifications = $query->orderBy('created_at', 'desc')->get();

        $fileName = 'id_verifications_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\""
        ];

        $callback = function() use ($verifications) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, ['ID', 'Name', 'Email', 'ID Type', 'Status', 'Submitted Date']);

            // CSV Rows
            foreach ($verifications as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->first_name . ' ' . $user->last_name,
                    $user->email,
                    ucwords(str_replace('_', ' ', $user->id_type ?? '')),
                    ucfirst($user->id_verification_status),
                    $user->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}


