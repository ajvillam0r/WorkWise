<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

/**
 * Integration test for ID Verification Status Fix - Complete User Workflow
 * Tests Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * This test simulates the complete user registration and ID upload flow
 * to verify that status transitions from null to pending at the correct point.
 */
class IdVerificationStatusFixWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
        
        // Ensure migration is run
        Artisan::call('migrate');
    }

    /**
     * Test complete user workflow: registration → front upload → back upload → pending
     * 
     * This test verifies the entire user journey from registration through ID verification:
     * 1. New user registers and has null status
     * 2. User uploads front ID image and status remains null
     * 3. User uploads back ID image and status changes to pending
     * 
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_complete_user_workflow_status_transitions_correctly()
    {
        // Step 1: Create new user (simulating registration)
        // Requirement 5.1: Initial status should be null
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
        ]);

        // Verify initial state: status is null, no images uploaded
        $this->assertNull($user->id_verification_status, 'New user should have null verification status');
        $this->assertNull($user->id_front_image, 'New user should have no front image');
        $this->assertNull($user->id_back_image, 'New user should have no back image');

        // Step 2: User uploads front ID image
        // Requirement 5.1: Status should remain null after front upload
        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);
        
        $frontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        // Verify front upload was successful
        $frontResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Front ID uploaded successfully',
            ]);

        // Verify status remains null after front upload
        $user->refresh();
        $this->assertNotNull($user->id_front_image, 'Front image should be uploaded');
        $this->assertNull($user->id_back_image, 'Back image should still be null');
        $this->assertNull($user->id_verification_status, 'Status should remain null after front upload only');

        // Step 3: User uploads back ID image
        // Requirement 5.2: Status should change to pending after both images uploaded
        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);
        
        $backResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        // Verify back upload was successful
        $backResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
                'message' => 'ID verification submitted successfully',
            ]);

        // Requirement 5.2, 5.3: Verify status changed to pending atomically with back upload
        $user->refresh();
        $this->assertNotNull($user->id_front_image, 'Front image should still be present');
        $this->assertNotNull($user->id_back_image, 'Back image should be uploaded');
        $this->assertEquals('pending', $user->id_verification_status, 'Status should be pending after both images uploaded');

        // Requirement 5.5: Verify status flow is null → pending
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test that status remains null if only front image is uploaded
     * 
     * Requirements: 5.1
     */
    public function test_status_remains_null_with_only_front_image()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);

        // Verify initial null status
        $this->assertNull($user->id_verification_status);

        // Upload only front image
        $frontImage = UploadedFile::fake()->image('id_front.jpg')->size(2048);
        
        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ])
            ->assertStatus(200);

        // Verify status remains null
        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertNull($user->id_verification_status, 'Status must remain null with only front image');
    }

    /**
     * Test that status does not change to pending if back upload fails
     * 
     * Requirements: 5.4
     */
    public function test_status_remains_null_if_back_upload_fails()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);

        // Upload front image successfully
        $frontImage = UploadedFile::fake()->image('id_front.jpg')->size(2048);
        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage])
            ->assertStatus(200);

        $user->refresh();
        $this->assertNull($user->id_verification_status);

        // Attempt to upload invalid back image (oversized)
        $invalidBackImage = UploadedFile::fake()->image('id_back.jpg')->size(6000);
        
        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $invalidBackImage,
            ])
            ->assertStatus(422);

        // Verify status remains null after failed upload
        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertNull($user->id_verification_status, 'Status must remain null if back upload fails');
    }

    /**
     * Test complete status flow: null → pending → verified
     * 
     * Requirements: 5.5
     */
    public function test_complete_status_flow_null_to_pending_to_verified()
    {
        // Create admin user
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'first_name' => 'Admin',
            'last_name' => 'User',
        ]);

        // Create regular user
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);

        // Step 1: Verify initial null status
        $this->assertNull($user->id_verification_status);

        // Step 2: Upload both images
        $frontImage = UploadedFile::fake()->image('id_front.jpg')->size(2048);
        $backImage = UploadedFile::fake()->image('id_back.jpg')->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage])
            ->assertStatus(200);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $backImage])
            ->assertStatus(200);

        // Step 3: Verify status is now pending
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);

        // Step 4: Admin approves verification
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve")
            ->assertRedirect();

        // Step 5: Verify status is now verified
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);

        // Verify complete flow: null → pending → verified
        $this->assertTrue($user->isIDVerified());
    }

    /**
     * Test complete status flow: null → pending → rejected → null (after resubmit)
     * 
     * Requirements: 5.5
     */
    public function test_complete_status_flow_null_to_pending_to_rejected()
    {
        // Create admin user
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);

        // Create regular user
        $user = User::factory()->create([
            'user_type' => 'employer',
        ]);

        // Step 1: Verify initial null status
        $this->assertNull($user->id_verification_status);

        // Step 2: Upload both images
        $frontImage = UploadedFile::fake()->image('id_front.jpg')->size(2048);
        $backImage = UploadedFile::fake()->image('id_back.jpg')->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage])
            ->assertStatus(200);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $backImage])
            ->assertStatus(200);

        // Step 3: Verify status is now pending
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);

        // Step 4: Admin rejects verification
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => 'Image quality is poor',
            ])
            ->assertRedirect();

        // Step 5: Verify status is now rejected
        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);

        // Step 6: User resubmits new images
        $newFrontImage = UploadedFile::fake()->image('new_front.jpg')->size(2048);
        $newBackImage = UploadedFile::fake()->image('new_back.jpg')->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $newFrontImage,
                'back_image' => $newBackImage,
            ])
            ->assertStatus(200);

        // Step 7: Verify status is back to pending
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);

        // Verify flow: null → pending → rejected → pending
        $this->assertFalse($user->isIDVerified());
    }

    /**
     * Test that multiple users can go through the workflow independently
     * 
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_multiple_users_workflow_independently()
    {
        // Create three users
        $user1 = User::factory()->create(['user_type' => 'gig_worker']);
        $user2 = User::factory()->create(['user_type' => 'employer']);
        $user3 = User::factory()->create(['user_type' => 'gig_worker']);

        // All start with null status
        $this->assertNull($user1->id_verification_status);
        $this->assertNull($user2->id_verification_status);
        $this->assertNull($user3->id_verification_status);

        // User 1: Upload only front image
        $front1 = UploadedFile::fake()->image('front1.jpg')->size(2048);
        $this->actingAs($user1)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $front1])
            ->assertStatus(200);

        // User 2: Upload both images
        $front2 = UploadedFile::fake()->image('front2.jpg')->size(2048);
        $back2 = UploadedFile::fake()->image('back2.jpg')->size(2048);
        $this->actingAs($user2)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $front2])
            ->assertStatus(200);
        $this->actingAs($user2)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $back2])
            ->assertStatus(200);

        // User 3: No uploads

        // Verify each user's status
        $user1->refresh();
        $user2->refresh();
        $user3->refresh();

        $this->assertNull($user1->id_verification_status, 'User 1 should have null status (only front uploaded)');
        $this->assertEquals('pending', $user2->id_verification_status, 'User 2 should have pending status (both uploaded)');
        $this->assertNull($user3->id_verification_status, 'User 3 should have null status (no uploads)');

        // Verify image states
        $this->assertNotNull($user1->id_front_image);
        $this->assertNull($user1->id_back_image);

        $this->assertNotNull($user2->id_front_image);
        $this->assertNotNull($user2->id_back_image);

        $this->assertNull($user3->id_front_image);
        $this->assertNull($user3->id_back_image);
    }

    /**
     * Test atomic status change with back image upload
     * 
     * Requirements: 5.3
     */
    public function test_status_changes_atomically_with_back_upload()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        // Upload front image
        $frontImage = UploadedFile::fake()->image('id_front.jpg')->size(2048);
        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $frontImage])
            ->assertStatus(200);

        $user->refresh();
        $initialStatus = $user->id_verification_status;
        $this->assertNull($initialStatus);

        // Upload back image
        $backImage = UploadedFile::fake()->image('id_back.jpg')->size(2048);
        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', ['back_image' => $backImage]);

        // Verify response includes the new status
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
            ]);

        // Verify database was updated atomically
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNotNull($user->id_back_image);

        // Both back image and status should be set together
        $this->assertTrue(
            $user->id_back_image !== null && $user->id_verification_status === 'pending',
            'Back image and pending status should be set atomically'
        );
    }
}
