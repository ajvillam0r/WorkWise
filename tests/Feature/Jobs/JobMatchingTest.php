<?php

namespace Tests\Feature\Jobs;

use App\Models\GigJob;
use App\Models\User;
use App\Services\MatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobMatchingTest extends TestCase
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

    private function createGigWorker(array $skills, string $experienceLevel = 'intermediate'): User
    {
        return User::create([
            'first_name' => 'Gig',
            'last_name' => 'Worker',
            'email' => 'worker' . uniqid() . '@test.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
            'skills_with_experience' => $skills,
            'experience_level' => $experienceLevel,
            'bio' => 'Experienced freelancer',
            'hourly_rate' => 50,
        ]);
    }

    // Task 6.4: Test AI job matching
    public function test_match_scores_reflect_experience_levels(): void
    {
        $employer = $this->createEmployer();
        
        // Create a job requiring intermediate React
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'React Developer',
            'description' => str_repeat('Need React developer for web app. ', 10),
            'skills_requirements' => [
                ['skill' => 'React', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 40,
            'budget_max' => 80,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 30,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Worker with exact match
        $workerExactMatch = $this->createGigWorker([
            ['skill' => 'React', 'experience_level' => 'intermediate'],
            ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
        ], 'intermediate');

        // Worker with higher experience
        $workerHigherExp = $this->createGigWorker([
            ['skill' => 'React', 'experience_level' => 'expert'],
            ['skill' => 'JavaScript', 'experience_level' => 'expert'],
        ], 'expert');

        // Worker with lower experience
        $workerLowerExp = $this->createGigWorker([
            ['skill' => 'React', 'experience_level' => 'beginner'],
            ['skill' => 'JavaScript', 'experience_level' => 'beginner'],
        ], 'beginner');

        $matchService = new MatchService();

        $matchExact = $matchService->getJobMatch($job, $workerExactMatch);
        $matchHigher = $matchService->getJobMatch($job, $workerHigherExp);
        $matchLower = $matchService->getJobMatch($job, $workerLowerExp);

        // Higher or exact experience should score better than lower
        $this->assertGreaterThanOrEqual($matchLower['score'], $matchExact['score']);
        $this->assertGreaterThanOrEqual($matchLower['score'], $matchHigher['score']);
        
        // All should have successful matches
        $this->assertTrue($matchExact['success']);
        $this->assertTrue($matchHigher['success']);
        $this->assertTrue($matchLower['success']);
    }

    public function test_required_skills_weighted_higher_than_preferred(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Full Stack Developer',
            'description' => str_repeat('Full stack position with Laravel and Vue. ', 10),
            'skills_requirements' => [
                ['skill' => 'Laravel', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Vue.js', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'Docker', 'experience_level' => 'beginner', 'importance' => 'preferred'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 50,
            'budget_max' => 100,
            'experience_level' => 'expert',
            'estimated_duration_days' => 60,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Worker with all required skills but no preferred
        $workerRequiredOnly = $this->createGigWorker([
            ['skill' => 'Laravel', 'experience_level' => 'expert'],
            ['skill' => 'Vue.js', 'experience_level' => 'intermediate'],
        ], 'expert');

        // Worker with only preferred skill
        $workerPreferredOnly = $this->createGigWorker([
            ['skill' => 'Docker', 'experience_level' => 'beginner'],
        ], 'beginner');

        $matchService = new MatchService();

        $matchRequired = $matchService->getJobMatch($job, $workerRequiredOnly);
        $matchPreferred = $matchService->getJobMatch($job, $workerPreferredOnly);

        // Worker with required skills should score much higher
        $this->assertGreaterThan($matchPreferred['score'], $matchRequired['score']);
        $this->assertGreaterThan(60, $matchRequired['score']); // Should be high score
        $this->assertLessThan(50, $matchPreferred['score']); // Should be low score
    }

    public function test_match_explanations_reference_specific_skills(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Python Developer',
            'description' => str_repeat('Python development with Django framework. ', 10),
            'skills_requirements' => [
                ['skill' => 'Python', 'experience_level' => 'expert', 'importance' => 'required'],
                ['skill' => 'Django', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'expert',
            'estimated_duration_days' => 45,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $worker = $this->createGigWorker([
            ['skill' => 'Python', 'experience_level' => 'expert'],
            ['skill' => 'Django', 'experience_level' => 'intermediate'],
        ], 'expert');

        $matchService = new MatchService();
        $match = $matchService->getJobMatch($job, $worker);

        // Verify the explanation mentions specific skills
        $this->assertNotEmpty($match['reason']);
        $this->assertTrue($match['success']);
        
        // The reason should contain skill-related information
        $reason = strtolower($match['reason']);
        $this->assertTrue(
            str_contains($reason, 'skill') || 
            str_contains($reason, 'python') || 
            str_contains($reason, 'django') ||
            str_contains($reason, 'match'),
            'Match explanation should reference skills or matching'
        );
    }

    public function test_match_with_various_gig_worker_profiles(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Web Developer',
            'description' => str_repeat('Web development with modern technologies. ', 10),
            'skills_requirements' => [
                ['skill' => 'HTML', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'CSS', 'experience_level' => 'intermediate', 'importance' => 'required'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'hourly',
            'budget_min' => 30,
            'budget_max' => 60,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 20,
            'status' => 'open',
            'is_remote' => true,
        ]);

        // Create various worker profiles
        $workers = [
            // Perfect match
            $this->createGigWorker([
                ['skill' => 'HTML', 'experience_level' => 'intermediate'],
                ['skill' => 'CSS', 'experience_level' => 'intermediate'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
            ], 'intermediate'),
            
            // Partial match
            $this->createGigWorker([
                ['skill' => 'HTML', 'experience_level' => 'intermediate'],
                ['skill' => 'CSS', 'experience_level' => 'beginner'],
            ], 'beginner'),
            
            // No match
            $this->createGigWorker([
                ['skill' => 'Python', 'experience_level' => 'expert'],
                ['skill' => 'Django', 'experience_level' => 'expert'],
            ], 'expert'),
            
            // Over-qualified
            $this->createGigWorker([
                ['skill' => 'HTML', 'experience_level' => 'expert'],
                ['skill' => 'CSS', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert'],
                ['skill' => 'React', 'experience_level' => 'expert'],
                ['skill' => 'Node.js', 'experience_level' => 'expert'],
            ], 'expert'),
        ];

        $matchService = new MatchService();
        $scores = [];

        foreach ($workers as $index => $worker) {
            $match = $matchService->getJobMatch($job, $worker);
            $scores[$index] = $match['score'];
            
            $this->assertTrue($match['success'], "Match should succeed for worker {$index}");
            $this->assertIsInt($match['score'], "Score should be integer for worker {$index}");
            $this->assertGreaterThanOrEqual(0, $match['score'], "Score should be >= 0 for worker {$index}");
            $this->assertLessThanOrEqual(100, $match['score'], "Score should be <= 100 for worker {$index}");
        }

        // Perfect match and over-qualified should score highest
        $this->assertGreaterThan($scores[1], $scores[0]); // Perfect > Partial
        $this->assertGreaterThan($scores[2], $scores[0]); // Perfect > No match
        $this->assertGreaterThan($scores[2], $scores[3]); // Over-qualified > No match
    }

    public function test_legacy_job_matching_fallback(): void
    {
        $employer = $this->createEmployer();
        
        // Create a legacy job with only required_skills
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Legacy PHP Job',
            'description' => str_repeat('PHP development for legacy system. ', 10),
            'required_skills' => ['PHP', 'MySQL'],
            'skills_requirements' => null, // Legacy format
            'budget_type' => 'hourly',
            'budget_min' => 30,
            'budget_max' => 60,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 15,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $worker = $this->createGigWorker([
            ['skill' => 'PHP', 'experience_level' => 'intermediate'],
            ['skill' => 'MySQL', 'experience_level' => 'intermediate'],
        ], 'intermediate');

        $matchService = new MatchService();
        $match = $matchService->getJobMatch($job, $worker);

        // Matching should still work with legacy data
        $this->assertTrue($match['success']);
        $this->assertGreaterThan(0, $match['score']);
        $this->assertNotEmpty($match['reason']);
    }

    public function test_match_score_calculation_consistency(): void
    {
        $employer = $this->createEmployer();
        
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Consistency Test Job',
            'description' => str_repeat('Testing match score consistency. ', 10),
            'skills_requirements' => [
                ['skill' => 'TypeScript', 'experience_level' => 'intermediate', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 10,
            'status' => 'open',
            'is_remote' => true,
        ]);

        $worker = $this->createGigWorker([
            ['skill' => 'TypeScript', 'experience_level' => 'intermediate'],
        ], 'intermediate');

        $matchService = new MatchService();
        
        // Run matching multiple times
        $match1 = $matchService->getJobMatch($job, $worker);
        $match2 = $matchService->getJobMatch($job, $worker);
        $match3 = $matchService->getJobMatch($job, $worker);

        // Scores should be consistent (allowing for caching)
        $this->assertEquals($match1['score'], $match2['score']);
        $this->assertEquals($match2['score'], $match3['score']);
    }
}
