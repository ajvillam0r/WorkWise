<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\IdVerificationApproved as IdVerificationApprovedMail;
use App\Mail\IdVerificationRejected as IdVerificationRejectedMail;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class IdVerificationController extends Controller
{
    /**
     * Display a listing of ID verification submissions
     */
    public function index(Request $request)
    {
        // Log admin access
        Log::info('Admin accessed ID verifications list', [
            'admin_id' => Auth::id(),
            'filters' => $request->only(['status', 'search'])
        ]);

        $query = User::whereNotNull('id_front_image')
            ->whereNotNull('id_back_image');

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
        
        // Append profile_picture_url accessor to each user
        $verifications->getCollection()->each(function ($user) {
            $user->append('profile_picture_url');
        });

        // Calculate statistics
        $stats = [
            'pending' => User::where('id_verification_status', 'pending')
                ->whereNotNull('id_front_image')
                ->whereNotNull('id_back_image')
                ->count(),
            'verified' => User::where('id_verification_status', 'verified')->count(),
            'rejected' => User::where('id_verification_status', 'rejected')->count(),
            'total' => User::whereNotNull('id_front_image')
                ->whereNotNull('id_back_image')
                ->count(),
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

        // Log admin viewing verification details
        Log::info('Admin viewed ID verification details', [
            'admin_id' => Auth::id(),
            'user_id' => $user->id,
            'verification_status' => $user->id_verification_status
        ]);

        // Check if user has uploaded ID images
        if (!$user->id_front_image || !$user->id_back_image) {
            Log::warning('Admin attempted to view incomplete ID verification', [
                'admin_id' => Auth::id(),
                'user_id' => $user->id,
                'has_front' => !empty($user->id_front_image),
                'has_back' => !empty($user->id_back_image)
            ]);

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
        $admin = Auth::user();

        // Update verification status with admin info
        $user->update([
            'id_verification_status' => 'verified',
            'id_verified_at' => now(),
            'id_verification_notes' => 'Approved by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . ')',
        ]);

        // Create database notification
        try {
            $user->notify(new IdVerificationApproved());
            
            Log::info('ID verification approved and notification sent', [
                'admin_id' => $admin->id,
                'admin_name' => $admin->first_name . ' ' . $admin->last_name,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'verified_at' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send ID verification approval notification', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        // Also send approval email (backward compatibility)
        try {
            Mail::to($user->email)->send(new IdVerificationApprovedMail($user));
        } catch (\Exception $e) {
            Log::error('Failed to send ID verification approval email', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'ID verified successfully. User has been notified.');
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
        $admin = Auth::user();
        $reason = $validated['notes'];

        // Update verification status with admin info and reason
        $adminNote = 'Rejected by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . '): ' . $reason;
        
        $user->update([
            'id_verification_status' => 'rejected',
            'id_verification_notes' => $adminNote,
            'id_verified_at' => null,
        ]);

        // Create database notification with rejection reason
        try {
            $user->notify(new IdVerificationRejected($reason));
            
            Log::info('ID verification rejected and notification sent', [
                'admin_id' => $admin->id,
                'admin_name' => $admin->first_name . ' ' . $admin->last_name,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'reason' => $reason,
                'rejected_at' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send ID verification rejection notification', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        // Also send rejection email (backward compatibility)
        try {
            Mail::to($user->email)->send(new IdVerificationRejectedMail($user, $reason));
        } catch (\Exception $e) {
            Log::error('Failed to send ID verification rejection email', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'ID verification rejected. User has been notified.');
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
        $admin = Auth::user();
        $reason = $validated['reason'];

        $adminNote = 'Resubmission requested by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . '): ' . $reason;

        $user->update([
            'id_verification_status' => 'pending',
            'id_verification_notes' => $adminNote,
        ]);

        // Send notification requesting resubmission
        try {
            $user->notify(new IdVerificationRejected($reason));
            
            // Send email (backward compatibility)
            Mail::to($user->email)->send(new IdVerificationRejectedMail($user, $reason));
            
            Log::info('ID resubmission requested and notification sent', [
                'admin_id' => $admin->id,
                'admin_name' => $admin->first_name . ' ' . $admin->last_name,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'reason' => $reason,
                'requested_at' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send ID resubmission request notification', [
                'admin_id' => $admin->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->back()->with('success', 'Resubmission request sent. User has been notified.');
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

        $admin = Auth::user();
        $adminNote = 'Approved by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . ')';

        Log::info('Admin initiated bulk ID verification approval', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->first_name . ' ' . $admin->last_name,
            'user_ids' => $request->user_ids,
            'count' => count($request->user_ids)
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->whereNotNull('id_back_image')
            ->update([
                'id_verification_status' => 'verified',
                'id_verified_at' => now(),
                'id_verification_notes' => $adminNote,
            ]);

        // Send notifications and emails to each user
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                try {
                    // Send database notification
                    $user->notify(new IdVerificationApproved());
                    
                    // Send email (backward compatibility)
                    Mail::to($user->email)->send(new IdVerificationApprovedMail($user));
                    
                    Log::info('Bulk approval notification sent', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send bulk ID verification approval notification', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        Log::info('Bulk ID verification approval completed', [
            'admin_id' => $admin->id,
            'approved_count' => $count
        ]);

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

        $admin = Auth::user();
        $reason = $request->reason;
        $adminNote = 'Rejected by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . '): ' . $reason;

        Log::info('Admin initiated bulk ID verification rejection', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->first_name . ' ' . $admin->last_name,
            'user_ids' => $request->user_ids,
            'count' => count($request->user_ids),
            'reason' => $reason
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->whereNotNull('id_back_image')
            ->update([
                'id_verification_status' => 'rejected',
                'id_verification_notes' => $adminNote,
                'id_verified_at' => null,
            ]);

        // Send notifications and emails
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                try {
                    // Send database notification
                    $user->notify(new IdVerificationRejected($reason));
                    
                    // Send email (backward compatibility)
                    Mail::to($user->email)->send(new IdVerificationRejectedMail($user, $reason));
                    
                    Log::info('Bulk rejection notification sent', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send bulk ID verification rejection notification', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        Log::info('Bulk ID verification rejection completed', [
            'admin_id' => $admin->id,
            'rejected_count' => $count
        ]);

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

        $admin = Auth::user();
        $reason = $request->reason;
        $adminNote = 'Resubmission requested by admin ' . $admin->id . ' (' . $admin->first_name . ' ' . $admin->last_name . '): ' . $reason;

        Log::info('Admin initiated bulk ID resubmission request', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->first_name . ' ' . $admin->last_name,
            'user_ids' => $request->user_ids,
            'count' => count($request->user_ids),
            'reason' => $reason
        ]);

        $count = User::whereIn('id', $request->user_ids)
            ->whereNotNull('id_front_image')
            ->whereNotNull('id_back_image')
            ->update([
                'id_verification_status' => 'pending',
                'id_verification_notes' => $adminNote,
            ]);

        // Send notifications and emails
        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            if ($user) {
                try {
                    // Send database notification
                    $user->notify(new IdVerificationRejected($reason));
                    
                    // Send email (backward compatibility)
                    Mail::to($user->email)->send(new IdVerificationRejectedMail($user, $reason));
                    
                    Log::info('Bulk resubmission request notification sent', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send bulk ID resubmission request notification', [
                        'admin_id' => $admin->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        Log::info('Bulk ID resubmission request completed', [
            'admin_id' => $admin->id,
            'request_count' => $count
        ]);

        return back()->with('success', "{$count} resubmission request(s) sent.");
    }

    /**
     * Get verification statistics
     */
    public function getStatistics()
    {
        Log::info('Admin requested ID verification statistics', [
            'admin_id' => Auth::id()
        ]);

        return response()->json([
            'pending' => User::where('id_verification_status', 'pending')
                ->whereNotNull('id_front_image')
                ->whereNotNull('id_back_image')
                ->count(),
            'verified' => User::where('id_verification_status', 'verified')->count(),
            'rejected' => User::where('id_verification_status', 'rejected')->count(),
            'total' => User::whereNotNull('id_front_image')
                ->whereNotNull('id_back_image')
                ->count(),
        ]);
    }

    /**
     * Export ID verifications to CSV
     */
    public function exportCsv(Request $request)
    {
        $admin = Auth::user();

        Log::info('Admin initiated ID verification CSV export', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->first_name . ' ' . $admin->last_name,
            'filters' => $request->only(['status', 'id_type', 'from_date', 'to_date'])
        ]);

        $query = User::select([
            'id', 'first_name', 'last_name', 'email', 'id_type',
            'id_verification_status', 'created_at'
        ])->whereNotNull('id_front_image')
         ->whereNotNull('id_back_image');

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

        Log::info('ID verification CSV export completed', [
            'admin_id' => $admin->id,
            'record_count' => $verifications->count()
        ]);

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


