<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobValidationTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(): User
    {
        return User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => 'employer@jobs.test',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
    }

    public function test_description_minimum_boundary_valid_when_skills_requirements_provided(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $desc = str_repeat('a', 100); // min:100

        $response = $this->post('/jobs', [
            'title' => 'Boundary Test Job',
            'description' => $desc,
            'required_skills' => ['PHP'],
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'beginner', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 5,
            'budget_max' => 10,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 1,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'Boundary Test Job',
            'employer_id' => $employer->id,
        ]);
    }

    public function test_budget_minimum_boundary_fails_below_five(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $desc = str_repeat('a', 120);

        $response = $this->post('/jobs', [
            'title' => 'Budget Fail',
            'description' => $desc,
            'required_skills' => ['PHP'],
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'beginner', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 4,
            'budget_max' => 10,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 1,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['budget_min']);
    }

    public function test_skills_requirements_is_auto_generated_from_required_skills_when_missing(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $desc = str_repeat('a', 120);

        $response = $this->post('/jobs', [
            'title' => 'Auto Map',
            'description' => $desc,
            'required_skills' => ['PHP', 'Laravel'],
            // intentionally omit skills_requirements
            'budget_type' => 'fixed',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 7,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);

        $job = \App\Models\GigJob::where('title', 'Auto Map')->firstOrFail();
        $this->assertNotEmpty($job->skills_requirements);
        $this->assertEquals('PHP', $job->skills_requirements[0]['skill']);
        $this->assertEquals('intermediate', $job->skills_requirements[0]['experience_level']);
        $this->assertEquals('required', $job->skills_requirements[0]['importance']);
    }
}


