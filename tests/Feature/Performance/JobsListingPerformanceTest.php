<?php

namespace Tests\Feature\Performance;

use App\Models\GigJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JobsListingPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_jobs_index_has_reasonable_query_count(): void
    {
        $employer = User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => 'perf@jobs.test',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);

        // Seed a few jobs with minimal relations
        for ($i = 0; $i < 10; $i++) {
            GigJob::create([
                'employer_id' => $employer->id,
                'title' => 'Job '.$i,
                'description' => str_repeat('j', 120),
                'required_skills' => ['PHP'],
                'budget_type' => 'fixed',
                'budget_min' => 100,
                'budget_max' => 200,
                'experience_level' => 'beginner',
                'estimated_duration_days' => 5,
                'status' => 'open',
            ]);
        }

        $this->withoutVite();

        DB::enableQueryLog();
        $response = $this->get('/jobs');
        $status = $response->getStatusCode();
        $this->assertTrue(in_array($status, [200, 302]), 'Unexpected status on /jobs: '.$status);
        if ($status === 200) {
            $queries = DB::getQueryLog();
            // Heuristic threshold (depends on eager loads); adjust as needed
            $this->assertTrue(count($queries) <= 40, 'Too many queries on jobs index: '.count($queries));
        }
    }
}
