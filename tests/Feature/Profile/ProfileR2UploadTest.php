<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileR2UploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_picture_uploads_to_r2_and_replaces_old(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        Storage::fake('r2');

        $user = User::create([
            'first_name' => 'R2',
            'last_name' => 'User',
            'email' => 'r2@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
            'profile_picture' => 'profiles/1/old.jpg',
        ]);

        // Seed an old file
        Storage::disk('r2')->put('profiles/'.$user->id.'/old.jpg', 'old');

        $this->actingAs($user);

        $newImage = UploadedFile::fake()->image('new.png', 200, 200);
        $response = $this->patch('/profile', [
            'first_name' => 'R2',
            'last_name' => 'User',
            'email' => 'r2@example.com',
            'profile_picture' => $newImage,
        ]);

        $response->assertRedirect();

        // Assert new file stored
        Storage::disk('r2')->assertExists('profiles/'.$user->id);

        // Old file should be deleted
        $this->assertFalse(Storage::disk('r2')->exists('profiles/'.$user->id.'/old.jpg'));
    }
}


