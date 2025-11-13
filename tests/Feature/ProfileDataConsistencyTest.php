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
 * Profile Data Consistency Tests
 * 
 * These tests verify that all profile data comes from the database
 * with no mock or placeholder data (Requirements 9.1-9.6)
 */
class ProfileDataConsistencyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that gig worker profile data comes from database
     * Requirement 9.1, 9.2, 9.3
     */
    public function test_gig_worker_profile_fetches_data_from_database(): void
    {
        // Create a gig worker with specific data
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'professional_title' => 'Full Stack Developer',
            'bio' => 'Experienced developer with 5 years of experience',
            'hourly_rate' => 50.00,
            'broad_category' => 'Web Development',
            'specific_services' => ['Laravel', 'React', 'Vue.js'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience' => 'expert'],
                ['skill' => 'JavaScript', 'experience' => 'expert'],
                ['skill' => 'Laravel', 'experience' => 'expert'],
            ],
            'working_hours' => ['Monday-Friday', '9am-5pm'],
            'timezone' => 'UTC',
            'city' => 'Manila',
            'country' => 'Philippines',
            'portfolio_link' => 'https://johndoe.dev',
            'resume_file' => 'resumes/john-doe-resume.pdf',
            'id_verification_status' => 'verified',
        ]);

        // Create a user to view the profile
        $viewer = User::factory()->create(['user_type' => 'employer']);

        // Act: View the profile
        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        // Assert: Response is successful
        $response->assertStatus(200);

        // Assert: All profile data from database is present
        $response->assertInertia(fn ($page) => $page
            ->component('Profiles/WorkerProfile')
            ->has('user', fn ($user) => $user
                ->where('id', $gigWorker->id)
                ->where('first_name', 'John')
                ->where('last_name', 'Doe')
                ->where('professional_title', 'Full Stack Developer')
                ->where('bio', 'Experienced developer with 5 years of experience')
                ->where('hourly_rate', '50.00')
                ->where('broad_category', 'Web Development')
                ->where('city', 'Manila')
                ->where('country', 'Philippines')
                ->where('portfolio_link', 'https://johndoe.dev')
                ->where('resume_file', 'resumes/john-doe-resume.pdf')
                ->where('id_verification_status', 'verified')
                ->has('specific_services', 3)
                ->has('skills_with_experience', 3)
                ->has('working_hours', 2)
            )
        );
    }

    /**
     * Test that skills come from skills_with_experience field
     * Requirement 9.3
     */
    public function test_skills_come_from_skills_with_experience_field(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'skills_with_experience' => [
                ['skill' => 'Python', 'experience' => 'intermediate'],
                ['skill' => 'Django', 'experience' => 'beginner'],
                ['skill' => 'PostgreSQL', 'experience' => 'expert'],
            ],
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('user.skills_with_experience', 3)
            ->where('user.skills_with_experience.0.skill', 'Python')
            ->where('user.skills_with_experience.1.skill', 'Django')
            ->where('user.skills_with_experience.2.skill', 'PostgreSQL')
        );
    }

    /**
     * Test that reviews come from reviews table
     * Requirement 9.4
     */
    public function test_reviews_come_from_reviews_table(): void
    {
        $gigWorker = User::factory()->create(['user_type' => 'gig_worker']);
        $reviewer1 = User::factory()->create(['user_type' => 'employer', 'first_name' => 'Alice']);
        $reviewer2 = User::factory()->create(['user_type' => 'employer', 'first_name' => 'Bob']);

        // Create reviews in database
        Review::factory()->create([
            'reviewee_id' => $gigWorker->id,
            'reviewer_id' => $reviewer1->id,
            'rating' => 5,
            'comment' => 'Excellent work!',
        ]);

        Review::factory()->create([
            'reviewee_id' => $gigWorker->id,
            'reviewer_id' => $reviewer2->id,
            'rating' => 4,
            'comment' => 'Great communication.',
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('reviews', 2)
            ->has('reviews.0', fn ($review) => $review
                ->where('rating', 5)
                ->where('comment', 'Excellent work!')
                ->has('reviewer', fn ($reviewer) => $reviewer
                    ->where('first_name', 'Alice')
                )
            )
            ->has('rating_summary', fn ($summary) => $summary
                ->where('count', 2)
                ->where('average', 4.5)
                ->has('distribution')
            )
        );
    }

    /**
     * Test that portfolio data comes from portfolio_items table or user fields
     * Requirement 9.5
     */
    public function test_portfolio_data_comes_from_database(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'portfolio_link' => 'https://portfolio.example.com',
            'resume_file' => 'resumes/resume.pdf',
        ]);

        // Create portfolio items in database
        PortfolioItem::factory()->create([
            'user_id' => $gigWorker->id,
            'title' => 'E-commerce Website',
            'description' => 'Built a full-featured e-commerce platform',
            'project_url' => 'https://example-shop.com',
            'display_order' => 1,
        ]);

        PortfolioItem::factory()->create([
            'user_id' => $gigWorker->id,
            'title' => 'Mobile App',
            'description' => 'Developed a React Native mobile application',
            'display_order' => 2,
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('user.portfolio_link', 'https://portfolio.example.com')
            ->where('user.resume_file', 'resumes/resume.pdf')
            ->has('portfolio_items', 2)
            ->has('portfolio_items.0', fn ($item) => $item
                ->where('title', 'E-commerce Website')
                ->where('description', 'Built a full-featured e-commerce platform')
                ->where('project_url', 'https://example-shop.com')
            )
        );
    }

    /**
     * Test that employer profile data comes from database
     * Requirement 9.1, 9.2, 9.6
     */
    public function test_employer_profile_fetches_data_from_database(): void
    {
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'company_name' => 'Tech Solutions Inc',
            'company_size' => '50-100',
            'industry' => 'Technology',
            'company_description' => 'Leading software development company',
            'company_website' => 'https://techsolutions.com',
            'primary_hiring_needs' => ['Web Development', 'Mobile Development'],
            'typical_project_budget' => '$5000-$10000',
            'typical_project_duration' => '1-3 months',
            'preferred_experience_level' => 'intermediate',
            'hiring_frequency' => 'monthly',
        ]);

        $viewer = User::factory()->create(['user_type' => 'gig_worker']);

        $response = $this->actingAs($viewer)->get(route('employers.show', $employer));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profiles/EmployerProfile')
            ->has('user', fn ($user) => $user
                ->where('id', $employer->id)
                ->where('first_name', 'Jane')
                ->where('last_name', 'Smith')
                ->where('company_name', 'Tech Solutions Inc')
                ->where('company_size', '50-100')
                ->where('industry', 'Technology')
                ->where('company_description', 'Leading software development company')
                ->where('company_website', 'https://techsolutions.com')
                ->where('typical_project_budget', '$5000-$10000')
                ->where('typical_project_duration', '1-3 months')
                ->where('preferred_experience_level', 'intermediate')
                ->where('hiring_frequency', 'monthly')
                ->has('primary_hiring_needs', 2)
            )
        );
    }

    /**
     * Test that job statistics come from database tables
     * Requirement 9.6
     */
    public function test_job_statistics_come_from_database(): void
    {
        $employer = User::factory()->create(['user_type' => 'employer']);

        // Create jobs in database
        GigJob::factory()->count(3)->create([
            'employer_id' => $employer->id,
            'status' => 'open',
        ]);

        GigJob::factory()->count(2)->create([
            'employer_id' => $employer->id,
            'status' => 'closed',
        ]);

        $viewer = User::factory()->create(['user_type' => 'gig_worker']);

        $response = $this->actingAs($viewer)->get(route('employers.show', $employer));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('job_statistics', fn ($stats) => $stats
                ->where('total_jobs_posted', 5)
                ->where('active_jobs', 3)
            )
        );
    }

    /**
     * Test that profile data updates immediately when database changes
     * Requirement 9.2
     */
    public function test_profile_reflects_database_changes_immediately(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'professional_title' => 'Junior Developer',
            'hourly_rate' => 25.00,
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        // View profile with initial data
        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));
        $response->assertInertia(fn ($page) => $page
            ->where('user.professional_title', 'Junior Developer')
            ->where('user.hourly_rate', '25.00')
        );

        // Update user in database
        $gigWorker->update([
            'professional_title' => 'Senior Developer',
            'hourly_rate' => 75.00,
        ]);

        // View profile again - should show updated data
        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));
        $response->assertInertia(fn ($page) => $page
            ->where('user.professional_title', 'Senior Developer')
            ->where('user.hourly_rate', '75.00')
        );
    }

    /**
     * Test that gig worker names in job proposals come from database
     * Requirement 9.1, 9.2
     */
    public function test_gig_worker_names_in_proposals_come_from_database(): void
    {
        $employer = User::factory()->create(['user_type' => 'employer']);
        $gigWorker1 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'professional_title' => 'Web Developer',
        ]);
        $gigWorker2 = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'Bob',
            'last_name' => 'Williams',
            'professional_title' => 'Mobile Developer',
        ]);

        $job = GigJob::factory()->create(['employer_id' => $employer->id]);

        // Create bids in database
        Bid::factory()->create([
            'gig_job_id' => $job->id,
            'gig_worker_id' => $gigWorker1->id,
        ]);

        Bid::factory()->create([
            'gig_job_id' => $job->id,
            'gig_worker_id' => $gigWorker2->id,
        ]);

        $response = $this->actingAs($employer)->get(route('jobs.show', $job));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('job.bids', 2)
            ->has('job.bids.0.gig_worker', fn ($worker) => $worker
                ->where('first_name', 'Alice')
                ->where('last_name', 'Johnson')
                ->where('professional_title', 'Web Developer')
            )
            ->has('job.bids.1.gig_worker', fn ($worker) => $worker
                ->where('first_name', 'Bob')
                ->where('last_name', 'Williams')
                ->where('professional_title', 'Mobile Developer')
            )
        );
    }

    /**
     * Test that no mock or placeholder data is used
     * Requirement 9.1
     */
    public function test_no_mock_or_placeholder_data_in_profiles(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'first_name' => 'RealUser',
            'last_name' => 'FromDatabase',
        ]);

        $viewer = User::factory()->create(['user_type' => 'employer']);

        $response = $this->actingAs($viewer)->get(route('workers.show', $gigWorker));

        $response->assertStatus(200);

        // Verify no common placeholder values are present
        $response->assertInertia(fn ($page) => $page
            ->where('user.first_name', 'RealUser')
            ->where('user.last_name', 'FromDatabase')
        );

        // Get the response data
        $userData = $response->viewData('page')['props']['user'];

        // Assert no placeholder strings
        $this->assertStringNotContainsString('mock', json_encode($userData));
        $this->assertStringNotContainsString('placeholder', json_encode($userData));
        $this->assertStringNotContainsString('fake', json_encode($userData));
        $this->assertStringNotContainsString('test', json_encode($userData));
        $this->assertStringNotContainsString('example', json_encode($userData));
    }
}
