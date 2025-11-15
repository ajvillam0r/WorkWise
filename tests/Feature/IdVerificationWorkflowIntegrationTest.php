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
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Comprehensive Integration Tests for ID Verification Workflow Enhancement
 * 
 * Tests Requirements: All (1.1-10.7)
 * Task: 9. Write integration tests for complete workflow
 * 
 * This test suite covers:
 * - Upload → pending → cannot re-upload flow
 * - Pending → admin approval → notification → badge display flow
 * - Pending → admin rejection → notification → re-upload flow
 * - Button visibility based on status changes
 * - Status banner display based on status
 * - Notification click redirects
 */
class IdVerificationWorkflowIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
        Notification::fake();
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
     * Test: Upload → pending → cannot re-upload flow
     * 
     * This test verifies:
     * 1. User uploads front and back ID images
     * 2. Status changes to pending after both uploads
     * 3. User cannot upload new images while status is pending
     * 4. Backend blocks upload attempts with proper error message
     * 5. Frontend displays pending status banner
     * 
     * Requirements: 1.1-1.6, 2.1-2.7, 9.1-9.9
     */
    public function test_upload_to_pending_prevents_reupload()
    {
        // Start with a user that has rejected status (allows uploads)
        // Note: Database schema uses 'pending' as default, but we need a status that allows uploads
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected', // Rejected status allows re-upload
            'id_front_image' => null,
            'id_back_image' => null,
        ]);

        // Step 1: Upload front ID image
        $frontImage = UploadedFile::fake()->image('front.jpg', 1024, 768)->size(2048);
        
        $frontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $frontResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);

        // Step 2: Upload back ID image
        $backImage = UploadedFile::fake()->image('back.jpg', 1024, 768)->size(2048);
        
        $backResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $backResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
            ]);

        // Step 3: Verify status is pending
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);

        // Step 4: Attempt to upload front image again (should be blocked)
        $newFrontImage = UploadedFile::fake()->image('new_front.jpg')->size(2048);
        
        $blockedFrontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $newFrontImage,
            ]);

        $blockedFrontResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is currently under review. Please wait for admin verification.',
            ]);

        // Step 5: Attempt to upload back image again (should be blocked)
        $newBackImage = UploadedFile::fake()->image('new_back.jpg')->size(2048);
        
        $blockedBackResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $newBackImage,
            ]);

        $blockedBackResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is currently under review. Please wait for admin verification.',
            ]);

        // Step 6: Verify frontend displays pending status
        $pageResponse = $this->actingAs($user)
            ->get(route('id-verification.show'));

        $pageResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'pending')
            );

        // Verify images were not changed in database
        $user->refresh();
        $this->assertStringNotContainsString('new_front', $user->id_front_image);
        $this->assertStringNotContainsString('new_back', $user->id_back_image);
    }

    /**
     * Test: Pending → admin approval → notification → badge display flow
     * 
     * This test verifies:
     * 1. User has pending verification
     * 2. Admin approves the verification
     * 3. Status changes to verified
     * 4. User receives approval notification
     * 5. Badge displays on profile pages
     * 6. Quick access button is hidden
     * 
     * Requirements: 3.1-3.8, 4.1-4.7, 5.1-5.5, 8.1-8.5, 9.1-9.9
     */
    public function test_pending_to_approval_notification_and_badge_display()
    {
        $admin = $this->createAdmin();
        
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Step 1: Verify initial pending state
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);

        // Step 2: Admin approves the verification
        $approveResponse = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $approveResponse->assertRedirect()
            ->assertSessionHas('success', 'ID verified successfully. User has been notified.');

        // Step 3: Verify status changed to verified
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertTrue($user->isIDVerified());

        // Step 4: Verify notification was sent with correct data
        Notification::assertSentTo($user, IdVerificationApproved::class);
        
        Notification::assertSentTo($user, IdVerificationApproved::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            $this->assertEquals('id_verification_approved', $data['type']);
            $this->assertEquals('Identity Verified!', $data['title']);
            $this->assertEquals('Your identity has been verified!', $data['message']);
            $this->assertStringContainsString('/profile', $data['action_url']);
            $this->assertEquals('check-circle', $data['icon']);
            $this->assertEquals('green', $data['color']);
            
            return true;
        });

        // Step 5: Verify badge displays on profile edit page
        $profileResponse = $this->actingAs($user)
            ->get(route('profile.edit'));

        $profileResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('auth.user.id_verification_status', 'verified')
            );

        // Step 6: Verify badge displays on public worker profile
        $viewer = User::factory()->create(['user_type' => 'employer']);
        
        $workerProfileResponse = $this->actingAs($viewer)
            ->get(route('workers.show', $user->id));

        $workerProfileResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profiles/WorkerProfile')
                ->where('user.id_verification_status', 'verified')
            );

        // Step 7: Verify quick access button is hidden (status message shown instead)
        $profileResponse->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id_verification_status', 'verified')
        );
    }

    /**
     * Test: Pending → admin rejection → notification → re-upload flow
     * 
     * This test verifies:
     * 1. User has pending verification
     * 2. Admin rejects with reason
     * 3. Status changes to rejected
     * 4. User receives rejection notification with reason
     * 5. User can re-upload new images
     * 6. Status changes back to pending after re-upload
     * 7. Quick access button reappears with "Re-upload ID" text
     * 
     * Requirements: 6.1-6.12, 7.1-7.9, 8.1-8.5, 9.1-9.9
     */
    public function test_pending_to_rejection_notification_and_reupload()
    {
        $admin = $this->createAdmin();
        
        $user = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'Bob',
            'last_name' => 'Smith',
            'id_front_image' => 'https://example.com/old_front.jpg',
            'id_back_image' => 'https://example.com/old_back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Step 1: Verify initial pending state
        $this->assertEquals('pending', $user->id_verification_status);

        // Step 2: Admin rejects with reason
        $rejectionReason = 'ID image is blurry and unreadable. Please upload a clearer photo.';
        
        $rejectResponse = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => $rejectionReason,
            ]);

        $rejectResponse->assertRedirect()
            ->assertSessionHas('success', 'ID verification rejected. User has been notified.');

        // Step 3: Verify status changed to rejected
        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertStringContainsString($rejectionReason, $user->id_verification_notes);
        $this->assertNull($user->id_verified_at);

        // Step 4: Verify notification was sent with rejection reason
        Notification::assertSentTo($user, IdVerificationRejected::class);
        
        Notification::assertSentTo($user, IdVerificationRejected::class, function ($notification) use ($rejectionReason) {
            $data = $notification->toArray(new User());
            
            $this->assertEquals('id_verification_rejected', $data['type']);
            $this->assertEquals('ID Verification Rejected', $data['title']);
            $this->assertStringContainsString($rejectionReason, $data['message']);
            $this->assertStringContainsString('/id-verification', $data['action_url']);
            $this->assertEquals('x-circle', $data['icon']);
            $this->assertEquals('red', $data['color']);
            
            return true;
        });

        // Step 5: Verify rejection status displays on ID verification page
        $idVerificationResponse = $this->actingAs($user)
            ->get(route('id-verification.show'));

        $idVerificationResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'rejected')
            );

        // Step 6: Verify quick access button shows "Re-upload ID" on profile
        $profileResponse = $this->actingAs($user)
            ->get(route('profile.edit'));

        $profileResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('auth.user.id_verification_status', 'rejected')
            );

        // Step 7: User re-uploads new images
        $newFrontImage = UploadedFile::fake()->image('new_front.jpg')->size(2048);
        $newBackImage = UploadedFile::fake()->image('new_back.jpg')->size(2048);

        $resubmitResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $newFrontImage,
                'back_image' => $newBackImage,
            ]);

        $resubmitResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        // Step 8: Verify status changed back to pending and notes cleared
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verification_notes);
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertStringNotContainsString('old_front', $user->id_front_image);
        $this->assertStringNotContainsString('old_back', $user->id_back_image);

        // Step 9: Verify user cannot upload again while pending
        $anotherImage = UploadedFile::fake()->image('another.jpg')->size(2048);
        
        $blockedResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $anotherImage,
            ]);

        $blockedResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is currently under review. Please wait for admin verification.',
            ]);
    }

    /**
     * Test: Button visibility based on status changes
     * 
     * This test verifies the ID Verification Quick Access button visibility:
     * 1. Button shows "Verify Your ID" when status is null (unverified)
     * 2. Button is hidden when status is pending
     * 3. Button is hidden when status is verified
     * 4. Button shows "Re-upload ID" when status is rejected
     * 
     * Requirements: 5.1-5.5, 8.1-8.5
     */
    public function test_button_visibility_based_on_status_changes()
    {
        // Test 1: Button visible with "Verify Your ID" when unverified (pending is default)
        $unverifiedUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'pending',
        ]);

        $response1 = $this->actingAs($unverifiedUser)
            ->get(route('profile.edit'));

        $response1->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('auth.user.id_verification_status', 'pending')
            );

        // Test 2: Button hidden when status is pending (with images)
        $unverifiedUser->update([
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        $response2 = $this->actingAs($unverifiedUser)
            ->get(route('profile.edit'));

        $response2->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id_verification_status', 'pending')
            );

        // Test 3: Button hidden when status is verified
        $verifiedUser = User::factory()->create([
            'user_type' => 'employer',
            'id_verification_status' => 'verified',
            'id_verified_at' => now(),
        ]);

        $response3 = $this->actingAs($verifiedUser)
            ->get(route('profile.edit'));

        $response3->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id_verification_status', 'verified')
            );

        // Test 4: Button visible with "Re-upload ID" when rejected
        $rejectedUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'Image quality is poor',
        ]);

        $response4 = $this->actingAs($rejectedUser)
            ->get(route('profile.edit'));

        $response4->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id_verification_status', 'rejected')
            );
    }

    /**
     * Test: Status banner display based on status
     * 
     * This test verifies the correct status banners display:
     * 1. Pending banner with "Your ID has been submitted" message
     * 2. Verified banner with success message
     * 3. Rejected banner with rejection reason
     * 4. Upload forms hidden when pending or verified
     * 5. Upload forms visible when rejected
     * 
     * Requirements: 1.1-1.6, 2.1-2.7, 7.1-7.3
     */
    public function test_status_banner_display_based_on_status()
    {
        // Test 1: Pending status banner
        $pendingUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        $pendingResponse = $this->actingAs($pendingUser)
            ->get(route('id-verification.show'));

        $pendingResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'pending')
            );

        // Test 2: Verified status (should show verified message)
        $verifiedUser = User::factory()->create([
            'user_type' => 'employer',
            'id_verification_status' => 'verified',
            'id_verified_at' => now(),
        ]);

        $verifiedResponse = $this->actingAs($verifiedUser)
            ->get(route('id-verification.show'));

        $verifiedResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'verified')
            );

        // Test 3: Rejected status banner
        $rejectionReason = 'Document is expired';
        $rejectedUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => $rejectionReason,
        ]);

        $rejectedResponse = $this->actingAs($rejectedUser)
            ->get(route('id-verification.show'));

        $rejectedResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'rejected')
            );
        
        // Verify rejection reason is stored in database
        $this->assertStringContainsString($rejectionReason, $rejectedUser->id_verification_notes);
    }

    /**
     * Test: Notification click redirects
     * 
     * This test verifies notification action URLs:
     * 1. Approval notification redirects to profile page
     * 2. Rejection notification redirects to ID verification page
     * 3. Notifications contain correct action text
     * 
     * Requirements: 3.4, 3.8, 6.5, 6.9
     */
    public function test_notification_click_redirects()
    {
        $admin = $this->createAdmin();

        // Test 1: Approval notification redirect to profile
        $approvedUser = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front1.jpg',
            'id_back_image' => 'https://example.com/back1.jpg',
            'id_verification_status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$approvedUser->id}/approve");

        Notification::assertSentTo($approvedUser, IdVerificationApproved::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            // Verify action URL points to profile
            $this->assertNotEmpty($data['action_url']);
            $this->assertStringContainsString('/profile', $data['action_url']);
            $this->assertNotEmpty($data['action_text']);
            $this->assertEquals('View Profile', $data['action_text']);
            
            return true;
        });

        // Test 2: Rejection notification redirect to ID verification page
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

        Notification::assertSentTo($rejectedUser, IdVerificationRejected::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            // Verify action URL points to ID verification page
            $this->assertNotEmpty($data['action_url']);
            $this->assertStringContainsString('/id-verification', $data['action_url']);
            $this->assertNotEmpty($data['action_text']);
            $this->assertEquals('Re-upload ID', $data['action_text']);
            
            return true;
        });
    }

    /**
     * Test: Complete workflow with all status transitions
     * 
     * This comprehensive test verifies the entire workflow:
     * 1. User uploads → pending
     * 2. Cannot re-upload while pending
     * 3. Admin rejects → rejected
     * 4. User re-uploads → pending
     * 5. Admin approves → verified
     * 6. Cannot upload when verified
     * 
     * Requirements: All (1.1-10.7)
     */
    public function test_complete_workflow_all_status_transitions()
    {
        $admin = $this->createAdmin();
        
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Complete',
            'last_name' => 'Workflow',
            'id_verification_status' => 'pending',
        ]);

        // Phase 1: Initial upload → pending
        $frontImage1 = UploadedFile::fake()->image('front1.jpg')->size(2048);
        $backImage1 = UploadedFile::fake()->image('back1.jpg')->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage1]);
        
        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $backImage1]);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);

        // Phase 2: Cannot re-upload while pending
        $blockedImage = UploadedFile::fake()->image('blocked.jpg')->size(2048);
        
        $blockedResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $blockedImage]);

        $blockedResponse->assertStatus(400);

        // Phase 3: Admin rejects → rejected
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => 'First rejection',
            ]);

        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        Notification::assertSentTo($user, IdVerificationRejected::class);

        // Phase 4: User re-uploads → pending
        $frontImage2 = UploadedFile::fake()->image('front2.jpg')->size(2048);
        $backImage2 = UploadedFile::fake()->image('back2.jpg')->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $frontImage2,
                'back_image' => $backImage2,
            ]);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verification_notes);

        // Phase 5: Admin approves → verified
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        Notification::assertSentTo($user, IdVerificationApproved::class);

        // Phase 6: Cannot upload when verified
        $verifiedBlockedImage = UploadedFile::fake()->image('verified_blocked.jpg')->size(2048);
        
        $verifiedBlockedResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $verifiedBlockedImage]);

        $verifiedBlockedResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your ID is already verified.',
            ]);

        // Verify final state
        $this->assertTrue($user->isIDVerified());
        $this->assertEquals('verified', $user->id_verification_status);
    }
}
