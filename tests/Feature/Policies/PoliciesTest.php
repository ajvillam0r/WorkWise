<?php

namespace Tests\Feature\Policies;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PoliciesTest extends TestCase
{
    use RefreshDatabase;

    private function createEmployer(string $email): User
    {
        return User::create([
            'first_name' => 'Emp',
            'last_name' => 'Loyer',
            'email' => $email,
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
            'escrow_balance' => 10000,
        ]);
    }

    private function createWorker(string $email): User
    {
        return User::create([
            'first_name' => 'Gig',
            'last_name' => 'Worker',
            'email' => $email,
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);
    }

    public function test_only_employers_can_create_jobs(): void
    {
        $worker = $this->createWorker('worker@policy.test');
        $this->actingAs($worker);

        $response = $this->post('/jobs', [
            'title' => 'Not Allowed',
            'description' => str_repeat('x', 120),
            'required_skills' => ['PHP'],
            'skills_requirements' => [
                ['skill' => 'PHP', 'experience_level' => 'beginner', 'importance' => 'required'],
            ],
            'budget_type' => 'fixed',
            'budget_min' => 5,
            'budget_max' => 10,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 1,
        ]);

        // Some middleware may redirect; core guarantee is that job is not created
        $this->assertDatabaseMissing('gig_jobs', [
            'title' => 'Not Allowed',
        ]);
    }

    public function test_only_job_owner_can_accept_or_reject_bids(): void
    {
        $employerOwner = $this->createEmployer('owner@policy.test');
        $employerOther = $this->createEmployer('other@policy.test');
        $worker = $this->createWorker('worker@policy.test');

        $job = GigJob::create([
            'employer_id' => $employerOwner->id,
            'title' => 'Owned Job',
            'description' => str_repeat('j', 130),
            'required_skills' => ['PHP'],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 10,
            'status' => 'open',
        ]);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 150,
            'proposal_message' => str_repeat('b', 60),
            'estimated_days' => 5,
            'status' => 'pending',
        ]);

        $this->actingAs($employerOther);
        $response = $this->patch("/bids/{$bid->id}", [
            'status' => 'accepted',
        ]);

        $response->assertSessionHasErrors(['error']);
    }

    public function test_bid_visibility_restricted_to_owner_and_worker(): void
    {
        $employerOwner = $this->createEmployer('owner2@policy.test');
        $employerOther = $this->createEmployer('other2@policy.test');
        $worker = $this->createWorker('worker2@policy.test');

        $job = GigJob::create([
            'employer_id' => $employerOwner->id,
            'title' => 'Owned Job 2',
            'description' => str_repeat('j', 130),
            'required_skills' => ['PHP'],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 10,
            'status' => 'open',
        ]);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 150,
            'proposal_message' => str_repeat('b', 60),
            'estimated_days' => 5,
            'status' => 'pending',
        ]);

        $this->withoutVite();

        $this->actingAs($employerOther);
        $this->get("/bids/{$bid->id}")->assertStatus(403);

        $this->actingAs($employerOwner);
        $this->get("/bids/{$bid->id}")->assertOk();

        $this->actingAs($worker);
        $this->get("/bids/{$bid->id}")->assertOk();
    }
}


