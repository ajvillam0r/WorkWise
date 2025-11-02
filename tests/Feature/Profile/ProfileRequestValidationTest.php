<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_is_lowercased_and_can_update_own_email(): void
    {
        $user = User::create([
            'first_name' => 'Alpha',
            'last_name' => 'User',
            'email' => 'alpha@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);

        $this->actingAs($user);

        $response = $this->patch('/profile', [
            'first_name' => 'Alpha',
            'last_name' => 'User',
            'email' => 'ALPHA@EXAMPLE.COM',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'alpha@example.com',
        ]);
    }

    public function test_email_must_be_unique_across_users(): void
    {
        $userA = User::create([
            'first_name' => 'User',
            'last_name' => 'A',
            'email' => 'a@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);
        $userB = User::create([
            'first_name' => 'User',
            'last_name' => 'B',
            'email' => 'b@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);

        $this->actingAs($userA);

        $response = $this->patch('/profile', [
            'first_name' => 'User',
            'last_name' => 'A',
            'email' => 'b@example.com',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    public function test_profile_picture_max_size_and_type_validation(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        $user = User::create([
            'first_name' => 'Media',
            'last_name' => 'User',
            'email' => 'media@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);

        $this->actingAs($user);

        $oversize = UploadedFile::fake()->image('big.jpg')->size(6000); // > 5120 KB
        $response = $this->patch('/profile', [
            'first_name' => 'Media',
            'last_name' => 'User',
            'email' => 'media@example.com',
            'profile_picture' => $oversize,
        ]);

        $response->assertSessionHasErrors(['profile_picture']);

        $ok = UploadedFile::fake()->image('ok.png')->size(2048);
        $response2 = $this->patch('/profile', [
            'first_name' => 'Media',
            'last_name' => 'User',
            'email' => 'media@example.com',
            'profile_picture' => $ok,
        ]);

        $response2->assertRedirect();
    }
}


