<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\GigJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Route;

class FraudDetectionIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ensure we have an employer
        $this->employer = User::factory()->create([
            'user_type' => 'employer',
            'email_verified_at' => now(),
        ]);
    }

    public function test_medium_risk_allows_request_and_flashes_warning()
    {
        $this->actingAs($this->employer);

        // Manually create 3 jobs in the last hour to trigger the "medium risk" rule
        // (Multiple project creations in short time)
        for ($i = 0; $i < 3; $i++) {
            GigJob::create([
                'employer_id' => $this->employer->id,
                'title' => "Existing Job $i",
                'description' => "This is a long enough description for job $i to pass validation rules if any.",
                'budget_type' => 'fixed',
                'budget_min' => 100,
                'budget_max' => 200,
                'experience_level' => 'intermediate',
                'estimated_duration_days' => 5,
                'status' => 'open',
                'skills_requirements' => [['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required']],
            ]);
        }

        // Try to create a 4th job
        $response = $this->post(route('jobs.store'), [
            'title' => 'New Flagged Job',
            'description' => 'This job should be flagged but still created because it is medium risk. At least 100 characters are required for the description field in validation.',
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 5,
            'skills_requirements' => [['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required']],
        ]);

        // Assert it was NOT blocked (redirected, not 422/403)
        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        
        // Assert job was created
        $this->assertDatabaseHas('gig_jobs', ['title' => 'New Flagged Job']);

        // Assert warning flash message exists
        $response->assertSessionHas('warning', 'Your activity has been flagged for review. Repeated flagged activity may result in account suspension.');
        
        // Assert success message from controller also exists (if redirected to show)
        $response->assertSessionHas('success');
    }

    public function test_low_risk_allows_request_without_warning()
    {
        $this->actingAs($this->employer);

        // No recent jobs, risk should be low
        $response = $this->post(route('jobs.store'), [
            'title' => 'Low Risk Job',
            'description' => 'This job should be created without any warnings because it is the first one in a while. 100 characters minimum description.',
            'budget_type' => 'fixed',
            'budget_min' => 100,
            'budget_max' => 200,
            'experience_level' => 'intermediate',
            'estimated_duration_days' => 5,
            'skills_requirements' => [['skill' => 'PHP', 'experience_level' => 'intermediate', 'importance' => 'required']],
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $response->assertSessionMissing('warning');
        $this->assertDatabaseHas('gig_jobs', ['title' => 'Low Risk Job']);
    }

    /**
     * High risk (e.g. email change) is blocked with 403 and a fraud case is created.
     */
    public function test_high_risk_request_is_blocked_with_403()
    {
        $this->actingAs($this->employer);

        // Trigger high risk: profile update with email change (risk_score 85 in analyzeProfileRequest)
        // Use JSON so middleware returns 403 (for Inertia/JSON it returns 403; for form it redirects with errors)
        $response = $this->patchJson(route('profile.update'), [
            'first_name' => $this->employer->first_name,
            'last_name' => $this->employer->last_name,
            'email' => 'different-' . $this->employer->id . '@example.com',
        ]);

        $response->assertStatus(403);
        // Email should not have changed (request was blocked)
        $this->employer->refresh();
        $this->assertNotEquals('different-' . $this->employer->id . '@example.com', $this->employer->email);
        // A fraud case should exist for high risk (>= 70)
        $this->assertDatabaseHas('fraud_detection_cases', ['user_id' => $this->employer->id]);
    }
}
