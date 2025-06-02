<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\GigJob;
use App\Models\Bid;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkWiseBasicTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_page_loads(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_user_can_register_as_freelancer(): void
    {
        // Set the session to simulate role selection
        session(['selected_user_type' => 'freelancer']);

        $response = $this->post('/register', [
            'name' => 'Test Freelancer',
            'email' => 'freelancer@test.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', [
            'email' => 'freelancer@test.com',
            'user_type' => 'freelancer',
        ]);
    }

    public function test_user_can_register_as_client(): void
    {
        // Set the session to simulate role selection
        session(['selected_user_type' => 'client']);

        $response = $this->post('/register', [
            'name' => 'Test Client',
            'email' => 'client@test.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', [
            'email' => 'client@test.com',
            'user_type' => 'client',
        ]);
    }

    public function test_client_can_create_job(): void
    {
        $client = User::factory()->create(['user_type' => 'client']);

        $response = $this->actingAs($client)->post('/jobs', [
            'title' => 'Test Job',
            'description' => 'This is a test job description.',
            'required_skills' => ['PHP', 'Laravel'],
            'budget_type' => 'fixed',
            'budget_min' => 1000,
            'budget_max' => 2000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 30,
            'is_remote' => true,
        ]);

        $this->assertDatabaseHas('gig_jobs', [
            'title' => 'Test Job',
            'employer_id' => $client->id,
        ]);
    }

    public function test_freelancer_can_submit_bid(): void
    {
        $client = User::factory()->create(['user_type' => 'client']);
        $freelancer = User::factory()->create(['user_type' => 'freelancer']);

        $job = GigJob::factory()->create([
            'employer_id' => $client->id,
            'title' => 'Test Job',
            'status' => 'open',
        ]);

        $response = $this->actingAs($freelancer)->post('/bids', [
            'job_id' => $job->id,
            'bid_amount' => 1500,
            'proposal_message' => 'This is a test proposal message that is long enough to meet the minimum requirements.',
            'estimated_days' => 25,
        ]);

        $this->assertDatabaseHas('bids', [
            'job_id' => $job->id,
            'freelancer_id' => $freelancer->id,
            'bid_amount' => 1500,
        ]);
    }

    public function test_jobs_index_page_loads(): void
    {
        $response = $this->get('/jobs');
        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_access_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_role_selection_page_loads(): void
    {
        $response = $this->get('/join');
        $response->assertStatus(200);
    }

    public function test_role_selection_redirects_to_register(): void
    {
        $response = $this->post('/join', [
            'user_type' => 'freelancer'
        ]);

        $response->assertRedirect('/register');
        $this->assertEquals('freelancer', session('selected_user_type'));
    }

    public function test_register_redirects_to_role_selection_without_session(): void
    {
        $response = $this->get('/register');
        $response->assertRedirect('/join');
    }
}
