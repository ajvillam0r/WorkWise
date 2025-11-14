<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use App\Models\GigJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(): User
    {
        return User::create([
            'first_name' => 'Edge',
            'last_name' => 'Case',
            'email' => 'edgecase@test.com',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
    }

    // Task 6.5: Test with empty skills_requirements (should show validation error)
    public function test_empty_skills_requirements_shows_validation_error(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job Without Skills',
            'description' => str_repeat('This is a job description without any skills specified. ', 5),
            'skills_requirements' => [], // Empty array
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements']);
        $this->assertDatabaseMissing('gig_jobs', [
            'title' => 'Job Without Skills',
        ]);
    }

    public function test_null_skills_requirements_shows_validation_error(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Null Skills',
            'description' => str_repeat('This job has null skills. ', 5),
            // skills_requirements not provided at all
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors();
    }

    // Task 6.5: Test with maximum skills (10 required, 5 nice-to-have)
    public function test_maximum_required_skills_accepted(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $maxSkills = [];
        for ($i = 1; $i <= 10; $i++) {
            $maxSkills[] = [
                'skill' => "Skill{$i}",
                'experience_level' => 'intermediate',
                'importance' => 'required',
            ];
        }

        $response = $this->post('/jobs', [
            'title' => 'Job With Maximum Skills',
            'description' => str_repeat('This job requires many different skills to complete successfully. ', 5),
            'skills_requirements' => $maxSkills,
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 5000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 30,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Maximum Skills')->first();
        $this->assertNotNull($job);
        $this->assertCount(10, $job->skills_requirements);
    }

    public function test_maximum_nice_to_have_skills_accepted(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $requiredSkills = [
            ['skill' => 'PHP', 'experience_level' => 'expert', 'importance' => 'required'],
            ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'],
        ];

        $niceToHaveSkills = [];
        for ($i = 1; $i <= 5; $i++) {
            $niceToHaveSkills[] = [
                'skill' => "BonusSkill{$i}",
                'experience_level' => 'beginner',
                'importance' => 'preferred',
            ];
        }

        $response = $this->post('/jobs', [
            'title' => 'Job With Maximum Nice-to-Have Skills',
            'description' => str_repeat('This job has many bonus skills that would be nice to have. ', 5),
            'skills_requirements' => $requiredSkills,
            'nice_to_have_skills' => $niceToHaveSkills,
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'expert',
            'estimated_duration_days' => 20,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Maximum Nice-to-Have Skills')->first();
        $this->assertNotNull($job);
        $this->assertCount(5, $job->nice_to_have_skills);
    }

    public function test_combined_maximum_skills(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $requiredSkills = [];
        for ($i = 1; $i <= 10; $i++) {
            $requiredSkills[] = [
                'skill' => "RequiredSkill{$i}",
                'experience_level' => 'intermediate',
                'importance' => 'required',
            ];
        }

        $niceToHaveSkills = [];
        for ($i = 1; $i <= 5; $i++) {
            $niceToHaveSkills[] = [
                'skill' => "NiceSkill{$i}",
                'experience_level' => 'beginner',
                'importance' => 'preferred',
            ];
        }

        $response = $this->post('/jobs', [
            'title' => 'Job With All Maximum Skills',
            'description' => str_repeat('This comprehensive job requires maximum skills in all categories. ', 5),
            'skills_requirements' => $requiredSkills,
            'nice_to_have_skills' => $niceToHaveSkills,
            'budget_type' => 'fixed',
            'budget_min' => 5000,
            'budget_max' => 10000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 60,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With All Maximum Skills')->first();
        $this->assertNotNull($job);
        $this->assertCount(10, $job->skills_requirements);
        $this->assertCount(5, $job->nice_to_have_skills);
    }

    // Task 6.5: Test with invalid experience levels
    public function test_invalid_experience_level_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Invalid Experience',
            'description' => str_repeat('Testing invalid experience level validation. ', 5),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'master', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements.0.experience_level']);
    }

    public function test_empty_experience_level_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Empty Experience',
            'description' => str_repeat('Testing empty experience level validation. ', 5),
            'skills_requirements' => [
                ['skill' => 'JavaScript', 'experience_level' => '', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements.0.experience_level']);
    }

    public function test_missing_experience_level_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Missing Experience',
            'description' => str_repeat('Testing missing experience level validation. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'importance' => 'required'], // Missing experience_level
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors();
    }

    public function test_all_valid_experience_levels_accepted(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With All Experience Levels',
            'description' => str_repeat('Testing all valid experience levels. ', 5),
            'skills_requirements' => [
                ['skill' => 'HTML', 'experience_level' => 'beginner', 'importance' => 'required'],
                ['skill' => 'CSS', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 15,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With All Experience Levels')->first();
        $this->assertNotNull($job);
        $this->assertEquals('beginner', $job->skills_requirements[0]['experience_level']);
        $this->assertEquals('intermediate', $job->skills_requirements[1]['experience_level']);
        $this->assertEquals('expert', $job->skills_requirements[2]['experience_level']);
    }

    // Task 6.5: Test with invalid importance levels
    public function test_invalid_importance_level_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Invalid Importance',
            'description' => str_repeat('Testing invalid importance level validation. ', 5),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'intermediate', 'importance' => 'critical'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements.0.importance']);
    }

    public function test_missing_importance_level_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Missing Importance',
            'description' => str_repeat('Testing missing importance level validation. ', 5),
            'skills_requirements' => [
                ['skill' => 'Java', 'experience_level' => 'expert'], // Missing importance
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors();
    }

    // Task 6.5: Test with missing skill name
    public function test_missing_skill_name_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Missing Skill Name',
            'description' => str_repeat('Testing missing skill name validation. ', 5),
            'skills_requirements' => [
                ['experience_level' => 'intermediate', 'importance' => 'required'], // Missing skill
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors();
    }

    public function test_empty_skill_name_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Empty Skill Name',
            'description' => str_repeat('Testing empty skill name validation. ', 5),
            'skills_requirements' => [
                ['skill' => '', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements.0.skill']);
    }

    // Task 6.5: Test with special characters in skill names
    public function test_skill_names_with_special_characters(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Special Character Skills',
            'description' => str_repeat('Testing skill names with special characters. ', 5),
            'skills_requirements' => [
                ['skill' => 'C++', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'C#', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Node.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1500,
            'experience_level' => 'expert',
            'estimated_duration_days' => 20,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Special Character Skills')->first();
        $this->assertNotNull($job);
        $this->assertEquals('C++', $job->skills_requirements[0]['skill']);
        $this->assertEquals('C#', $job->skills_requirements[1]['skill']);
    }

    // Task 6.5: Test with very long skill names
    public function test_very_long_skill_name_within_limit(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $longSkillName = str_repeat('A', 100); // Exactly at max length

        $response = $this->post('/jobs', [
            'title' => 'Job With Long Skill Name',
            'description' => str_repeat('Testing maximum skill name length. ', 5),
            'skills_requirements' => [
                ['skill' => $longSkillName, 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Long Skill Name')->first();
        $this->assertNotNull($job);
        $this->assertEquals($longSkillName, $job->skills_requirements[0]['skill']);
    }

    public function test_skill_name_exceeding_max_length_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $tooLongSkillName = str_repeat('A', 101); // Over max length

        $response = $this->post('/jobs', [
            'title' => 'Job With Too Long Skill Name',
            'description' => str_repeat('Testing skill name exceeding maximum length. ', 5),
            'skills_requirements' => [
                ['skill' => $tooLongSkillName, 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements.0.skill']);
    }

    // Task 6.5: Test with malformed skills_requirements structure
    public function test_malformed_skills_requirements_rejected(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Malformed Skills',
            'description' => str_repeat('Testing malformed skills structure. ', 5),
            'skills_requirements' => 'not an array', // Wrong type
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertSessionHasErrors(['skills_requirements']);
    }

    // Task 6.5: Test with duplicate skills in requirements
    public function test_duplicate_skills_in_requirements_accepted(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Frontend should prevent this, but backend should handle it gracefully
        $response = $this->post('/jobs', [
            'title' => 'Job With Duplicate Skills',
            'description' => str_repeat('Testing duplicate skills handling. ', 5),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'React', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        // Backend accepts duplicates (frontend prevents them)
        $response->assertStatus(302);
    }

    // Task 6.5: Test with mixed importance levels
    public function test_mixed_importance_levels_in_skills_requirements(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Mixed Importance',
            'description' => str_repeat('Testing mixed importance levels in skills_requirements. ', 5),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Laravel', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'beginner', 'importance' => 'preferred'],
                ['skill' => 'Docker', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 20,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Mixed Importance')->first();
        $this->assertNotNull($job);
        
        // Verify required skills
        $requiredSkills = array_filter($job->skills_requirements, fn($s) => $s['importance'] === 'required');
        $this->assertCount(2, $requiredSkills);
        
        // Verify preferred skills
        $preferredSkills = array_filter($job->skills_requirements, fn($s) => $s['importance'] === 'preferred');
        $this->assertCount(2, $preferredSkills);
    }

    // Task 6.5: Test case sensitivity in skill names
    public function test_skill_names_preserve_case(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Case Sensitive Skills',
            'description' => str_repeat('Testing case preservation in skill names. ', 5),
            'skills_requirements' => [
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'TypeScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'PostgreSQL', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 300,
            'budget_max' => 800,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 15,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Case Sensitive Skills')->first();
        $this->assertNotNull($job);
        $this->assertEquals('JavaScript', $job->skills_requirements[0]['skill']);
        $this->assertEquals('TypeScript', $job->skills_requirements[1]['skill']);
        $this->assertEquals('PostgreSQL', $job->skills_requirements[2]['skill']);
    }

    // Task 6.5: Test with unicode characters in skill names
    public function test_skill_names_with_unicode_characters(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Unicode Skills',
            'description' => str_repeat('Testing unicode characters in skill names. ', 5),
            'skills_requirements' => [
                ['skill' => 'Español', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => '日本語', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 200,
            'budget_max' => 600,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Unicode Skills')->first();
        $this->assertNotNull($job);
        $this->assertEquals('Español', $job->skills_requirements[0]['skill']);
        $this->assertEquals('日本語', $job->skills_requirements[1]['skill']);
    }

    // Task 6.5: Test backward compatibility with edge cases
    public function test_legacy_job_with_empty_required_skills(): void
    {
        $employer = $this->createEmployer();

        // Create a legacy job with empty required_skills
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy Job Empty Skills',
            'description' => str_repeat('Legacy job with empty skills. ', 20),
            'required_skills' => [],
            'skills_requirements' => null,
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Test accessor methods handle empty data gracefully
        $this->assertIsArray($job->skill_names);
        $this->assertEmpty($job->skill_names);
        $this->assertIsArray($job->required_skills_with_levels);
        $this->assertEmpty($job->required_skills_with_levels);
    }

    public function test_job_with_null_skills_fields(): void
    {
        $employer = $this->createEmployer();

        // Create a job with null skill fields
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Job With Null Skills',
            'description' => str_repeat('Job with null skill fields. ', 20),
            'required_skills' => null,
            'skills_requirements' => null,
            'nice_to_have_skills' => null,
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Test accessor methods handle null gracefully
        $this->assertIsArray($job->skill_names);
        $this->assertEmpty($job->skill_names);
        $this->assertIsArray($job->required_skills_with_levels);
        $this->assertEmpty($job->required_skills_with_levels);
        $this->assertIsArray($job->preferred_skills_with_levels);
        $this->assertEmpty($job->preferred_skills_with_levels);
    }

    // Task 7.4: Test location handling
    public function test_create_job_without_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Remote Job Without Location',
            'description' => str_repeat('This is a remote job that does not require a specific location. ', 5),
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Laravel', 'experience_level' => 'intermediate', 'importance' => 'required'],
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
        
        $job = GigJob::where('title', 'Remote Job Without Location')->first();
        $this->assertNotNull($job);
        $this->assertEmpty($job->location);
        $this->assertTrue($job->is_remote);
    }

    public function test_create_job_with_null_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Null Location',
            'description' => str_repeat('This job has a null location field. ', 5),
            'skills_requirements' => [
                ['skill' => 'JavaScript', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'expert',
            'estimated_duration_days' => 10,
            'is_remote' => true,
            // location not provided at all
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Null Location')->first();
        $this->assertNotNull($job);
        $this->assertNull($job->location);
    }

    public function test_create_job_with_custom_location(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        $response = $this->post('/jobs', [
            'title' => 'Job With Custom Location',
            'description' => str_repeat('This job requires work at a specific custom location. ', 5),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Django', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 800,
            'budget_max' => 1500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 20,
            'is_remote' => false,
            'location' => 'Cebu City, Philippines',
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job With Custom Location')->first();
        $this->assertNotNull($job);
        $this->assertEquals('Cebu City, Philippines', $job->location);
        $this->assertFalse($job->is_remote);
    }

    public function test_job_show_page_displays_empty_location_correctly(): void
    {
        $employer = $this->createEmployer();
        
        // Create a job without location
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Job Without Location Display Test',
            'description' => str_repeat('Testing location display on show page. ', 20),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 300,
            'budget_max' => 600,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
            'location' => '', // Empty location
        ]);

        $this->actingAs($employer);
        $response = $this->get("/jobs/{$job->id}");

        $response->assertStatus(200);
        // Verify the page loads successfully
        $response->assertSee($job->title);
        // Verify empty location doesn't show "Lapu-Lapu City"
        $response->assertDontSee('Lapu-Lapu City');
    }

    public function test_job_show_page_displays_custom_location_correctly(): void
    {
        $employer = $this->createEmployer();
        
        // Create a job with custom location
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Job With Custom Location Display Test',
            'description' => str_repeat('Testing custom location display on show page. ', 20),
            'skills_requirements' => [
                ['skill' => 'Vue.js', 'experience_level' => 'expert', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 60,
            'budget_max' => 120,
            'experience_level' => 'expert',
            'estimated_duration_days' => 15,
            'status' => 'open',
            'is_remote' => false,
            'location' => 'Manila, Philippines',
        ]);

        $this->actingAs($employer);
        $response = $this->get("/jobs/{$job->id}");

        $response->assertStatus(200);
        // Verify the page loads successfully
        $response->assertSee($job->title);
        // Verify custom location is displayed
        $response->assertSee('Manila, Philippines');
    }

    public function test_job_show_page_displays_remote_badge_correctly(): void
    {
        $employer = $this->createEmployer();
        
        // Create a remote job
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Remote Job Display Test',
            'description' => str_repeat('Testing remote badge display on show page. ', 20),
            'skills_requirements' => [
                ['skill' => 'Node.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 400,
            'budget_max' => 800,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 12,
            'status' => 'open',
            'is_remote' => true,
            'location' => null,
        ]);

        $this->actingAs($employer);
        $response = $this->get("/jobs/{$job->id}");

        $response->assertStatus(200);
        // Verify the page loads successfully with correct data
        $response->assertInertia(fn ($page) => $page
            ->component('Jobs/Show')
            ->where('job.id', $job->id)
            ->where('job.is_remote', true)
            ->where('job.location', null)
        );
    }

    public function test_location_field_does_not_default_to_lapu_lapu_city(): void
    {
        $employer = $this->createEmployer();
        $this->actingAs($employer);

        // Create job without specifying location
        $response = $this->post('/jobs', [
            'title' => 'Job Testing Default Location',
            'description' => str_repeat('Testing that location does not default to Lapu-Lapu City. ', 5),
            'skills_requirements' => [
                ['skill' => 'Ruby', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 250,
            'budget_max' => 500,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 8,
            'is_remote' => true,
        ]);

        $response->assertStatus(302);
        
        $job = GigJob::where('title', 'Job Testing Default Location')->first();
        $this->assertNotNull($job);
        // Verify location is NOT "Lapu-Lapu City"
        $this->assertNotEquals('Lapu-Lapu City', $job->location);
        // Verify location is either null or empty
        $this->assertTrue(empty($job->location) || is_null($job->location));
    }
}
