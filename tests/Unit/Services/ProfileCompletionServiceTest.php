<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\ProfileCompletionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileCompletionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_gig_worker_is_always_complete(): void
    {
        $user = User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => 'emp@pcs.test',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);

        $svc = new ProfileCompletionService();
        $data = $svc->calculateCompletion($user);

        $this->assertTrue($data['is_complete']);
        $this->assertSame(100, $data['percentage']);
    }

    public function test_gig_worker_percentage_and_missing_fields_change_with_inputs(): void
    {
        $user = User::create([
            'first_name' => 'Gig',
            'last_name' => 'Worker',
            'email' => 'gw@pcs.test',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);

        $svc = new ProfileCompletionService();

        $initial = $svc->calculateCompletion($user);
        $this->assertFalse($initial['is_complete']);
        $this->assertGreaterThan(0, $initial['missing_fields'] ? count($initial['missing_fields']) : 0);

        // Fill several required fields
        $user->update([
            'professional_title' => 'Backend Developer',
            'hourly_rate' => 25,
            'bio' => str_repeat('b', 60),
            'broad_category' => 'Software Development',
            'specific_services' => ['API Development', 'Testing'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'intermediate'],
                ['skill' => 'Laravel', 'experience_level' => 'intermediate'],
                ['skill' => 'MySQL', 'experience_level' => 'beginner'],
            ],
            'street_address' => '123 Main St',
            'city' => 'Manila',
            'country' => 'PH',
            'working_hours' => ['Mon-Fri 9-5'],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['Email'],
            'id_verification_status' => 'verified',
            'email_verified_at' => now(),
        ]);

        $after = $svc->calculateCompletion($user->fresh());
        $this->assertTrue($after['percentage'] >= 75);
        $this->assertTrue(count($after['missing_fields']) < count($initial['missing_fields']));
    }
}


