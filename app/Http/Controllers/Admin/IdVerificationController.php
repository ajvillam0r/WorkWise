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
        $query = User::whereNotNull('id_front_image');

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

        return Inertia::render('Admin/IdVerifications/Index', [
            'verifications' => $verifications,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Display the specified ID verification
     */
    public function show($userId)
    {
        $user = User::findOrFail($userId);

        return Inertia::render('Admin/IdVerifications/Show', [
            'verificationUser' => $user,
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
}


