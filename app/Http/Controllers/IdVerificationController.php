<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class IdVerificationController extends Controller
{

    /**
     * Upload ID images for verification
     */
    public function upload(Request $request)
    {
        // Increase execution time for large file uploads
        set_time_limit(120); // 2 minutes
        
        $user = Auth::user();

        // Validate the request
        $validated = $request->validate([
            'id_type' => 'required|string|in:national_id,drivers_license,passport,philhealth_id,sss_id,umid,voters_id,prc_id',
            'id_front_image' => 'required|image|max:5120', // 5MB max
            'id_back_image' => 'required|image|max:5120',
        ], [
            'id_type.required' => 'Please select an ID type.',
            'id_front_image.required' => 'Front side of ID is required.',
            'id_front_image.image' => 'Front side must be an image file.',
            'id_front_image.max' => 'Front side image must not exceed 5MB.',
            'id_back_image.required' => 'Back side of ID is required.',
            'id_back_image.image' => 'Back side must be an image file.',
            'id_back_image.max' => 'Back side image must not exceed 5MB.',
        ]);

        try {
            \DB::beginTransaction();
            // Upload front image to R2
            Log::info('Uploading ID front image', ['user_id' => $user->id]);
            $frontPath = Storage::disk('r2')->putFile('id_verification/' . $user->id, $request->file('id_front_image'));

            if (!$frontPath) {
                return back()
                    ->withErrors(['id_front_image' => 'Failed to upload front image. Please try again.'])
                    ->withInput();
            }

            $frontUrl = Storage::disk('r2')->url($frontPath);

            // Upload back image to R2
            Log::info('Uploading ID back image', ['user_id' => $user->id]);
            $backPath = Storage::disk('r2')->putFile('id_verification/' . $user->id, $request->file('id_back_image'));

            if (!$backPath) {
                return back()
                    ->withErrors(['id_back_image' => 'Failed to upload back image. Please try again.'])
                    ->withInput();
            }

            $backUrl = Storage::disk('r2')->url($backPath);

            // Update user record with ID information
            $user->update([
                'id_type' => $validated['id_type'],
                'id_front_image' => $frontUrl,
                'id_back_image' => $backUrl,
                'id_verification_status' => 'pending',
                'id_verification_notes' => null, // Clear any previous rejection notes
            ]);

            \DB::commit();

            Log::info('ID verification submitted successfully', [
                'user_id' => $user->id,
                'id_type' => $validated['id_type'],
            ]);

            // TODO: Send notification to admin for review
            // TODO: Send notification to user confirming submission

            return redirect()->route('profile.edit')
                ->with('success', 'ID verification submitted successfully! We will review it within 24-48 hours.');

        } catch (\Exception $e) {
            \DB::rollBack();
            
            Log::error('ID verification upload failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withErrors(['upload' => 'An error occurred while uploading your ID. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Resubmit ID verification after rejection
     */
    public function resubmit(Request $request)
    {
        // Same logic as upload
        return $this->upload($request);
    }
}


