<?php

namespace Tests\Unit\Database;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConstraintsTest extends TestCase
{
    use RefreshDatabase;

    public function test_bid_unique_per_job_per_worker(): void
    {
        $employer = User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => 'emp@db.test',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
        $worker = User::create([
            'first_name' => 'Gig',
            'last_name' => 'Worker',
            'email' => 'worker@db.test',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);
        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Unique Bid Job',
            'description' => str_repeat('j', 120),
            'required_skills' => ['PHP'],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 5,
            'status' => 'open',
        ]);

        Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 120,
            'proposal_message' => str_repeat('p', 60),
            'estimated_days' => 3,
        ]);

        $this->expectException(QueryException::class);
        Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 130,
            'proposal_message' => str_repeat('q', 60),
            'estimated_days' => 4,
        ]);
    }
}


