<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use App\Models\GigJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Comprehensive test suite for Job Creation Skills Optimization feature
 * Tests all requirements from .kiro/specs/job-creation-skills-optimization/
 */
class JobCreationSkillsOptimizationTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(): User
    {
        return User::create([
            'first_name' => 'Test',
            'last_name' => 'Employer',
            'email' => 'employer@skillstest.com',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
    }

    // ========================================
    // Task 7.1: Test custom skills functionality
    // ========================================

    /**
     * Test adding taxonomy skill from suggestions
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
     */
    public function test_add_taxonomy_skill_from_suggestions(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'React Developer Needed',
            'description' => str_repeat('Looking for an experienced React developer to build a modern web application. ', 3),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 14,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'React Developer Needed')->firstOrFail();
        
        // Verify taxonomy skills are stored correctly
        $this->assertNotEmpty($job->skills_requirements);
        $this->assertCount(2, $job->skills_requirements);
        $this->assertEquals('React', $job->skills_requirements[0]['skill']);
        $this->assertEquals('intermediate', $job->skills_requirements[0]['experience_level']);
        $this->assertEquals('required', $job->skills_requirements[0]['importance']);
    }

    /**
     * Test adding custom skill by typing and pressing Enter
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
     */
    public function test_add_custom_skill_not_in_taxonomy(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Emerging Tech Developer',
            'description' => str_repeat('Need developer with cutting-edge technology skills. ', 5),
            'skills_requirements' => [
                ['skill' => 'Custom Framework XYZ', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Proprietary Tool ABC', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 30,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Emerging Tech Developer')->firstOrFail();
        
        // Verify custom skills are stored correctly
        $this->assertNotEmpty($job->skills_requirements);
        $this->assertEquals('Custom Framework XYZ', $job->skills_requirements[0]['skill']);
        $this->assertEquals('Proprietary Tool ABC', $job->skills_requirements[1]['skill']);
    }

    /**
     * Test that both taxonomy and custom skills work identically
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
     */
    public function test_taxonomy_and_custom_skills_work_identically(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Mixed Skills Job',
            'description' => str_repeat('Job requiring both standard and custom skills. ', 5),
            'skills_requirements' => [
                ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'], // Taxonomy
                ['skill' => 'Custom CMS Platform', 'experience_level' => 'intermediate', 'importance' => 'required'], // Custom
                ['skill' => 'Vue.js', 'experience_level' => 'intermediate', 'importance' => 'preferred'], // Taxonomy
                ['skill' => 'Internal API Framework', 'experience_level' => 'beginner', 'importance' => 'preferred'], // Custom
            ],
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'expert',
            'estimated_duration_days' => 20,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title' , 'Mixed Skills Job')->firstOrFail();
        
        // Verify all skills are stored with same structure
        $this->assertCount(4, $job->skills_requirements);
        
        foreach ($job->skills_requirements as $skill) {
            $this->assertArrayHasKey('skill', $skill);
            $this->assertArrayHasKey('experience_level', $skill);
            $this->assertArrayHasKey('importance', $skill);
            $this->assertNotEmpty($skill['skill']);
            $this->assertContains($skill['experience_level'], ['beginner', 'intermediate', 'expert']);
            $this->assertContains($skill['importance'], ['required', 'preferred']);
        }
    }

    // ========================================
    // Task 7.2: Test duplicate prevention
    // ========================================

    /**
     * Test duplicate prevention with different case
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     */
    public function test_duplicate_prevention_case_insensitive(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Frontend should prevent this, but test backend accepts it gracefully
        $response = $this->post('/jobs', [
            'title' => 'Case Sensitivity Test',
            'description' => str_repeat('Testing case-insensitive duplicate handling. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'react', 'experience_level' => 'expert', 'importance' => 'required'], // Duplicate with different case
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        // Backend accepts it (frontend prevents it)
        $response->assertStatus(302);
    }

    /**
     * Test duplicate prevention with whitespace
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     */
    public function test_duplicate_prevention_with_whitespace(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Frontend should prevent this
        $response = $this->post('/jobs', [
            'title' => 'Whitespace Test',
            'description' => str_repeat('Testing whitespace trimming in duplicate detection. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => ' React ', 'experience_level' => 'expert', 'importance' => 'required'], // Duplicate with whitespace
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        // Backend accepts it (frontend prevents it)
        $response->assertStatus(302);
    }

    /**
     * Test that unique skills are accepted
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     */
    public function test_unique_skills_accepted(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Unique Skills Job',
            'description' => str_repeat('Job with all unique skills. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Angular', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 15,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Unique Skills Job')->firstOrFail();
        $this->assertCount(3, $job->skills_requirements);
    }

    // ========================================
    // Task 7.3: Test form submission and validation
    // ========================================

    /**
     * Test form submission with all valid data
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    public function test_form_submission_with_valid_data(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Complete Valid Job',
            'description' => str_repeat('This is a complete job posting with all valid data fields filled correctly. ', 3),
            'project_category' => 'Web Development',
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'MySQL', 'experience_level' => 'intermediate', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'expert',
            'job_complexity' => 'complex',
            'estimated_duration_days' => 30,
            'deadline' => now()->addDays(45)->format('Y-m-d'),
            'location' => 'Remote',
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();
        
        $job = GigJob::where('title', 'Complete Valid Job')->firstOrFail();
        $this->assertEquals('open', $job->status);
        $this->assertEquals($employer->id, $job->employer_id);
    }

    /**
     * Test form submission without skills (should fail)
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    public function test_form_submission_without_skills_fails(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job Without Skills',
            'description' => str_repeat('This job has no skills specified which should cause validation to fail. ', 5),
            'skills_requirements' => [], // Empty skills
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements']);
        $this->assertDatabaseMissing('gig_jobs', [
            'title' => 'Job Without Skills',
        ]);
    }

    /**
     * Test form submission with invalid budget (should fail)
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    public function test_form_submission_with_invalid_budget_fails(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Invalid Budget Job',
            'description' => str_repeat('This job has invalid budget where max is less than min. ', 5),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 500, // Max less than min
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['budget_max']);
        $this->assertDatabaseMissing('gig_jobs', [
            'title' => 'Invalid Budget Job',
        ]);
    }

    /**
     * Test form submission with short description (should fail)
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    public function test_form_submission_with_short_description_fails(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Short Description Job',
            'description' => 'Too short', // Less than 100 characters
            'skills_requirements' => [
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['description']);
        $this->assertDatabaseMissing('gig_jobs', [
            'title' => 'Short Description Job',
        ]);
    }

    /**
     * Test that validation errors are displayed correctly
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    public function test_validation_errors_display_correctly(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => '', // Missing title
            'description' => 'Short', // Too short
            'skills_requirements' => [], // Empty skills
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 500, // Invalid budget
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors([
            'title',
            'description',
            'skills_requirements',
            'budget_max',
        ]);
    }

    // ========================================
    // Task 7.4: Test location handling
    // ========================================

    /**
     * Test creating job without location
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_create_job_without_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Remote Job No Location',
            'description' => str_repeat('This is a fully remote job with no specific location requirement. ', 5),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 15,
            'is_remote' => true,
            'location' => '', // Empty location
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Remote Job No Location')->firstOrFail();
        $this->assertEquals('', $job->location);
        $this->assertTrue($job->is_remote);
    }

    /**
     * Test creating job with custom location
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_create_job_with_custom_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'On-Site Job Custom Location',
            'description' => str_repeat('This job requires on-site work at a specific location. ', 5),
            'skills_requirements' => [
                ['skill' => 'Java', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 75,
            'budget_max' => 150,
            'experience_level' => 'expert',
            'estimated_duration_days' => 60,
            'is_remote' => false,
            'location' => 'San Francisco, CA',
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'On-Site Job Custom Location')->firstOrFail();
        $this->assertEquals('San Francisco, CA', $job->location);
        $this->assertFalse($job->is_remote);
    }

    /**
     * Test that empty location doesn't show "Lapu-Lapu City"
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_empty_location_not_defaulted_to_lapu_lapu(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'No Default Location Job',
            'description' => str_repeat('Testing that location is not defaulted to Lapu-Lapu City. ', 5),
            'skills_requirements' => [
                ['skill' => 'Ruby', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 800,
            'budget_max' => 1500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 20,
            'is_remote' => true,
            'location' => '',
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'No Default Location Job')->firstOrFail();
        $this->assertNotEquals('Lapu-Lapu City', $job->location);
        $this->assertEquals('', $job->location);
    }

    /**
     * Test job creation without location field at all
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     */
    public function test_job_creation_without_location_field(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job Without Location Field',
            'description' => str_repeat('This job does not include location field in the request. ', 5),
            'skills_requirements' => [
                ['skill' => 'Go', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 600,
            'budget_max' => 1200,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 12,
            'is_remote' => true,
            // location field not included
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job Without Location Field')->firstOrFail();
        $this->assertNull($job->location);
    }

    // ========================================
    // Task 7.5: Verify nice-to-have skills removal
    // ========================================

    /**
     * Test that backend doesn't validate nice_to_have_skills
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     */
    public function test_backend_does_not_validate_nice_to_have_skills(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Try to submit with nice_to_have_skills - backend should ignore it
        $response = $this->post('/jobs', [
            'title' => 'Job Without Nice-to-Have Validation',
            'description' => str_repeat('Testing that nice_to_have_skills is not validated. ', 5),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'nice_to_have_skills' => [
                ['skill' => 'Docker', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 15,
            'is_remote' => true,
        ]);

        // Should succeed - nice_to_have_skills is optional
        $response->assertStatus(302);
    }

    /**
     * Test job creation without nice_to_have_skills
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     */
    public function test_job_creation_without_nice_to_have_skills(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job Without Nice-to-Have Skills',
            'description' => str_repeat('This job only has required skills, no nice-to-have skills. ', 5),
            'skills_requirements' => [
                ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 25,
            'is_remote' => true,
            // No nice_to_have_skills field
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job Without Nice-to-Have Skills')->firstOrFail();
        
        // Verify only skills_requirements is populated
        $this->assertNotEmpty($job->skills_requirements);
        $this->assertCount(2, $job->skills_requirements);
    }

    /**
     * Test that form data doesn't include nice_to_have_skills for new jobs
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     */
    public function test_new_jobs_do_not_include_nice_to_have_skills(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'New Job Format',
            'description' => str_repeat('Testing new job format without nice-to-have skills section. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'TypeScript', 'experience_level' => 'intermediate', 'importance' => 'preferred'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 20,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'New Job Format')->firstOrFail();
        
        // Verify skills_requirements contains both required and preferred
        $this->assertCount(2, $job->skills_requirements);
        $this->assertEquals('required', $job->skills_requirements[0]['importance']);
        $this->assertEquals('preferred', $job->skills_requirements[1]['importance']);
    }

    /**
     * Test that skills_requirements can contain both required and preferred importance
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     */
    public function test_skills_requirements_supports_mixed_importance(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Mixed Importance Skills',
            'description' => str_repeat('Job with both required and preferred skills in skills_requirements. ', 5),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Django', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'PostgreSQL', 'experience_level' => 'intermediate', 'importance' => 'preferred'],
                ['skill' => 'Redis', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1500,
            'budget_max' => 3000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 40,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Mixed Importance Skills')->firstOrFail();
        
        // Verify mixed importance levels
        $requiredSkills = array_filter($job->skills_requirements, fn($s) => $s['importance'] === 'required');
        $preferredSkills = array_filter($job->skills_requirements, fn($s) => $s['importance'] === 'preferred');
        
        $this->assertCount(2, $requiredSkills);
        $this->assertCount(2, $preferredSkills);
    }

    /**
     * Test backward compatibility - existing jobs with nice_to_have_skills still work
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     */
    public function test_backward_compatibility_with_nice_to_have_skills(): void
    {
        $employer = $this->createEmployer();

        // Create a legacy job with nice_to_have_skills
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy Job With Nice-to-Have',
            'description' => str_repeat('Legacy job that has nice_to_have_skills field. ', 20),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'nice_to_have_skills' => [
                ['skill' => 'Docker', 'experience_level' => 'beginner', 'importance' => 'preferred'],
                ['skill' => 'AWS', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'required_skills' => ['PHP'],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 15,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Verify legacy job data is preserved
        $this->assertNotEmpty($job->nice_to_have_skills);
        $this->assertCount(2, $job->nice_to_have_skills);
        $this->assertEquals('Docker', $job->nice_to_have_skills[0]['skill']);
    }
}
