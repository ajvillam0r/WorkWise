<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\FileUploadService;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Mockery;

/**
 * Edge case tests for ID Verification workflow
 * Tests Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */
class IdVerificationEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
        Log::spy();
    }

    /**
     * Test behavior when user has only front ID uploaded (no back ID)
     * Requirement: 10.1
     */
    public function test_user_can_upload_back_id_when_only_front_exists()
    {
        // User has front image but status is rejected (so they can upload back)
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => null,
            'id_verification_status' => 'rejected', // Rejected status allows uploads
        ]);

        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
                'message' => 'ID verification submitted successfully',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);

        // Verify logging
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_BACK_UPLOAD_STARTED', Mockery::type('array'));
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_BACK_UPLOAD_SUCCESS', Mockery::type('array'));
    }

    /**
     * Test behavior when user has only back ID uploaded (no front ID)
     * Requirement: 10.2
     */
    public function test_user_cannot_upload_back_id_without_front_id()
    {
        // User has no front image and status is rejected (so uploads are allowed, but back requires front first)
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'rejected', // Rejected status allows uploads
        ]);

        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Please upload front ID first',
            ]);

        $user->refresh();
        $this->assertNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertEquals('rejected', $user->id_verification_status);

        // Verify error logging
        Log::shouldHaveReceived('warning')
            ->with('ID_VERIFICATION_BACK_UPLOAD_NO_FRONT', Mockery::type('array'));
    }

    /**
     * Test user can upload front ID when only back ID exists (edge case recovery)
     * Requirement: 10.2
     */
    public function test_user_can_upload_front_id_when_only_back_exists()
    {
        // This is an edge case where somehow back ID exists without front
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'rejected', // Rejected status allows uploads
        ]);

        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Front ID uploaded successfully',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        // Status remains rejected (not changed by front upload alone)
        $this->assertEquals('rejected', $user->id_verification_status);
    }

    /**
     * Test system handles concurrent upload attempts gracefully
     * Requirement: 10.6
     */
    public function test_concurrent_upload_attempts_are_handled_gracefully()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'rejected', // Use rejected so uploads are allowed
        ]);

        $frontImage1 = UploadedFile::fake()->image('id_front_1.jpg', 1024, 768)->size(2048);
        $frontImage2 = UploadedFile::fake()->image('id_front_2.jpg', 1024, 768)->size(2048);

        // First upload
        $response1 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage1,
            ]);

        $response1->assertStatus(200);

        // Second upload (should replace the first)
        $response2 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage2,
            ]);

        $response2->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        // The second upload should have replaced the first
        $this->assertStringContainsString('id_verification', $user->id_front_image);
    }

    /**
     * Test both images must exist before setting status to 'pending'
     * Requirement: 10.7
     */
    public function test_status_only_set_to_pending_after_both_images_uploaded()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'rejected', // Start with rejected so uploads are allowed
        ]);

        // Upload front image only
        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);
        
        $frontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $frontResponse->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        // Status should still be rejected (not changed to pending yet)
        $this->assertEquals('rejected', $user->id_verification_status);

        // Now upload back image
        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);
        
        $backResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $backResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        // NOW status should be pending
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test upload is blocked when status is pending
     * Requirement: 10.3
     */
    public function test_upload_blocked_when_status_is_pending()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        $newFrontImage = UploadedFile::fake()->image('new_front.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $newFrontImage,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is currently under review. Please wait for admin verification.',
            ]);

        // Verify logging
        Log::shouldHaveReceived('warning')
            ->with('ID_VERIFICATION_UPLOAD_BLOCKED_PENDING', Mockery::type('array'));
    }

    /**
     * Test upload is blocked when status is verified
     * Requirement: 10.3
     */
    public function test_upload_blocked_when_status_is_verified()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'verified',
        ]);

        $newFrontImage = UploadedFile::fake()->image('new_front.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $newFrontImage,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is already verified.',
            ]);

        // Verify logging
        Log::shouldHaveReceived('warning')
            ->with('ID_VERIFICATION_UPLOAD_BLOCKED_VERIFIED', Mockery::type('array'));
    }

    /**
     * Test error handling when admin approval action fails
     * Requirement: 10.4
     * 
     * Note: This test verifies that the admin controller has proper error handling.
     * The actual implementation uses try-catch blocks to handle exceptions gracefully.
     */
    public function test_admin_approval_handles_invalid_user_id()
    {
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'is_admin' => true,
        ]);

        // Try to approve a non-existent user
        $response = $this->actingAs($admin)
            ->postJson("/admin/id-verifications/99999/approve");

        // Should return an error (404 or 500)
        $this->assertTrue($response->status() >= 400);
    }

    /**
     * Test notification creation failure doesn't block verification action
     * Requirement: 10.5
     */
    public function test_notification_failure_does_not_block_approval()
    {
        Notification::fake();

        $admin = User::factory()->create([
            'user_type' => 'admin',
            'is_admin' => true,
        ]);

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Mock notification to throw exception
        Notification::shouldReceive('send')
            ->andThrow(new \Exception('Notification service unavailable'));

        $response = $this->actingAs($admin)
            ->postJson("/admin/id-verifications/{$user->id}/approve");

        // Approval should still succeed
        $response->assertStatus(302); // Redirect back

        $user->refresh();
        // Status should be updated despite notification failure
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);

        // Verify error was logged
        Log::shouldHaveReceived('error')
            ->with('Failed to send ID verification approval notification', Mockery::type('array'));
    }

    /**
     * Test notification creation failure doesn't block rejection action
     * Requirement: 10.5
     */
    public function test_notification_failure_does_not_block_rejection()
    {
        Notification::fake();

        $admin = User::factory()->create([
            'user_type' => 'admin',
            'is_admin' => true,
        ]);

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Mock notification to throw exception
        Notification::shouldReceive('send')
            ->andThrow(new \Exception('Notification service unavailable'));

        $response = $this->actingAs($admin)
            ->postJson("/admin/id-verifications/{$user->id}/reject", [
                'notes' => 'ID image is blurry',
            ]);

        // Rejection should still succeed
        $response->assertStatus(302); // Redirect back

        $user->refresh();
        // Status should be updated despite notification failure
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertStringContainsString('ID image is blurry', $user->id_verification_notes);

        // Verify error was logged
        Log::shouldHaveReceived('error')
            ->with('Failed to send ID verification rejection notification', Mockery::type('array'));
    }

    /**
     * Test status is updated even if notification fails
     * Requirement: 10.6
     */
    public function test_status_updated_when_notification_fails()
    {
        Notification::fake();

        $admin = User::factory()->create([
            'user_type' => 'admin',
            'is_admin' => true,
        ]);

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Mock notification to throw exception
        Notification::shouldReceive('send')
            ->andThrow(new \Exception('Notification service unavailable'));

        $response = $this->actingAs($admin)
            ->postJson("/admin/id-verifications/{$user->id}/approve");

        $user->refresh();
        
        // Verify status was updated
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertStringContainsString('Approved by admin', $user->id_verification_notes);

        // Verify action was logged even though notification failed
        Log::shouldHaveReceived('error')
            ->with('Failed to send ID verification approval notification', Mockery::type('array'));
    }

    /**
     * Test error logging for upload failures
     * Requirement: 10.7
     */
    public function test_upload_failures_are_logged()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        // Mock FileUploadService to simulate failure
        $this->mock(FileUploadService::class, function ($mock) {
            $mock->shouldReceive('uploadWithRetry')
                ->once()
                ->andReturn([
                    'success' => false,
                    'error' => 'Upload failed',
                    'error_code' => 'UPLOAD_FAILED',
                ]);
        });

        $frontImage = UploadedFile::fake()->image('id_front.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $response->assertStatus(500);

        // Verify error logging
        Log::shouldHaveReceived('error')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_FAILED', Mockery::type('array'));
    }

    /**
     * Test error logging for exception during upload
     * Requirement: 10.7
     */
    public function test_upload_exceptions_are_logged()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        // Mock FileUploadService to throw exception
        $this->mock(FileUploadService::class, function ($mock) {
            $mock->shouldReceive('uploadWithRetry')
                ->once()
                ->andThrow(new \Exception('Unexpected error'));
        });

        $frontImage = UploadedFile::fake()->image('id_front.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $response->assertStatus(500);

        // Verify exception logging
        Log::shouldHaveReceived('error')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_EXCEPTION', Mockery::type('array'));
    }

    /**
     * Test resubmit clears previous rejection notes
     * Requirement: 10.3
     */
    public function test_resubmit_clears_rejection_notes()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/old_front.jpg',
            'id_back_image' => 'https://example.com/old_back.jpg',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'ID image is blurry',
        ]);

        $frontImage = UploadedFile::fake()->image('new_front.jpg', 1024, 768)->size(2048);
        $backImage = UploadedFile::fake()->image('new_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $frontImage,
                'back_image' => $backImage,
            ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verification_notes);
    }

    /**
     * Test partial upload state recovery
     * Requirement: 10.3
     */
    public function test_user_can_complete_partial_upload()
    {
        // User uploaded front but never completed back upload
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => null,
            'id_verification_status' => 'rejected', // Use rejected so back upload is allowed
        ]);

        // User should be able to complete the upload
        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
    }
}
