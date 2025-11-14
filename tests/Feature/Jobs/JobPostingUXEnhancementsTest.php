<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test suite for Job Posting UX Enhancements
 * Tests requirements from .kiro/specs/job-posting-ux-enhancements/
 * 
 * Note: Category detection and location field visibility are client-side features.
 * These tests verify the backend properly handles the data submitted by the enhanced UI.
 */
class JobPostingUXEnhancementsTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(): User
    {
        return User::factory()->create([
            'user_type' => 'employer',
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Test: Remote job submission with empty location
     * Requirements: 2.3, 2.4, 2.5
     * 
     * When remote work is checked, location should be cleared/empty
     */
    public function test_remote_job_accepts_empty_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Remote React Developer',
            'description' => str_repeat('Looking for a remote React developer to build modern web applications. ', 3),
            'project_category' => 'Web Development',
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 5000,
            'budget_max' => 10000,
            'experience_level' => 'intermediate',
            'job_complexity' => 'moderate',
            'estimated_duration_days' => 30,
            'is_remote' => true,
            'location' => '', // Empty location for remote job
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'Remote React Developer',
            'is_remote' => true,
        ]);
        
        // Verify location is null or empty for remote jobs
        $job = \App\Models\GigJob::where('title', 'Remote React Developer')->first();
        $this->assertTrue($job->location === null || $job->location === '');
    }

    /**
     * Test: On-site job with location specified
     * Requirements: 2.1, 2.2, 2.4, 2.5
     * 
     * When remote work is unchecked, location should be saved
     */
    public function test_onsite_job_saves_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'On-Site Logo Designer',
            'description' => str_repeat('Need a logo designer to work on-site at our office in Cebu. ', 3),
            'project_category' => 'Logo Design & Branding',
            'skills_requirements' => [
                ['skill' => 'Adobe Illustrator', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 3000,
            'budget_max' => 8000,
            'experience_level' => 'expert',
            'job_complexity' => 'simple',
            'estimated_duration_days' => 14,
            'is_remote' => false,
            'location' => 'Lapu-Lapu City, Cebu',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'On-Site Logo Designer',
            'is_remote' => false,
            'location' => 'Lapu-Lapu City, Cebu',
        ]);
    }

    /**
     * Test: Category auto-detection result is properly saved
     * Requirements: 1.1, 1.2, 1.4
     * 
     * When category is auto-detected and selected, it should be saved correctly
     */
    public function test_auto_detected_category_is_saved(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Simulate user accepting auto-detected category "SEO"
        $response = $this->post('/jobs', [
            'title' => 'SEO Expert Needed',
            'description' => str_repeat('Looking for an SEO expert to optimize our website for search engines. ', 3),
            'project_category' => 'SEO', // Auto-detected and accepted by user
            'skills_requirements' => [
                ['skill' => 'SEO', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 500,
            'budget_max' => 1500,
            'experience_level' => 'expert',
            'job_complexity' => 'moderate',
            'estimated_duration_days' => 60,
            'is_remote' => true,
            'location' => '',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'SEO Expert Needed',
            'project_category' => 'SEO',
        ]);
    }

    /**
     * Test: Manual category override is respected
     * Requirements: 1.4
     * 
     * User should be able to override auto-detected category
     */
    public function test_manual_category_override_is_saved(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Title suggests "Web Development" but user manually selects "Mobile App Development"
        $response = $this->post('/jobs', [
            'title' => 'React Developer', // Would auto-detect as "Web Development"
            'description' => str_repeat('Need a React Native developer for mobile app development. ', 3),
            'project_category' => 'Mobile App Development', // Manual override
            'skills_requirements' => [
                ['skill' => 'React Native', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 8000,
            'budget_max' => 15000,
            'experience_level' => 'intermediate',
            'job_complexity' => 'complex',
            'estimated_duration_days' => 45,
            'is_remote' => true,
            'location' => '',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'React Developer',
            'project_category' => 'Mobile App Development', // User's manual selection
        ]);
    }

    /**
     * Test: Complete workflow with both features
     * Requirements: All
     * 
     * Test a complete job posting with category detection and remote work
     */
    public function test_complete_job_posting_workflow(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Mobile App Developer',
            'description' => str_repeat('Need a Flutter expert for iOS and Android app development with modern UI/UX. ', 3),
            'project_category' => 'Mobile App Development', // Auto-detected from title
            'skills_requirements' => [
                ['skill' => 'Flutter', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Dart', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'UI/UX', 'experience_level' => 'intermediate', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 10000,
            'budget_max' => 20000,
            'experience_level' => 'expert',
            'job_complexity' => 'complex',
            'estimated_duration_days' => 60,
            'deadline' => now()->addDays(90)->format('Y-m-d'),
            'is_remote' => true, // Remote work checked
            'location' => '', // Location cleared when remote
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'Mobile App Developer',
            'project_category' => 'Mobile App Development',
            'is_remote' => true,
            'employer_id' => $employer->id,
        ]);

        // Verify skills were saved correctly
        $job = \App\Models\GigJob::where('title', 'Mobile App Developer')->first();
        $this->assertNotNull($job);
        $this->assertCount(3, $job->skills_requirements);
    }

    /**
     * Test: Location field is optional when remote is true
     * Requirements: 2.3, 2.5
     */
    public function test_location_not_required_for_remote_jobs(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Submit without location field at all
        $response = $this->post('/jobs', [
            'title' => 'Remote Graphic Designer',
            'description' => str_repeat('Looking for a talented graphic designer to work remotely on various projects. ', 3),
            'project_category' => 'Graphic Design',
            'skills_requirements' => [
                ['skill' => 'Adobe Photoshop', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 300,
            'budget_max' => 800,
            'experience_level' => 'intermediate',
            'job_complexity' => 'simple',
            'estimated_duration_days' => 20,
            'is_remote' => true,
            // location field not included
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'Remote Graphic Designer',
            'is_remote' => true,
        ]);
    }
}
