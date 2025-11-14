<?php

namespace Tests\Feature\Jobs;

use App\Models\GigJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobBackwardCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(): User
    {
        return User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => 'employer@test.com',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
    }

    // Task 6.3: Test backward compatibility
    public function test_load_existing_job_with_only_required_skills_legacy(): void
    {
        $employer = $this->createEmployer();
        
        // Create a legacy job with only required_skills (no skills_requirements)
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy PHP Developer',
            'description' => str_repeat('Need a PHP developer for legacy system maintenance. ', 5),
            'required_skills' => ['PHP', 'MySQL', 'jQuery'],
            'skills_requirements' => null, // Legacy format
            'budget_type' => 'hourly',
            'budget_min' => 30,
            'budget_max' => 60,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 20,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $this->actingAs($employer);
        
        // Load the job
        $response = $this->get(route('jobs.show', $job));
        
        $response->assertStatus(200);
        
        // Verify the job displays correctly
        $response->assertSee('Legacy PHP Developer');
        $response->assertSee('PHP');
        $response->assertSee('MySQL');
        $response->assertSee('jQuery');
    }

    public function test_edit_and_save_legacy_job(): void
    {
        $employer = $this->createEmployer();
        
        // Create a legacy job
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy WordPress Site',
            'description' => str_repeat('Maintain WordPress site with custom plugins. ', 5),
            'required_skills' => ['WordPress', 'PHP', 'CSS'],
            'skills_requirements' => null,
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $this->actingAs($employer);
        
        // Edit the job with new structured skills
        $response = $this->patch(route('jobs.update', $job), [
            'title' => 'Updated WordPress Site',
            'description' => str_repeat('Maintain and update WordPress site with custom plugins. ', 5),
            'skills_requirements' => [
                ['skill' => 'WordPress', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'CSS', 'experience_level' => 'beginner', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        // Verify the job was updated
        $job->refresh();
        $this->assertEquals('Updated WordPress Site', $job->title);
        $this->assertNotEmpty($job->skills_requirements);
        $this->assertCount(3, $job->skills_requirements);
        
        // Verify required_skills was auto-populated
        $this->assertContains('WordPress', $job->required_skills);
        $this->assertContains('PHP', $job->required_skills);
        $this->assertContains('CSS', $job->required_skills);
    }

    public function test_skill_names_accessor_with_legacy_data(): void
    {
        $employer = $this->createEmployer();
        
        // Create a legacy job
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy Job',
            'description' => str_repeat('Test legacy accessor. ', 10),
            'required_skills' => ['Skill1', 'Skill2', 'Skill3'],
            'skills_requirements' => null,
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 5,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Test the skill_names accessor falls back to required_skills
        $skillNames = $job->skill_names;
        
        $this->assertIsArray($skillNames);
        $this->assertCount(3, $skillNames);
        $this->assertContains('Skill1', $skillNames);
        $this->assertContains('Skill2', $skillNames);
        $this->assertContains('Skill3', $skillNames);
    }

    public function test_skill_names_accessor_with_structured_data(): void
    {
        $employer = $this->createEmployer();
        
        // Create a job with structured skills
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Modern Job',
            'description' => str_repeat('Test structured accessor. ', 10),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Node.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'required_skills' => ['React', 'Node.js'], // Auto-populated
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'expert',
            'estimated_duration_days' => 30,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Test the skill_names accessor uses skills_requirements
        $skillNames = $job->skill_names;
        
        $this->assertIsArray($skillNames);
        $this->assertCount(2, $skillNames);
        $this->assertContains('React', $skillNames);
        $this->assertContains('Node.js', $skillNames);
    }

    public function test_required_skills_with_levels_accessor(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Mixed Importance Job',
            'description' => str_repeat('Test required vs preferred skills. ', 10),
            'skills_requirements' => [
                ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Docker', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 45,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $requiredSkills = $job->required_skills_with_levels;
        
        $this->assertIsArray($requiredSkills);
        $this->assertCount(2, $requiredSkills);
        
        // Verify only required skills are returned
        $skillNames = array_column($requiredSkills, 'skill');
        $this->assertContains('Laravel', $skillNames);
        $this->assertContains('Vue.js', $skillNames);
        $this->assertNotContains('Docker', $skillNames);
    }

    public function test_preferred_skills_with_levels_accessor(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Preferred Skills Job',
            'description' => str_repeat('Test preferred skills accessor. ', 10),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'TensorFlow', 'experience_level' => 'intermediate', 'importance' => 'preferred'],
                ['skill' => 'PyTorch', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 60,
            'budget_max' => 120,
            'experience_level' => 'expert',
            'estimated_duration_days' => 60,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $preferredSkills = $job->preferred_skills_with_levels;
        
        $this->assertIsArray($preferredSkills);
        $this->assertCount(2, $preferredSkills);
        
        // Verify only preferred skills are returned
        $skillNames = array_column($preferredSkills, 'skill');
        $this->assertContains('TensorFlow', $skillNames);
        $this->assertContains('PyTorch', $skillNames);
        $this->assertNotContains('Python', $skillNames);
    }
}
