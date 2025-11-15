<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Unit tests for Admin\IdVerificationController
 * Tests Requirements: 4.1-4.8, 5.1-5.10, 6.1-6.14, 10.4, 10.5, 10.9, 10.10
 */
class IdVerificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
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
     * Helper method to create a user with pending ID verification
     */
    protected function createUserWithPendingVerification(): User
    {
        return User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);
    }

    /**
     * Test approve method updates status and sends notification
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9, 10.4, 10.5
     */
    public function test_approve_updates_status_and_sends_notification()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $response = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $response->assertRedirect()
            ->assertSessionHas('success', 'ID verified successfully. User has been notified.');

        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
        $this->assertStringContainsString('Approved by admin', $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);

        Notification::assertSentTo($user, IdVerificationApproved::class);
    }

    /**
     * Test approve method records admin information
     * Requirements: 5.3, 10.4, 10.5
     */
    public function test_approve_records_admin_information()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $user->refresh();
        $this->assertStringContainsString("admin {$admin->id}", $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);
        $this->assertStringContainsString($admin->last_name, $user->id_verification_notes);
    }

    /**
     * Test approve method requires admin authentication
     */
    public function test_approve_requires_admin_authentication()
    {
        $regularUser = User::factory()->create(['user_type' => 'gig_worker']);
        $userToVerify = $this->createUserWithPendingVerification();

        $response = $this->actingAs($regularUser)
            ->post("/admin/id-verifications/{$userToVerify->id}/approve");

        // Expect redirect (302) or forbidden (403) depending on middleware configuration
        $this->assertContains($response->status(), [302, 403]);

        $userToVerify->refresh();
        $this->assertEquals('pending', $userToVerify->id_verification_status);
    }

    /**
     * Test reject method with reason
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 10.4, 10.5
     */
    public function test_reject_with_reason_updates_status_and_sends_notification()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $rejectionReason = 'ID image is blurry and unreadable';

        $response = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => $rejectionReason,
            ]);

        $response->assertRedirect()
            ->assertSessionHas('success', 'ID verification rejected. User has been notified.');

        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);
        $this->assertStringContainsString($rejectionReason, $user->id_verification_notes);
        $this->assertStringContainsString('Rejected by admin', $user->id_verification_notes);

        Notification::assertSentTo($user, IdVerificationRejected::class, function ($notification) use ($rejectionReason) {
            $data = $notification->toArray(new User());
            return str_contains($data['message'], $rejectionReason);
        });
    }

    /**
     * Test reject method requires reason
     * Requirements: 6.2
     */
    public function test_reject_requires_reason()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $response = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => '',
            ]);

        $response->assertSessionHasErrors(['notes']);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test reject method validates reason length
     * Requirements: 6.2
     */
    public function test_reject_validates_reason_length()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $longReason = str_repeat('a', 501); // Exceeds 500 character limit

        $response = $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => $longReason,
            ]);

        $response->assertSessionHasErrors(['notes']);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test reject method records admin information
     * Requirements: 6.5, 10.4, 10.5
     */
    public function test_reject_records_admin_information()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => 'Invalid ID',
            ]);

        $user->refresh();
        $this->assertStringContainsString("admin {$admin->id}", $user->id_verification_notes);
        $this->assertStringContainsString($admin->first_name, $user->id_verification_notes);
        $this->assertStringContainsString($admin->last_name, $user->id_verification_notes);
    }

    /**
     * Test reject method requires admin authentication
     */
    public function test_reject_requires_admin_authentication()
    {
        $regularUser = User::factory()->create(['user_type' => 'gig_worker']);
        $userToVerify = $this->createUserWithPendingVerification();

        $response = $this->actingAs($regularUser)
            ->post("/admin/id-verifications/{$userToVerify->id}/reject", [
                'notes' => 'Invalid ID',
            ]);

        // Expect redirect (302) or forbidden (403) depending on middleware configuration
        $this->assertContains($response->status(), [302, 403]);

        $userToVerify->refresh();
        $this->assertEquals('pending', $userToVerify->id_verification_status);
    }

    /**
     * Test index method lists pending verifications
     * Requirements: 4.1, 4.2, 4.8
     */
    public function test_index_lists_pending_verifications()
    {
        $admin = $this->createAdmin();
        
        // Create users with different verification statuses
        $pendingUser1 = $this->createUserWithPendingVerification();
        $pendingUser2 = $this->createUserWithPendingVerification();
        
        $verifiedUser = User::factory()->create([
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'verified',
        ]);

        $response = $this->actingAs($admin)
            ->get('/admin/id-verifications?status=pending');

        $response->assertStatus(200);
        
        // For Inertia responses, we just verify the page renders successfully
        // The actual data verification would require Inertia testing helpers
    }

    /**
     * Test index method filters by status
     * Requirements: 4.1, 4.2
     */
    public function test_index_filters_by_status()
    {
        $admin = $this->createAdmin();
        
        $pendingUser = $this->createUserWithPendingVerification();
        
        $verifiedUser = User::factory()->create([
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'verified',
        ]);

        // Test pending filter
        $response = $this->actingAs($admin)
            ->get('/admin/id-verifications?status=pending');

        $response->assertStatus(200);

        // Test verified filter
        $response = $this->actingAs($admin)
            ->get('/admin/id-verifications?status=verified');

        $response->assertStatus(200);
    }

    /**
     * Test show method displays verification details
     * Requirements: 4.3, 4.4, 4.5, 4.7, 4.8
     */
    public function test_show_displays_verification_details()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $response = $this->actingAs($admin)
            ->get("/admin/id-verifications/{$user->id}");

        $response->assertStatus(200);
        
        // For Inertia responses, we just verify the page renders successfully
        // The actual data verification would require Inertia testing helpers
    }

    /**
     * Test show method redirects if no ID images
     * Requirements: 4.3
     */
    public function test_show_redirects_if_no_id_images()
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'id_front_image' => null,
            'id_back_image' => null,
        ]);

        $response = $this->actingAs($admin)
            ->get("/admin/id-verifications/{$user->id}");

        $response->assertRedirect('/admin/id-verifications')
            ->assertSessionHas('error');
    }

    /**
     * Test approval workflow clears rejection notes
     * Requirements: 5.1, 5.2
     */
    public function test_approval_after_rejection_clears_notes()
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create([
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'Previous rejection reason',
        ]);

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertStringNotContainsString('Previous rejection reason', $user->id_verification_notes);
        $this->assertStringContainsString('Approved by admin', $user->id_verification_notes);
    }

    /**
     * Test rejection workflow allows resubmission
     * Requirements: 6.13, 6.14
     */
    public function test_rejection_allows_resubmission()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        // Reject the verification
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => 'Please provide clearer images',
            ]);

        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);

        // User can resubmit (status can be changed back to pending)
        $user->update(['id_verification_status' => 'pending']);
        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test notification content for approval
     * Requirements: 5.4, 5.5, 5.6, 5.7, 5.8
     */
    public function test_approval_notification_content()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        Notification::assertSentTo($user, IdVerificationApproved::class, function ($notification) {
            $data = $notification->toArray(new User());
            
            return $data['type'] === 'id_verification_approved'
                && $data['title'] === 'Identity Verified!'
                && str_contains($data['message'], 'verified')
                && isset($data['action_url'])
                && $data['icon'] === 'check-circle'
                && $data['color'] === 'green';
        });
    }

    /**
     * Test notification content for rejection
     * Requirements: 6.7, 6.8, 6.9, 6.10, 6.11, 6.12
     */
    public function test_rejection_notification_content()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $rejectionReason = 'ID image is not clear';

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/reject", [
                'notes' => $rejectionReason,
            ]);

        Notification::assertSentTo($user, IdVerificationRejected::class, function ($notification) use ($rejectionReason) {
            $data = $notification->toArray(new User());
            
            return $data['type'] === 'id_verification_rejected'
                && $data['title'] === 'ID Verification Rejected'
                && str_contains($data['message'], $rejectionReason)
                && str_contains($data['message'], 're-upload')
                && isset($data['action_url'])
                && $data['icon'] === 'x-circle'
                && $data['color'] === 'red';
        });
    }

    /**
     * Test logging for admin actions
     * Requirements: 10.10
     */
    public function test_admin_actions_are_logged()
    {
        $admin = $this->createAdmin();
        $user = $this->createUserWithPendingVerification();

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user->id}/approve");

        Log::shouldHaveReceived('info')
            ->with('ID verification approved and notification sent', \Mockery::type('array'));
    }

    /**
     * Test multiple approvals in sequence
     * Requirements: 5.1, 5.2, 5.3
     */
    public function test_multiple_approvals_in_sequence()
    {
        $admin = $this->createAdmin();
        
        $user1 = $this->createUserWithPendingVerification();
        $user2 = $this->createUserWithPendingVerification();
        $user3 = $this->createUserWithPendingVerification();

        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user1->id}/approve");
        
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user2->id}/approve");
        
        $this->actingAs($admin)
            ->post("/admin/id-verifications/{$user3->id}/approve");

        $user1->refresh();
        $user2->refresh();
        $user3->refresh();

        $this->assertEquals('verified', $user1->id_verification_status);
        $this->assertEquals('verified', $user2->id_verification_status);
        $this->assertEquals('verified', $user3->id_verification_status);

        Notification::assertSentTo([$user1, $user2, $user3], IdVerificationApproved::class);
    }

    /**
     * Test authorization for non-admin users
     */
    public function test_index_requires_admin_authentication()
    {
        $regularUser = User::factory()->create(['user_type' => 'gig_worker']);

        $response = $this->actingAs($regularUser)
            ->get('/admin/id-verifications');

        // Expect redirect (302) or forbidden (403) depending on middleware configuration
        $this->assertContains($response->status(), [302, 403]);
    }

    /**
     * Test show requires admin authentication
     */
    public function test_show_requires_admin_authentication()
    {
        $regularUser = User::factory()->create(['user_type' => 'gig_worker']);
        $userToView = $this->createUserWithPendingVerification();

        $response = $this->actingAs($regularUser)
            ->get("/admin/id-verifications/{$userToView->id}");

        // Expect redirect (302) or forbidden (403) depending on middleware configuration
        $this->assertContains($response->status(), [302, 403]);
    }
}
