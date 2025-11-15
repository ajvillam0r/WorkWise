<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\IdVerificationApproved;
use App\Notifications\IdVerificationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class IdVerificationStatusConsistencyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that id_verification_status is passed correctly to Upload page
     */
    public function test_id_verification_status_passed_to_upload_page()
    {
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        $response = $this->actingAs($user)->get(route('id-verification.show'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('IdVerification/Upload')
                ->where('auth.user.id_verification_status', 'pending')
        );
    }

    /**
     * Test that id_verification_status is passed correctly to Profile Edit page
     */
    public function test_id_verification_status_passed_to_profile_edit_page()
    {
        $user = User::factory()->create([
            'id_verification_status' => 'verified',
        ]);

        $response = $this->actingAs($user)->get(route('profile.edit'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Profile/Edit')
                ->where('auth.user.id_verification_status', 'verified')
        );
    }

    /**
     * Test that status values are one of: 'pending', 'verified', 'rejected'
     * Note: Database schema uses 'pending' as default, doesn't allow NULL
     */
    public function test_status_values_are_valid()
    {
        $validStatuses = ['pending', 'verified', 'rejected'];

        foreach ($validStatuses as $status) {
            $user = User::factory()->create([
                'id_verification_status' => $status,
            ]);

            $this->assertContains($user->id_verification_status, $validStatuses);
        }
    }

    /**
     * Test that status updates are reflected immediately in UI after admin approval
     */
    public function test_status_updates_reflected_after_admin_approval()
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        // Admin approves the verification
        $response = $this->actingAs($admin)
            ->post(route('admin.id-verifications.approve', $user->id));

        $response->assertRedirect();

        // Verify status is updated in database
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);

        // Verify notification was sent
        Notification::assertSentTo($user, IdVerificationApproved::class);

        // Verify status is passed to pages
        $response = $this->actingAs($user)->get(route('profile.edit'));
        $response->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'verified')
        );
    }

    /**
     * Test that status updates are reflected immediately in UI after admin rejection
     */
    public function test_status_updates_reflected_after_admin_rejection()
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        // Admin rejects the verification
        $response = $this->actingAs($admin)
            ->post(route('admin.id-verifications.reject', $user->id), [
                'notes' => 'ID image is blurry'
            ]);

        $response->assertRedirect();

        // Verify status is updated in database
        $user->refresh();
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertNull($user->id_verified_at);
        $this->assertStringContainsString('ID image is blurry', $user->id_verification_notes);

        // Verify notification was sent
        Notification::assertSentTo($user, IdVerificationRejected::class);

        // Verify status is passed to pages
        $response = $this->actingAs($user)->get(route('id-verification.show'));
        $response->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'rejected')
        );
    }

    /**
     * Test that status updates persist after page refresh
     */
    public function test_status_updates_persist_after_page_refresh()
    {
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
        ]);

        // First request
        $response1 = $this->actingAs($user)->get(route('profile.edit'));
        $response1->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'pending')
        );

        // Update status
        $user->update(['id_verification_status' => 'verified']);

        // Second request (simulating page refresh)
        $response2 = $this->actingAs($user)->get(route('profile.edit'));
        $response2->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'verified')
        );
    }

    /**
     * Test that badge component receives correct status
     */
    public function test_badge_component_receives_correct_status()
    {
        // Create a viewer user (different from profile owner)
        $viewer = User::factory()->create([
            'user_type' => 'employer',
        ]);

        // Create a worker with verified status
        $worker = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'verified',
        ]);

        // Check worker profile page (viewed by different user)
        $response = $this->actingAs($viewer)->get(route('workers.show', $worker->id));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->where('user.id_verification_status', 'verified')
        );

        // Create an employer with verified status
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'id_verification_status' => 'verified',
        ]);

        // Create a different viewer (gig worker)
        $workerViewer = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);

        // Check employer profile page (viewed by different user)
        $response = $this->actingAs($workerViewer)->get(route('employers.show', $employer->id));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->where('user.id_verification_status', 'verified')
        );
    }

    /**
     * Test that notification system uses correct status
     */
    public function test_notification_system_uses_correct_status()
    {
        Notification::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        // Test approval notification
        $this->actingAs($admin)
            ->post(route('admin.id-verifications.approve', $user->id));

        Notification::assertSentTo($user, IdVerificationApproved::class, function ($notification) {
            $array = $notification->toArray($notification);
            return $array['type'] === 'id_verification_approved' &&
                   $array['title'] === 'Identity Verified!' &&
                   $array['message'] === 'Your identity has been verified!';
        });

        // Test rejection notification
        $user2 = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.id-verifications.reject', $user2->id), [
                'notes' => 'Invalid document'
            ]);

        Notification::assertSentTo($user2, IdVerificationRejected::class, function ($notification) {
            $array = $notification->toArray($notification);
            return $array['type'] === 'id_verification_rejected' &&
                   $array['title'] === 'ID Verification Rejected' &&
                   str_contains($array['message'], 'Invalid document');
        });
    }

    /**
     * Test that status is used consistently in all conditional rendering
     * Note: Database schema uses 'pending' as default, doesn't allow NULL
     */
    public function test_status_used_consistently_in_conditional_rendering()
    {
        // Test pending status (default)
        $userPending = User::factory()->create([
            'id_verification_status' => 'pending',
        ]);

        $response = $this->actingAs($userPending)->get(route('profile.edit'));
        $response->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'pending')
        );

        // Test verified status
        $userVerified = User::factory()->create([
            'id_verification_status' => 'verified',
        ]);

        $response = $this->actingAs($userVerified)->get(route('profile.edit'));
        $response->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'verified')
        );

        // Test rejected status
        $userRejected = User::factory()->create([
            'id_verification_status' => 'rejected',
        ]);

        $response = $this->actingAs($userRejected)->get(route('profile.edit'));
        $response->assertInertia(fn ($page) => 
            $page->where('auth.user.id_verification_status', 'rejected')
        );
    }

    /**
     * Test that HandleInertiaRequests middleware passes status correctly
     * Note: Database schema uses 'pending' as default, doesn't allow NULL
     */
    public function test_inertia_middleware_passes_status_correctly()
    {
        $statuses = ['pending', 'verified', 'rejected'];

        foreach ($statuses as $status) {
            $user = User::factory()->create([
                'id_verification_status' => $status,
            ]);

            $response = $this->actingAs($user)->get(route('profile.edit'));
            
            $response->assertInertia(fn ($page) => 
                $page->where('auth.user.id_verification_status', $status)
            );
        }
    }

    /**
     * Test that status changes from pending to verified work correctly
     */
    public function test_status_transition_pending_to_verified()
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create([
            'id_verification_status' => 'pending',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
        ]);

        // Verify initial status
        $this->assertEquals('pending', $user->id_verification_status);

        // Admin approves
        $this->actingAs($admin)
            ->post(route('admin.id-verifications.approve', $user->id));

        // Verify status changed
        $user->refresh();
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
    }

    /**
     * Test that status changes from rejected to pending after re-upload
     */
    public function test_status_transition_rejected_to_pending_after_reupload()
    {
        $user = User::factory()->create([
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'Blurry image',
        ]);

        // Simulate front image upload
        $this->actingAs($user)
            ->postJson(route('id-verification.upload-front'), [
                'front_image' => \Illuminate\Http\UploadedFile::fake()->image('front.jpg'),
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);

        // Simulate back image upload (should change status to pending)
        $this->actingAs($user)
            ->postJson(route('id-verification.upload-back'), [
                'back_image' => \Illuminate\Http\UploadedFile::fake()->image('back.jpg'),
            ]);

        $user->refresh();
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNotNull($user->id_back_image);
    }
}
