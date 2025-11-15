<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class IdVerificationNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that IdVerificationApproved notification is sent when admin approves
     */
    public function test_id_verification_approved_notification_is_sent_when_admin_approves(): void
    {
        Notification::fake();

        // Create admin user
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create user with pending ID verification
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Admin approves the ID verification
        $this->actingAs($admin)
            ->post(route('admin.id-verifications.approve', $user->id));

        // Assert notification was sent
        Notification::assertSentTo($user, IdVerificationApproved::class);
    }

    /**
     * Test that IdVerificationApproved notification includes correct title
     */
    public function test_id_verification_approved_notification_includes_correct_title(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationApproved();
        $notificationData = $notification->toArray($user);

        $this->assertEquals('Identity Verified!', $notificationData['title']);
    }

    /**
     * Test that IdVerificationApproved notification includes correct message
     */
    public function test_id_verification_approved_notification_includes_correct_message(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationApproved();
        $notificationData = $notification->toArray($user);

        $this->assertEquals('Your identity has been verified!', $notificationData['message']);
    }

    /**
     * Test that IdVerificationApproved notification includes action URL to profile page
     */
    public function test_id_verification_approved_notification_includes_profile_action_url(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationApproved();
        $notificationData = $notification->toArray($user);

        $this->assertEquals(route('profile.edit'), $notificationData['action_url']);
        $this->assertStringContainsString('/profile', $notificationData['action_url']);
    }

    /**
     * Test that IdVerificationRejected notification is sent when admin rejects
     */
    public function test_id_verification_rejected_notification_is_sent_when_admin_rejects(): void
    {
        Notification::fake();

        // Create admin user
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create user with pending ID verification
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        // Admin rejects the ID verification
        $this->actingAs($admin)
            ->post(route('admin.id-verifications.reject', $user->id), [
                'notes' => 'ID image is blurry'
            ]);

        // Assert notification was sent
        Notification::assertSentTo($user, IdVerificationRejected::class);
    }

    /**
     * Test that IdVerificationRejected notification includes correct title
     */
    public function test_id_verification_rejected_notification_includes_correct_title(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationRejected('ID image is blurry');
        $notificationData = $notification->toArray($user);

        $this->assertEquals('ID Verification Rejected', $notificationData['title']);
    }

    /**
     * Test that IdVerificationRejected notification includes rejection reason
     */
    public function test_id_verification_rejected_notification_includes_rejection_reason(): void
    {
        $user = User::factory()->create();
        $reason = 'ID image is blurry';
        $notification = new IdVerificationRejected($reason);
        $notificationData = $notification->toArray($user);

        $this->assertStringContainsString($reason, $notificationData['message']);
        $this->assertStringContainsString('Your ID verification was not approved', $notificationData['message']);
        $this->assertStringContainsString('Please re-upload your documents', $notificationData['message']);
    }

    /**
     * Test that IdVerificationRejected notification includes action URL to ID verification page
     */
    public function test_id_verification_rejected_notification_includes_id_verification_action_url(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationRejected('ID image is blurry');
        $notificationData = $notification->toArray($user);

        $this->assertEquals(route('id-verification.show'), $notificationData['action_url']);
        $this->assertStringContainsString('/id-verification', $notificationData['action_url']);
    }

    /**
     * Test notification data structure for approved verification
     */
    public function test_id_verification_approved_notification_has_correct_structure(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationApproved();
        $notificationData = $notification->toArray($user);

        // Assert all required fields are present
        $this->assertArrayHasKey('type', $notificationData);
        $this->assertArrayHasKey('title', $notificationData);
        $this->assertArrayHasKey('message', $notificationData);
        $this->assertArrayHasKey('action_url', $notificationData);
        $this->assertArrayHasKey('action_text', $notificationData);
        $this->assertArrayHasKey('icon', $notificationData);
        $this->assertArrayHasKey('color', $notificationData);

        // Assert correct values
        $this->assertEquals('id_verification_approved', $notificationData['type']);
        $this->assertEquals('check-circle', $notificationData['icon']);
        $this->assertEquals('green', $notificationData['color']);
    }

    /**
     * Test notification data structure for rejected verification
     */
    public function test_id_verification_rejected_notification_has_correct_structure(): void
    {
        $user = User::factory()->create();
        $notification = new IdVerificationRejected('Test reason');
        $notificationData = $notification->toArray($user);

        // Assert all required fields are present
        $this->assertArrayHasKey('type', $notificationData);
        $this->assertArrayHasKey('title', $notificationData);
        $this->assertArrayHasKey('message', $notificationData);
        $this->assertArrayHasKey('action_url', $notificationData);
        $this->assertArrayHasKey('action_text', $notificationData);
        $this->assertArrayHasKey('icon', $notificationData);
        $this->assertArrayHasKey('color', $notificationData);

        // Assert correct values
        $this->assertEquals('id_verification_rejected', $notificationData['type']);
        $this->assertEquals('x-circle', $notificationData['icon']);
        $this->assertEquals('red', $notificationData['color']);
    }

    /**
     * Test that frontend handles notification click redirects correctly for approved verification
     */
    public function test_frontend_notification_redirect_for_approved_verification(): void
    {
        // This test verifies the notification structure contains the correct action URL
        // The actual redirect is handled by JavaScript in AuthenticatedLayout.jsx
        $user = User::factory()->create();
        $notification = new IdVerificationApproved();
        $notificationData = $notification->toArray($user);

        // Verify the notification has the correct action URL for profile page
        $this->assertArrayHasKey('action_url', $notificationData);
        $this->assertStringContainsString('/profile', $notificationData['action_url']);
        
        // Verify notification type for frontend handling
        $this->assertEquals('id_verification_approved', $notificationData['type']);
    }

    /**
     * Test that frontend handles notification click redirects correctly for rejected verification
     */
    public function test_frontend_notification_redirect_for_rejected_verification(): void
    {
        // This test verifies the notification structure contains the correct action URL
        // The actual redirect is handled by JavaScript in AuthenticatedLayout.jsx
        $user = User::factory()->create();
        $notification = new IdVerificationRejected('Test reason');
        $notificationData = $notification->toArray($user);

        // Verify the notification has the correct action URL for ID verification page
        $this->assertArrayHasKey('action_url', $notificationData);
        $this->assertStringContainsString('/id-verification', $notificationData['action_url']);
        
        // Verify notification type for frontend handling
        $this->assertEquals('id_verification_rejected', $notificationData['type']);
    }
}
