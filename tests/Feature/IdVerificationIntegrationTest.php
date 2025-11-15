<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Integration tests for complete ID verification flows
 * Tests Requirements: All (1.1-10.10)
 * 
 * This test suite covers end-to-end workflows:
 * - Complete sequential upload flow (front → back → pending)
 * - Admin approval flow (approve → notification → verified)
 * - Admin rejection flow (reject → notification → resubmit)
 * - Notification click redirects
 */
class IdVerificationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
        Notification::fake();
        Log::spy();
    }

    /**
     * Helper method to create an admin user
     */
    protected function createAdmin(): User
    {
        return User::factory()->create([
            'user_type' => 'admin',
            'first_name' => 'Admin',
            'last_name' => 'User',
        ]);
    }

    /**
     * Test complete sequential upload flow: front → back → pending
     * 
     * This test verifies the entire user upload journey:
     * 1. User uploads front ID image
     * 2. Front image is saved and user can proceed
     * 3. User uploads back ID image
     * 4. Both images are saved and status becomes pending
     * 
     * Requirements: 1.1-1.10, 2.1-2.10, 3.1-3.7, 9.1-9.8
     */
    public function test_complete_sequential_upload_flow_front_to_back_to_pending()
    {
        // Create a gig worker user
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        // Verify initial state
        $this->assertNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);

        // Step 1: Upload front ID image
        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);
        
        $frontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        // Verify front upload response
        $frontResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Front ID uploaded successfully',
            ])
            ->assertJsonStructure([
                'success',
                'url',
                'message',
            ]);

        // Verify front image was saved
        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertStringContainsString('id_verification', $user->id_front_image);

        // Verify logging for front upload
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_STARTED', \Mockery::type('array'));
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_SUCCESS', \Mockery::type('array'));

        // Step 2: Attempt to upload back ID without front should fail (already uploaded, so should succeed)
        // But let's verify the back upload requires front image by testing with a new user
        $userWithoutFront = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $backImageTest = UploadedFile::fake()->image('id_back_test.jpg');
        
        $backTestResponse = $this->actingAs($userWithoutFront)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImageTest,
            ]);

        $backTestResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Please upload front ID first',
            ]);

        // Step 3: Upload back ID image (with front already uploaded)
        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);
        
        $backResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        // Verify back upload response
        $backResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
                'message' => 'ID verification submitted successfully',
            ])
            ->assertJsonStructure([
                'success',
                'url',
                'status',
                'message',
            ]);

        // Verify both images are saved and status is pending
        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertStringContainsString('id_verification', $user->id_back_image);

        // Verify logging for back upload
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_BACK_UPLOAD_STARTED', \Mockery::type('array'));
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_BACK_UPLOAD_SUCCESS', \Mockery::type('array'));

        // Verify upload progress tracking
        $this->assertTrue($user->hasIDDocuments());
    }

    /**
     * Test admin approval flow: approve → notification → verified
     * 
     * This test verifies the complete admin approval workflow:
     * 1. User has pending verification with both ID images
     * 2. Admin approves the verification
     * 3. User status changes to verified
     * 4. User receives approval notification
     * 5. Notification contains correct data and action URL
     * 6. User can see verified badge on profile
     * 
     * Requirements: 4.1-4.8, 5.1-5.10, 7.1-7.8, 8.1-8.7, 10.4, 10.5, 10.9, 10.10
     */
    public function test_admin_approval_flow_with_notification_and_verified_status()
    {
        // Create admin user
        $admin = $this->createAdmin();

        // Create user with pending verification
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
            'id_verified_at' => null,
            'id_verification_notes' => null,
        ]);

        // Verify initial state
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);
        $this->assertFalse($user->isIDVerified());

        // Step 1: Admin views the verification details
        $showResponse = $this->actingAs($admin)
            ->get("/admin/id-verifications/{$user->id}");

        $showResponse->assertStatus(200);

        // Step 2: Admin approves the verification
        $approveResponse = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        // Verify redirect with success message
        $approveResponse->assertRedirect()
            ->assertSessionHas('success', 'ID verified successfully. User has been notified.');

        // Step 3: Verify user status changed to verified
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertTrue($user->isIDVerified());

        // Verify admin information was recorded
        $this->assertStringContainsString('Approved by admin', $user->id_verification_notes);
        $this->assertStringContainsString($admin->id, $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);
        $this->assertStringContainsString($admin->last_name, $user->id_verification_notes);

        // Step 4: Verify notification was sent
        Notification::assertSentTo($user, IdVerificationApproved::class);

        // Step 5: Verify notification content
        Notification::assertSentTo($user, IdVerificationApproved::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            // Verify notification structure
            $this->assertEquals('id_verification_approved', $data['type']);
            $this->assertEquals('Identity Verified!', $data['title']);
            $this->assertStringContainsString('verified', $data['message']);
            $this->assertNotEmpty($data['action_url']);
            $this->assertEquals('check-circle', $data['icon']);
            $this->assertEquals('green', $data['color']);
            
            return true;
        });

        // Step 6: Verify logging
        Log::shouldHaveReceived('info')
            ->with('ID verification approved and notification sent', \Mockery::type('array'));

        // Step 7: Verify user can see verified status
        // (In real app, IDVerifiedBadge component would display on profile)
        $this->assertTrue($user->isIDVerified());
        $this->assertEquals('verified', $user->id_verification_status);
    }

    /**
     * Test admin rejection flow: reject → notification → resubmit
     * 
     * This test verifies the complete admin rejection workflow:
     * 1. User has pending verification with both ID images
     * 2. Admin rejects the verification with a reason
     * 3. User status changes to rejected
     * 4. User receives rejection notification with reason
     * 5. User can resubmit new ID images
     * 6. Status changes back to pending after resubmission
     * 
     * Requirements: 4.1-4.8, 6.1-6.14, 7.1-7.8, 9.1-9.8, 10.4, 10.5, 10.9, 10.10
     */
    public function test_admin_rejection_flow_with_notification_and_resubmission()
    {
        // Create admin user
        $admin = $this->createAdmin();

        // Create user with pending verification
        $user = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'Bob',
            'last_name' => 'Johnson',
            'id_front_image' => 'https://example.com/old_front.jpg',
            'id_back_image' => 'https://example.com/old_back.jpg',
            'id_verification_status' => 'pending',
            'id_verified_at' => null,
            'id_verification_notes' => null,
        ]);

        // Verify initial state
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);

        // Step 1: Admin views the verification details
        $showResponse = $this->actingAs($admin)
            ->get("/admin/id-verifications/{$user->id}");

        $showResponse->assertStatus(200);

        // Step 2: Admin rejects the verification with a reason
        $rejectionReason = 'ID image is blurry and unreadable. Please upload a clearer photo.';
        
        $rejectResponse = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => $rejectionReason,
            ]);

        // Verify redirect with success message
        $rejectResponse->assertRedirect()
            ->assertSessionHas('success', 'ID verification rejected. User has been notified.');

        // Step 3: Verify user status changed to rejected
        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);
        $this->assertFalse($user->isIDVerified());

        // Verify rejection reason and admin information was recorded
        $this->assertStringContainsString($rejectionReason, $user->id_verification_notes);
        $this->assertStringContainsString('Rejected by admin', $user->id_verification_notes);
        $this->assertStringContainsString($admin->id, $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);

        // Step 4: Verify notification was sent
        Notification::assertSentTo($user, IdVerificationRejected::class);

        // Step 5: Verify notification content includes rejection reason
        Notification::assertSentTo($user, IdVerificationRejected::class, function ($notification) use ($rejectionReason) {
            $data = $notification->toArray(new User());
            
            // Verify notification structure
            $this->assertEquals('id_verification_rejected', $data['type']);
            $this->assertEquals('ID Verification Rejected', $data['title']);
            $this->assertStringContainsString($rejectionReason, $data['message']);
            $this->assertStringContainsString('re-upload', $data['message']);
            $this->assertNotEmpty($data['action_url']);
            $this->assertEquals('x-circle', $data['icon']);
            $this->assertEquals('red', $data['color']);
            
            return true;
        });

        // Step 6: Verify logging
        Log::shouldHaveReceived('info')
            ->with('ID verification rejected and notification sent', \Mockery::type('array'));

        // Step 7: User resubmits new ID images
        $newFrontImage = UploadedFile::fake()->image('new_front.jpg', 1024, 768)->size(2048);
        $newBackImage = UploadedFile::fake()->image('new_back.jpg', 1024, 768)->size(2048);

        $resubmitResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $newFrontImage,
                'back_image' => $newBackImage,
            ]);

        // Verify resubmission response
        $resubmitResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'ID resubmitted successfully',
            ]);

        // Step 8: Verify status changed back to pending and notes cleared
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertNull($user->id_verification_notes);
        $this->assertNull($user->id_verified_at);

        // Verify new images are different from old ones
        $this->assertStringNotContainsString('old_front.jpg', $user->id_front_image);
        $this->assertStringNotContainsString('old_back.jpg', $user->id_back_image);

        // Step 9: Admin can now review the resubmitted images
        $showResponseAfterResubmit = $this->actingAs($admin)
            ->get("/admin/id-verifications/{$user->id}");

        $showResponseAfterResubmit->assertStatus(200);

        // Step 10: Admin approves the resubmitted verification
        $approveResponse = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $approveResponse->assertRedirect()
            ->assertSessionHas('success', 'ID verified successfully. User has been notified.');

        // Verify final verified status
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertTrue($user->isIDVerified());
    }

    /**
     * Test notification click redirects
     * 
     * This test verifies that notifications redirect users to the correct pages:
     * - Approval notification redirects to profile page
     * - Rejection notification redirects to ID verification page
     * 
     * Requirements: 5.7, 5.8, 6.11, 6.12, 7.4, 7.7
     */
    public function test_notification_click_redirects_to_correct_pages()
    {
        $admin = $this->createAdmin();

        // Test 1: Approval notification redirect
        $approvedUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front1.jpg',
            'id_back_image' => 'https://example.com/back1.jpg',
            'id_verification_status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$approvedUser->id}/approve");

        // Verify approval notification has correct action URL
        Notification::assertSentTo($approvedUser, IdVerificationApproved::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            // Verify action URL points to profile
            $this->assertNotEmpty($data['action_url']);
            $this->assertStringContainsString('profile', strtolower($data['action_url']));
            $this->assertNotEmpty($data['action_text']);
            
            return true;
        });

        // Test 2: Rejection notification redirect
        $rejectedUser = User::factory()->create([
            'user_type' => 'employer',
            'id_front_image' => 'https://example.com/front2.jpg',
            'id_back_image' => 'https://example.com/back2.jpg',
            'id_verification_status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$rejectedUser->id}/reject", [
                'notes' => 'Please provide clearer images',
            ]);

        // Verify rejection notification has correct action URL
        Notification::assertSentTo($rejectedUser, IdVerificationRejected::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            // Verify action URL points to ID verification page
            $this->assertNotEmpty($data['action_url']);
            $this->assertStringContainsString('id-verification', strtolower($data['action_url']));
            $this->assertNotEmpty($data['action_text']);
            
            return true;
        });
    }

    /**
     * Test complete workflow with multiple users
     * 
     * This test verifies the system can handle multiple users going through
     * different stages of the verification process simultaneously.
     * 
     * Requirements: All
     */
    public function test_complete_workflow_with_multiple_users()
    {
        $admin = $this->createAdmin();

        // User 1: Complete upload flow
        $user1 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'User',
            'last_name' => 'One',
        ]);

        $frontImage1 = UploadedFile::fake()->image('front1.jpg')->size(2048);
        $this->actingAs($user1)->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage1]);
        
        $backImage1 = UploadedFile::fake()->image('back1.jpg')->size(2048);
        $this->actingAs($user1)->postJson('/api/id-verification/upload-back', ['back_image' => $backImage1]);

        $user1->refresh();
        $this->assertEquals('pending', $user1->id_verification_status);

        // User 2: Complete upload and get approved
        $user2 = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'User',
            'last_name' => 'Two',
        ]);

        $frontImage2 = UploadedFile::fake()->image('front2.jpg')->size(2048);
        $this->actingAs($user2)->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage2]);
        
        $backImage2 = UploadedFile::fake()->image('back2.jpg')->size(2048);
        $this->actingAs($user2)->postJson('/api/id-verification/upload-back', ['back_image' => $backImage2]);

        $user2->refresh();
        $this->assertEquals('pending', $user2->id_verification_status);

        $this->actingAs($admin)->post("/admin/id-verifications/{$user2->id}/approve");
        
        $user2->refresh();
        $this->assertEquals('verified', $user2->id_verification_status);

        // User 3: Complete upload and get rejected, then resubmit
        $user3 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'User',
            'last_name' => 'Three',
        ]);

        $frontImage3 = UploadedFile::fake()->image('front3.jpg')->size(2048);
        $this->actingAs($user3)->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage3]);
        
        $backImage3 = UploadedFile::fake()->image('back3.jpg')->size(2048);
        $this->actingAs($user3)->postJson('/api/id-verification/upload-back', ['back_image' => $backImage3]);

        $user3->refresh();
        $this->assertEquals('pending', $user3->id_verification_status);

        $this->actingAs($admin)->post("/admin/id-verifications/{$user3->id}/reject", [
            'notes' => 'Image quality is poor',
        ]);
        
        $user3->refresh();
        $this->assertEquals('rejected', $user3->id_verification_status);

        $newFront3 = UploadedFile::fake()->image('new_front3.jpg')->size(2048);
        $newBack3 = UploadedFile::fake()->image('new_back3.jpg')->size(2048);
        $this->actingAs($user3)->postJson('/api/id-verification/resubmit', [
            'front_image' => $newFront3,
            'back_image' => $newBack3,
        ]);

        $user3->refresh();
        $this->assertEquals('pending', $user3->id_verification_status);

        // Verify all users are in correct states
        $user1->refresh();
        $user2->refresh();
        $user3->refresh();

        $this->assertEquals('pending', $user1->id_verification_status);
        $this->assertEquals('verified', $user2->id_verification_status);
        $this->assertEquals('pending', $user3->id_verification_status);

        // Verify notifications were sent correctly
        Notification::assertSentTo($user2, IdVerificationApproved::class);
        Notification::assertSentTo($user3, IdVerificationRejected::class);
        Notification::assertNotSentTo($user1, IdVerificationApproved::class);
        Notification::assertNotSentTo($user1, IdVerificationRejected::class);
    }

    /**
     * Test error handling throughout the complete flow
     * 
     * This test verifies that errors are handled gracefully at each step
     * and don't break the overall workflow.
     * 
     * Requirements: 9.1-9.8, 10.1-10.10
     */
    public function test_error_handling_throughout_complete_flow()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        // Test 1: Invalid file type for front upload
        $invalidFront = UploadedFile::fake()->create('front.pdf', 1000, 'application/pdf');
        $response1 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $invalidFront]);
        
        $response1->assertStatus(422)->assertJsonValidationErrors(['front_image']);
        $user->refresh();
        $this->assertNull($user->id_front_image);

        // Test 2: Oversized file for front upload
        $oversizedFront = UploadedFile::fake()->image('front.jpg')->size(6000);
        $response2 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $oversizedFront]);
        
        $response2->assertStatus(422)->assertJsonValidationErrors(['front_image']);
        $user->refresh();
        $this->assertNull($user->id_front_image);

        // Test 3: Valid front upload
        $validFront = UploadedFile::fake()->image('front.jpg')->size(2048);
        $response3 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $validFront]);
        
        $response3->assertStatus(200);
        $user->refresh();
        $this->assertNotNull($user->id_front_image);

        // Test 4: Invalid file type for back upload
        $invalidBack = UploadedFile::fake()->create('back.txt', 1000, 'text/plain');
        $response4 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $invalidBack]);
        
        $response4->assertStatus(422)->assertJsonValidationErrors(['back_image']);
        $user->refresh();
        $this->assertNull($user->id_back_image);

        // Test 5: Valid back upload
        $validBack = UploadedFile::fake()->image('back.jpg')->size(2048);
        $response5 = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $validBack]);
        
        $response5->assertStatus(200);
        $user->refresh();
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);

        // Verify user can still proceed despite earlier errors
        $this->assertTrue($user->hasIDDocuments());
    }

    /**
     * Test data persistence and audit trail
     * 
     * This test verifies that all verification actions are properly recorded
     * and maintain an audit trail.
     * 
     * Requirements: 10.1-10.10
     */
    public function test_data_persistence_and_audit_trail()
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Audit',
            'last_name' => 'Test',
        ]);

        // Upload images
        $frontImage = UploadedFile::fake()->image('front.jpg')->size(2048);
        $backImage = UploadedFile::fake()->image('back.jpg')->size(2048);

        $this->actingAs($user)->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage]);
        $this->actingAs($user)->postJson('/api/id-verification/upload-back', ['back_image' => $backImage]);

        $user->refresh();
        $initialFrontUrl = $user->id_front_image;
        $initialBackUrl = $user->id_back_image;

        // Admin rejects
        $this->actingAs($admin)->post("/admin/id-verifications/{$user->id}/reject", [
            'notes' => 'First rejection reason',
        ]);

        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertStringContainsString('First rejection reason', $user->id_verification_notes);
        $this->assertStringContainsString("admin {$admin->id}", $user->id_verification_notes);

        // User resubmits
        $newFront = UploadedFile::fake()->image('new_front.jpg')->size(2048);
        $newBack = UploadedFile::fake()->image('new_back.jpg')->size(2048);

        $this->actingAs($user)->postJson('/api/id-verification/resubmit', [
            'front_image' => $newFront,
            'back_image' => $newBack,
        ]);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verification_notes);
        $this->assertNotEquals($initialFrontUrl, $user->id_front_image);
        $this->assertNotEquals($initialBackUrl, $user->id_back_image);

        // Admin approves
        $this->actingAs($admin)->post("/admin/id-verifications/{$user->id}/approve");

        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertStringContainsString('Approved by admin', $user->id_verification_notes);
        $this->assertStringContainsString("admin {$admin->id}", $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);
        $this->assertStringContainsString($admin->last_name, $user->id_verification_notes);

        // Verify complete audit trail
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertNotNull($user->id_verified_at);
        $this->assertNotNull($user->id_verification_notes);
        $this->assertTrue($user->isIDVerified());
    }
}
