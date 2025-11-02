<?php

namespace Tests\Feature\Contracts;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContractEscrowFlowTest extends TestCase
{
    use RefreshDatabase;

    private function seedActors(): array
    {
        $employer = User::create([
            'first_name' => 'Client',
            'last_name' => 'One',
            'email' => 'client@escrow.test',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
            'escrow_balance' => 10000,
        ]);

        $worker = User::create([
            'first_name' => 'Worker',
            'last_name' => 'One',
            'email' => 'worker@escrow.test',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);

        $job = GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Escrow Test Job',
            'description' => str_repeat('j', 120),
            'required_skills' => ['PHP'],
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'beginner',
            'estimated_duration_days' => 5,
            'status' => 'open',
        ]);

        return [$employer, $worker, $job];
    }

    public function test_accepting_bid_creates_project_transaction_and_contract(): void
    {
        [$employer, $worker, $job] = $this->seedActors();

        $this->actingAs($worker);
        $this->post('/bids', [
            'job_id' => $job->id,
            'bid_amount' => 150,
            'proposal_message' => str_repeat('p', 60),
            'estimated_days' => 3,
        ])->assertRedirect();

        $bid = Bid::first();

        $this->actingAs($employer);
        $this->patch("/bids/{$bid->id}", [
            'status' => 'accepted',
        ])->assertStatus(302);

        $this->assertDatabaseHas('projects', [
            'job_id' => $job->id,
            'employer_id' => $employer->id,
            'gig_worker_id' => $worker->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('transactions', [
            'payer_id' => $employer->id,
            'payee_id' => $worker->id,
            'amount' => 150,
            'type' => 'escrow',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('contracts', [
            'employer_id' => $employer->id,
            'gig_worker_id' => $worker->id,
            'job_id' => $job->id,
        ]);
    }

    public function test_accepting_bid_fails_if_insufficient_escrow_balance(): void
    {
        [$employer, $worker, $job] = $this->seedActors();
        $employer->update(['escrow_balance' => 50]);

        $this->actingAs($worker);
        $this->post('/bids', [
            'job_id' => $job->id,
            'bid_amount' => 150,
            'proposal_message' => str_repeat('p', 60),
            'estimated_days' => 3,
        ])->assertRedirect();

        $bid = Bid::first();

        $this->actingAs($employer);
        $this->patch("/bids/{$bid->id}", [
            'status' => 'accepted',
        ])->assertSessionHas('error');
    }
}


