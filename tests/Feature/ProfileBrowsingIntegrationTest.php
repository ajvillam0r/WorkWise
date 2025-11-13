<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Review;
use App\Models\PortfolioItem;
use App\Models\GigJob;
use App\Models\Bid;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Profile Browsing Integration Tests
 * 
 * Tests complete profile browsing flow including:
 * - Employer viewing gig worker profiles from job proposals
 * - Gig worker viewing employer profiles from job listings
 * - Profile data display verification
 * - Contact button navigation
 * - Clickable names from all locations
 * 
 * Requirements: 1.1-1.4, 2.1-2.12, 3.1-3.3, 4.1-4.15, 5.1-5.4, 8.1-8.4
 */
class ProfileBrowsingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test employer can view gig worker profile from job proposals
     * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1-2.12
     */
    public function test_employer_can_view_gig_worker_profile_from_job_proposals(): void
    {
        // Arrange: Create employer, gig worker, job, and bid
        $employer = User::factory()->create(['user_type' => 'employer']);
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'John',
            'last_name' => 'Developer',
            'professional_title' => 'Full Stack Developer',
            'bio' => 'Experienced developer',
            'hourly_rate' => 50.00,
            'broad_category' => 'Web Development',
            'specific_services' => ['Laravel', 'React'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience' => 'expert'],
                ['skill' => 'JavaScript', 'experience' => 'expert'],
            ],
            'city' => 'Manila',
            'country' => 'Philippines',
            'id_verification_status' => 'verified',
        ]);

        $job = GigJob::factory()->create(['employer_id' => $employer->id]);
        Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $gigWorker->id,
            'bid_amount' => 500.00,
            'proposal_message' => 'I am interested in this project',
            'estimated_days' => 14,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        // Act: Employer views job with proposals
        $jobResponse = $this->actingAs($employer)->get(route('jobs.show', $job));

        // Assert: Job page loads with gig worker data
        $jobResponse->assertStatus(200);
        $jobResponse->assertInertia(fn ($page) => $page
            ->has('job.bids.0.gig_worker', fn ($worker) => $worker
                ->where('id', $gigWorker->id)
                ->where('first_name', 'John')
                ->where('last_name', 'Developer')
                ->etc()
            )
        );

        // Act: Employer clicks on gig worker name to view profile
        $profileResponse = $this->actingAs($employer)->get(route('workers.show', $gigWorker));

        // Assert: Profile page loads with complete data
        $profileResponse->assertStatus(200);
        $profileResponse->assertInertia(fn ($page) => $page
            ->component('Profiles/WorkerProfile')
            ->has('user', fn ($user) => $user
                ->where('id', $gigWorker->id)
                ->where('first_name', 'John')
                ->where('last_name', 'Developer')
                ->where('professional_title', 'Full Stack Developer')
                ->where('bio', 'Experienced developer')
                ->where('hourly_rate', '50.00')
                ->where('broad_category', 'Web Development')
                ->where('city', 'Manila')
                ->where('country', 'Philippines')
                ->where('id_verification_status', 'verified')
                ->has('specific_services', 2)
                ->has('skills_with_experience', 2)
                ->etc()
            )
        );
    }

    /**
     * Test gig worker can view employer profile from job listing
     * Requirements: 3.1, 3.2, 3.3, 4.1-4.15
     */
    public function test_gig_worker_can_view_employer_profile_from_job_listing(): void
    {
        // Arrange: Create gig worker and employer with job
        $gigWorker = User::factory()->create(['user_type' => 'gig_worker']);
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'company_name' => 'Tech Solutions Inc',
            'company_size' => '11-50',
            'industry' => 'Technology',
            'company_description' => 'Leading software company',
            'company_website' => 'https://techsolutions.com',
            'primary_hiring_needs' => ['Web Development', 'Mobile Development'],
            'typical_project_budget' => '5000-10000',
            'typical_project_duration' => 'short_term',
            'preferred_experience_level' => 'intermediate',
            'hiring_frequency' => 'regular',
        ]);

        $job = GigJob::factory()->create(['employer_id' => $employer->id]);

        // Act: Gig worker views job listing
        $jobResponse = $this->actingAs($gigWorker)->get(route('jobs.show', $job));

        // Assert: Job page loads with employer data
        $jobResponse->assertStatus(200);
        $jobResponse->assertInertia(fn ($page) => $page
            ->has('job.employer', fn ($emp) => $emp
                ->where('id', $employer->id)
                ->where('company_name', 'Tech Solutions Inc')
                ->etc()
            )
        );

        // Act: Gig worker clicks on employer name to view profile
        $profileResponse = $this->actingAs($gigWorker)->get(route('employers.show', $employer));

        // Assert: Employer profile loads with complete data
        $profileResponse->assertStatus(200);
        $profileResponse->assertInertia(fn ($page) => $page
            ->component('Profiles/EmployerProfile')
            ->has('user', fn ($user) => $user
                ->where('id', $employer->id)
                ->where('company_name', 'Tech Solutions Inc')
                ->where('company_size', '11-50')
                ->where('industry', 'Technology')
                ->where('company_description', 'Leading software company')
                ->where('company_website', 'https://techsolutions.com')
                ->where('typical_project_budget', '5000-10000')
                ->where('typical_project_duration', 'short_term')
                ->where('preferred_experience_level', 'intermediate')
                ->where('hiring_frequency', 'regular')
                ->has('primary_hiring_needs', 2)
                ->etc()
            )
        );
    }

    /**
     * Test all profile data displays correctly for gig worker
     * Requirements: 2.1-2.12
     */
    public function test_gig_worker_profile_displays_all_data_correctly(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'professional_title' => 'UI/UX Designer',
            'bio' => 'Creative designer with 8 years experience',
            'hourly_rate' => 75.00,
            'broad_category' => 'Design',
            'specific_services' => ['UI Design', 'UX Research', 'Prototyping'],
            'skills_with_experience' => [
                ['skill' => 'Figma', 'experience' => 'expert'],
                ['skill' => 'Adobe XD', 'experience' => 'expert'],
                ['skill' => 'Sketch', 'experience' => 'intermediate'],
            ],
            'working_hours' => ['Monday-Friday', '10am-6pm'],
            'timezone' => 'Asia/Manila',
            'city' => 'Cebu',
            'country' => 'Philippines',
            'portfolio_link' => 'https://alicejohnson.design',
            'resume_file' => 'resumes/alice-johnson.pdf',
            'id_verification_status' => 'verified',
        ]);

        // Create portfolio items
        PortfolioItem::factory()->create([
            'user_id' => $gigWorker->id,
            'title' => 'E-commerce Redesign',
            'description' => 'Complete UI/UX redesign',
            'display_order' => 1,
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        // Act: View profile
        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        // Assert: All data displays correctly
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profiles/WorkerProfile')
            ->has('user', fn ($user) => $user
                ->where('professional_title', 'UI/UX Designer')
                ->where('bio', 'Creative designer with 8 years experience')
                ->where('hourly_rate', '75.00')
                ->where('broad_category', 'Design')
                ->where('city', 'Cebu')
                ->where('country', 'Philippines')
                ->where('portfolio_link', 'https://alicejohnson.design')
                ->where('resume_file', 'resumes/alice-johnson.pdf')
                ->where('id_verification_status', 'verified')
                ->where('timezone', 'Asia/Manila')
                ->has('specific_services', 3)
                ->has('skills_with_experience', 3)
                ->has('working_hours', 2)
                ->etc()
            )
            ->has('portfolio_items', 1)
        );
    }

    /**
     * Test all profile data displays correctly for employer
     * Requirements: 4.1-4.15
     */
    public function test_employer_profile_displays_all_data_correctly(): void
    {
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'Michael',
            'last_name' => 'Chen',
            'company_name' => 'Innovation Labs',
            'company_size' => '51-200',
            'industry' => 'Software',
            'company_description' => 'Cutting-edge software solutions',
            'company_website' => 'https://innovationlabs.io',
            'primary_hiring_needs' => ['Backend Development', 'DevOps', 'Data Science'],
            'typical_project_budget' => '10000+',
            'typical_project_duration' => 'medium_term',
            'preferred_experience_level' => 'expert',
            'hiring_frequency' => 'ongoing',
        ]);

        // Create jobs for statistics
        GigJob::factory()->count(5)->create([
            'employer_id' => $employer->id,
            'status' => 'open',
        ]);

        GigJob::factory()->count(3)->create([
            'employer_id' => $employer->id,
            'status' => 'closed',
        ]);

        $viewer = User::factory()->create(['user_type' => 'gig_worker']);

        // Act: View profile
        $response = $this->actingAs($viewer)->get(route('employers.show', $employer));

        // Assert: All data displays correctly
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profiles/EmployerProfile')
            ->has('user', fn ($user) => $user
                ->where('company_name', 'Innovation Labs')
                ->where('company_size', '51-200')
                ->where('industry', 'Software')
                ->where('company_description', 'Cutting-edge software solutions')
                ->where('company_website', 'https://innovationlabs.io')
                ->where('typical_project_budget', '10000+')
                ->where('typical_project_duration', 'medium_term')
                ->where('preferred_experience_level', 'expert')
                ->where('hiring_frequency', 'ongoing')
                ->has('primary_hiring_needs', 3)
                ->etc()
            )
            ->has('job_statistics', fn ($stats) => $stats
                ->where('total_jobs_posted', 8)
                ->where('active_jobs', 5)
                ->etc()
            )
        );
    }

    /**
     * Test contact button navigation to messaging
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    public function test_contact_button_routes_to_messaging(): void
    {
        $employer = User::factory()->create(['user_type' => 'employer']);
        $gigWorker = User::factory()->create(['user_type' => 'gig_worker']);

        // Act: Employer views gig worker profile
        $response = $this->actingAs($employer)->get(route('workers.show', $gigWorker));

        // Assert: Profile loads successfully
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profiles/WorkerProfile')
            ->where('user.id', $gigWorker->id)
        );

        // Act: Navigate to conversation (simulating contact button click)
        $conversationResponse = $this->actingAs($employer)->get(route('messages.conversation', $gigWorker));

        // Assert: Conversation page loads
        $conversationResponse->assertStatus(200);
        $conversationResponse->assertInertia(fn ($page) => $page
            ->component('Messages/Conversation')
            ->has('user', fn ($user) => $user
                ->where('id', $gigWorker->id)
                ->etc()
            )
        );
    }

    /**
     * Test clickable names work from all locations
     * Requirements: 1.1-1.4, 8.1-8.4
     */
    public function test_clickable_names_work_from_all_locations(): void
    {
        $employer = User::factory()->create(['user_type' => 'employer']);
        $gigWorker1 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Worker',
            'last_name' => 'One',
        ]);
        $gigWorker2 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Worker',
            'last_name' => 'Two',
        ]);
        $gigWorker3 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Worker',
            'last_name' => 'Three',
        ]);

        $job = GigJob::factory()->create(['employer_id' => $employer->id]);

        // Create multiple bids
        Bid::create(['job_id' => $job->id, 'gig_worker_id' => $gigWorker1->id, 'bid_amount' => 500, 'proposal_message' => 'Proposal 1', 'estimated_days' => 14, 'status' => 'pending', 'submitted_at' => now()]);
        Bid::create(['job_id' => $job->id, 'gig_worker_id' => $gigWorker2->id, 'bid_amount' => 600, 'proposal_message' => 'Proposal 2', 'estimated_days' => 15, 'status' => 'pending', 'submitted_at' => now()]);
        Bid::create(['job_id' => $job->id, 'gig_worker_id' => $gigWorker3->id, 'bid_amount' => 700, 'proposal_message' => 'Proposal 3', 'estimated_days' => 16, 'status' => 'pending', 'submitted_at' => now()]);

        // Act: View job with multiple proposals
        $jobResponse = $this->actingAs($employer)->get(route('jobs.show', $job));

        // Assert: All gig worker data is present
        $jobResponse->assertStatus(200);
        $jobResponse->assertInertia(fn ($page) => $page
            ->has('job.bids', 3)
            ->has('job.bids.0.gig_worker')
            ->has('job.bids.1.gig_worker')
            ->has('job.bids.2.gig_worker')
        );

        // Act: Click on each gig worker name (test all profile links)
        $profile1 = $this->actingAs($employer)->get(route('workers.show', $gigWorker1));
        $profile2 = $this->actingAs($employer)->get(route('workers.show', $gigWorker2));
        $profile3 = $this->actingAs($employer)->get(route('workers.show', $gigWorker3));

        // Assert: All profiles load successfully
        $profile1->assertStatus(200)->assertInertia(fn ($page) => $page
            ->where('user.id', $gigWorker1->id)
        );
        $profile2->assertStatus(200)->assertInertia(fn ($page) => $page
            ->where('user.id', $gigWorker2->id)
        );
        $profile3->assertStatus(200)->assertInertia(fn ($page) => $page
            ->where('user.id', $gigWorker3->id)
        );
    }

    /**
     * Test complete end-to-end profile browsing flow
     * Requirements: All profile browsing requirements
     */
    public function test_complete_profile_browsing_flow(): void
    {
        // Arrange: Create complete scenario
        $employer = User::factory()->create(['user_type' => 'employer']);
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Complete',
            'last_name' => 'Test',
            'professional_title' => 'Test Developer',
            'hourly_rate' => 60.00,
        ]);

        $job = GigJob::factory()->create(['employer_id' => $employer->id]);
        Bid::create([
            'job_id' => $job->id,
            'gig_worker_id' => $gigWorker->id,
            'bid_amount' => 600.00,
            'proposal_message' => 'I am interested',
            'estimated_days' => 20,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        // Step 1: Employer views their job
        $step1 = $this->actingAs($employer)->get(route('jobs.show', $job));
        $step1->assertStatus(200);

        // Step 2: Employer clicks on gig worker name in proposal
        $step2 = $this->actingAs($employer)->get(route('workers.show', $gigWorker));
        $step2->assertStatus(200);
        $step2->assertInertia(fn ($page) => $page
            ->component('Profiles/WorkerProfile')
            ->where('user.id', $gigWorker->id)
        );

        // Step 3: Employer clicks contact button
        $step3 = $this->actingAs($employer)->get(route('messages.conversation', $gigWorker));
        $step3->assertStatus(200);
        $step3->assertInertia(fn ($page) => $page
            ->component('Messages/Conversation')
        );

        // Step 4: Gig worker views job listing
        $step4 = $this->actingAs($gigWorker)->get(route('jobs.show', $job));
        $step4->assertStatus(200);

        // Step 5: Gig worker clicks on employer name
        $step5 = $this->actingAs($gigWorker)->get(route('employers.show', $employer));
        $step5->assertStatus(200);
        $step5->assertInertia(fn ($page) => $page
            ->component('Profiles/EmployerProfile')
            ->where('user.id', $employer->id)
        );

        // Step 6: Gig worker clicks contact button
        $step6 = $this->actingAs($gigWorker)->get(route('messages.conversation', $employer));
        $step6->assertStatus(200);
        $step6->assertInertia(fn ($page) => $page
            ->component('Messages/Conversation')
        );
    }
}
