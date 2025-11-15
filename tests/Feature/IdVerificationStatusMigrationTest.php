<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Test migration: 2025_11_15_000000_fix_id_verification_status_default
 * Tests Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
class IdVerificationStatusMigrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that users with 'pending' status but no images are corrected to null
     * Requirements: 2.1, 2.2
     */
    public function test_migration_corrects_pending_status_with_no_images()
    {
        // Create test user with pending status but no images (the bug scenario)
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $userId = $user->id;

        // Rollback the migration first to test it fresh
        Artisan::call('migrate:rollback', ['--step' => 1]);
        
        // Run the migration
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status was corrected to null
        $this->assertNull($user->id_verification_status);
        $this->assertNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
    }

    /**
     * Test that users with 'pending' status and both images remain unchanged
     * Requirements: 2.3
     */
    public function test_migration_preserves_pending_status_with_images()
    {
        // Create test user with pending status and both images (legitimate pending)
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        $userId = $user->id;

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status remains pending
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
    }

    /**
     * Test that verified users remain unchanged
     * Requirements: 2.4
     */
    public function test_migration_preserves_verified_status()
    {
        // Create test user with verified status
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'verified',
            'id_verified_at' => now(),
        ]);

        $userId = $user->id;

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status remains verified
        $this->assertEquals('verified', $user->id_verification_status);
        $this->assertNotNull($user->id_verified_at);
    }

    /**
     * Test that rejected users remain unchanged
     * Requirements: 2.4
     */
    public function test_migration_preserves_rejected_status()
    {
        // Create test user with rejected status
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'Document not clear',
        ]);

        $userId = $user->id;

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status remains rejected
        $this->assertEquals('rejected', $user->id_verification_status);
        $this->assertNotNull($user->id_verification_notes);
    }

    /**
     * Test that new users created after migration have null status by default
     * Requirements: 6.1
     */
    public function test_new_users_have_null_status_after_migration()
    {
        // Ensure migration is run
        Artisan::call('migrate');

        // Create new user after migration
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);

        // Verify status is null by default
        $this->assertNull($user->id_verification_status);
        $this->assertNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
    }

    /**
     * Test migration with user having only front image
     * Requirements: 6.2
     */
    public function test_migration_handles_user_with_only_front_image()
    {
        // Create user with pending status and only front image
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $userId = $user->id;

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status was corrected to null (missing back image)
        $this->assertNull($user->id_verification_status);
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
    }

    /**
     * Test migration with user having only back image
     * Requirements: 6.3
     */
    public function test_migration_handles_user_with_only_back_image()
    {
        // Create user with pending status and only back image
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => 'https://example.com/back.jpg',
            'id_verification_status' => 'pending',
        ]);

        $userId = $user->id;

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Refresh user from database
        $user = User::find($userId);

        // Verify status was corrected to null (missing front image)
        $this->assertNull($user->id_verification_status);
        $this->assertNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
    }

    /**
     * Test rollback functionality
     * Requirements: 6.4, 6.5, 6.6
     */
    public function test_migration_rollback_restores_default()
    {
        // Ensure migration is run first
        Artisan::call('migrate');

        // Create a user after migration (should have null status)
        $user1 = User::factory()->create([
            'user_type' => 'gig_worker',
        ]);
        $this->assertNull($user1->id_verification_status);

        // Rollback the migration
        Artisan::call('migrate:rollback', ['--step' => 1]);

        // Insert a user directly via DB to test the database default
        $userId = DB::table('users')->insertGetId([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'rollback-test@example.com',
            'password' => bcrypt('password'),
            'user_type' => 'gig_worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Fetch the user and verify the default was applied
        $user2 = User::find($userId);
        $this->assertEquals('pending', $user2->id_verification_status);
    }

    /**
     * Test migration with multiple users in various states
     * Requirements: 2.1, 2.2, 2.3, 2.4
     */
    public function test_migration_handles_multiple_users_correctly()
    {
        // Create multiple test users with different scenarios
        $userPendingNoImages = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $userPendingWithImages = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front1.jpg',
            'id_back_image' => 'https://example.com/back1.jpg',
            'id_verification_status' => 'pending',
        ]);

        $userVerified = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front2.jpg',
            'id_back_image' => 'https://example.com/back2.jpg',
            'id_verification_status' => 'verified',
        ]);

        $userRejected = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front3.jpg',
            'id_back_image' => 'https://example.com/back3.jpg',
            'id_verification_status' => 'rejected',
        ]);

        // Store IDs
        $ids = [
            'pendingNoImages' => $userPendingNoImages->id,
            'pendingWithImages' => $userPendingWithImages->id,
            'verified' => $userVerified->id,
            'rejected' => $userRejected->id,
        ];

        // Rollback and re-run migration
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        // Verify each user's status
        $userPendingNoImages = User::find($ids['pendingNoImages']);
        $this->assertNull($userPendingNoImages->id_verification_status);

        $userPendingWithImages = User::find($ids['pendingWithImages']);
        $this->assertEquals('pending', $userPendingWithImages->id_verification_status);

        $userVerified = User::find($ids['verified']);
        $this->assertEquals('verified', $userVerified->id_verification_status);

        $userRejected = User::find($ids['rejected']);
        $this->assertEquals('rejected', $userRejected->id_verification_status);
    }

    /**
     * Test that column allows all expected values after migration
     * Requirements: 6.5
     */
    public function test_column_accepts_all_valid_values_after_migration()
    {
        // Ensure migration is run
        Artisan::call('migrate');

        // Test null value
        $user1 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => null,
        ]);
        $this->assertNull($user1->id_verification_status);

        // Test 'pending' value
        $user2 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'pending',
        ]);
        $this->assertEquals('pending', $user2->id_verification_status);

        // Test 'verified' value
        $user3 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'verified',
        ]);
        $this->assertEquals('verified', $user3->id_verification_status);

        // Test 'rejected' value
        $user4 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected',
        ]);
        $this->assertEquals('rejected', $user4->id_verification_status);
    }
}
