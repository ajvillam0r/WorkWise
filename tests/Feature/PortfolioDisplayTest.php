<?php

namespace Tests\Feature;

use App\Models\Bid;
use App\Models\GigJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PortfolioDisplayTest extends TestCase
{
    use RefreshDatabase;

    private function createGigWorker(array $attributes = []): User
    {
        return User::create(array_merge([
            'first_name' => 'Test',
            'last_name' => 'Worker',
            'email' => 'worker@test.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
            'professional_title' => 'Full Stack Developer',
            'bio' => 'Experienced developer with 5 years of experience',
            'skills_with_experience' => json_encode([
                ['skill' => 'PHP', 'experience' => 'expert'],
                ['skill' => 'Laravel', 'experience' => 'expert'],
            ]),
        ], $attributes));
    }

    private function createEmployer(): User
    {
        return User::create([
            'first_name' => 'Test',
            'last_name' => 'Employer',
            'email' => 'employer@test.com',
            'password' => Hash::make('password123'),
            'user_type' => 'employer',
        ]);
    }

    private function createJob(User $employer): GigJob
    {
        return GigJob::create([
            'employer_id' => $employer->id,
            'title' => 'Test Job',
            'description' => str_repeat('Test job description. ', 20),
            'required_skills' => ['PHP', 'Laravel'],
            'budget_type' => 'fixed',
            'budget_min' => 500,
            'budget_max' => 1000,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 14,
            'status' => 'open',
        ]);
    }

    // Test 10.1: Portfolio grid on profile page

    public function test_profile_displays_portfolio_link_only(): void
    {
        $worker = $this->createGigWorker([
            'portfolio_link' => 'https://example.com/portfolio',
            'resume_file' => null,
        ]);

        $response = $this->actingAs($worker)->get('/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Edit')
            ->has('auth.user', fn (Assert $user) => $user
                ->where('portfolio_link', 'https://example.com/portfolio')
                ->where('resume_file', null)
                ->etc()
            )
        );
    }

    public function test_profile_displays_resume_only(): void
    {
        $worker = $this->createGigWorker([
            'portfolio_link' => null,
            'resume_file' => 'https://r2.example.com/portfolios/1/documents/resume.pdf',
        ]);

        $response = $this->actingAs($worker)->get('/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Edit')
            ->has('auth.user', fn (Assert $user) => $user
                ->where('portfolio_link', null)
                ->where('resume_file', 'https://r2.example.com/portfolios/1/documents/resume.pdf')
                ->etc()
            )
        );
    }

    public function test_profile_displays_both_portfolio_and_resume(): void
    {
        $worker = $this->createGigWorker([
            'portfolio_link' => 'https://example.com/portfolio',
            'resume_file' => 'https://r2.example.com/portfolios/1/documents/resume.pdf',
        ]);

        $response = $this->actingAs($worker)->get('/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Edit')
            ->has('auth.user', fn (Assert $user) => $user
                ->where('portfolio_link', 'https://example.com/portfolio')
                ->where('resume_file', 'https://r2.example.com/portfolios/1/documents/resume.pdf')
                ->etc()
            )
        );
    }

    public function test_profile_displays_no_portfolio_items(): void
    {
        $worker = $this->createGigWorker([
            'portfolio_link' => null,
            'resume_file' => null,
        ]);

        $response = $this->actingAs($worker)->get('/profile');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Edit')
            ->has('auth.user', fn (Assert $user) => $user
                ->where('portfolio_link', null)
                ->where('resume_file', null)
                ->etc()
            )
        );
    }

    // Test 10.2: Portfolio in bid proposals

    public function test_bid_includes_portfolio_link_for_gig_worker(): void
    {
        $employer = $this->createEmployer();
        $worker = $this->createGigWorker([
            'portfolio_link' => 'https://example.com/portfolio',
            'resume_file' => null,
        ]);
        $job = $this->createJob($employer);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 750,
            'proposal_message' => str_repeat('I am interested in this project. ', 10),
            'estimated_days' => 10,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($employer)->get("/bids/{$bid->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Bids/Show')
            ->has('bid.gig_worker', fn (Assert $gigWorker) => $gigWorker
                ->where('portfolio_link', 'https://example.com/portfolio')
                ->where('resume_file', null)
                ->etc()
            )
        );
    }

    public function test_bid_includes_resume_for_gig_worker(): void
    {
        $employer = $this->createEmployer();
        $worker = $this->createGigWorker([
            'portfolio_link' => null,
            'resume_file' => 'https://r2.example.com/portfolios/1/documents/resume.pdf',
        ]);
        $job = $this->createJob($employer);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 750,
            'proposal_message' => str_repeat('I am interested in this project. ', 10),
            'estimated_days' => 10,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($employer)->get("/bids/{$bid->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Bids/Show')
            ->has('bid.gig_worker', fn (Assert $gigWorker) => $gigWorker
                ->where('portfolio_link', null)
                ->where('resume_file', 'https://r2.example.com/portfolios/1/documents/resume.pdf')
                ->etc()
            )
        );
    }

    public function test_bid_includes_both_portfolio_and_resume(): void
    {
        $employer = $this->createEmployer();
        $worker = $this->createGigWorker([
            'portfolio_link' => 'https://example.com/portfolio',
            'resume_file' => 'https://r2.example.com/portfolios/1/documents/resume.pdf',
        ]);
        $job = $this->createJob($employer);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 750,
            'proposal_message' => str_repeat('I am interested in this project. ', 10),
            'estimated_days' => 10,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($employer)->get("/bids/{$bid->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Bids/Show')
            ->has('bid.gig_worker', fn (Assert $gigWorker) => $gigWorker
                ->where('portfolio_link', 'https://example.com/portfolio')
                ->where('resume_file', 'https://r2.example.com/portfolios/1/documents/resume.pdf')
                ->etc()
            )
        );
    }

    public function test_bid_with_no_portfolio_items(): void
    {
        $employer = $this->createEmployer();
        $worker = $this->createGigWorker([
            'portfolio_link' => null,
            'resume_file' => null,
        ]);
        $job = $this->createJob($employer);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 750,
            'proposal_message' => str_repeat('I am interested in this project. ', 10),
            'estimated_days' => 10,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($employer)->get("/bids/{$bid->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Bids/Show')
            ->has('bid.gig_worker', fn (Assert $gigWorker) => $gigWorker
                ->where('portfolio_link', null)
                ->where('resume_file', null)
                ->etc()
            )
        );
    }

    public function test_gig_worker_can_view_own_bid_with_portfolio(): void
    {
        $employer = $this->createEmployer();
        $worker = $this->createGigWorker([
            'portfolio_link' => 'https://example.com/portfolio',
            'resume_file' => 'https://r2.example.com/portfolios/1/documents/resume.pdf',
        ]);
        $job = $this->createJob($employer);

        $bid = Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $worker->id,
            'bid_amount' => 750,
            'proposal_message' => str_repeat('I am interested in this project. ', 10),
            'estimated_days' => 10,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($worker)->get("/bids/{$bid->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Bids/Show')
            ->has('bid.gig_worker', fn (Assert $gigWorker) => $gigWorker
                ->where('portfolio_link', 'https://example.com/portfolio')
                ->where('resume_file', 'https://r2.example.com/portfolios/1/documents/resume.pdf')
                ->etc()
            )
        );
    }
}
