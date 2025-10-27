<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Testing\File;

class GigWorkerOnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        
        // Mock CloudinaryService to avoid actual uploads and validation issues
        $this->mockCloudinaryService();
    }

    /**
     * Mock the CloudinaryService to return successful upload results
     */
    protected function mockCloudinaryService()
    {
        $mock = $this->createMock(CloudinaryService::class);
        
        // Mock uploadProfilePicture - returns successful upload result
        $mock->method('uploadProfilePicture')
            ->willReturn([
                'public_id' => 'workwise/profile_pictures/test_user_123',
                'secure_url' => 'https://res.cloudinary.com/test/image/upload/profile.jpg',
                'url' => 'http://res.cloudinary.com/test/image/upload/profile.jpg',
                'width' => 800,
                'height' => 800,
                'format' => 'jpg',
                'bytes' => 102400
            ]);
        
        // Mock uploadIdVerification - returns successful upload result
        $mock->method('uploadIdVerification')
            ->willReturn([
                'public_id' => 'workwise/id_verification/test_user_id',
                'secure_url' => 'https://res.cloudinary.com/test/image/upload/id_verification.jpg',
                'url' => 'http://res.cloudinary.com/test/image/upload/id_verification.jpg',
                'format' => 'jpg',
                'bytes' => 204800,
                'resource_type' => 'image'
            ]);
        
        // Mock uploadPortfolioItem - returns successful upload result
        $mock->method('uploadPortfolioItem')
            ->willReturn([
                'public_id' => 'workwise/portfolios/test_portfolio',
                'secure_url' => 'https://res.cloudinary.com/test/image/upload/portfolio.jpg',
                'url' => 'http://res.cloudinary.com/test/image/upload/portfolio.jpg',
                'format' => 'jpg',
                'bytes' => 153600,
                'resource_type' => 'image'
            ]);
        
        // Bind the mock to the service container
        $this->app->instance(CloudinaryService::class, $mock);
    }

    /**
     * Create a fake image file without GD extension
     */
    protected function fakeImage($name, $width = 100, $height = 100)
    {
        return UploadedFile::fake()->create($name, 100); // Create a simple file instead
    }

    /** @test */
    public function gig_worker_can_access_onboarding_page()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
        ]);

        $response = $this->actingAs($user)->get('/onboarding/gig-worker');
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Onboarding/GigWorkerOnboarding')
        );
    }

    /** @test */
    public function gig_worker_cannot_access_onboarding_if_profile_completed()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => true,
        ]);

        $response = $this->actingAs($user)->get('/onboarding/gig-worker');
        
        $response->assertRedirect('/jobs'); // Changed from /dashboard
    }

    /** @test */
    public function non_gig_worker_cannot_access_gig_worker_onboarding()
    {
        $user = User::factory()->create([
            'user_type' => 'employer',
        ]);

        $response = $this->actingAs($user)->get('/onboarding/gig-worker');
        
        $response->assertRedirect('/jobs'); // Changed from /dashboard
    }

    /** @test */
    public function onboarding_requires_all_mandatory_fields()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', []);

        $response->assertSessionHasErrors([
            'professional_title',
            'hourly_rate',
            'bio',
            'broad_category',
            'specific_services',
            'skills_with_experience',
            'id_type',
            'id_front_image',
            'id_back_image',
            'street_address',
            'city',
            'postal_code',
            'kyc_country',
            'working_hours',
            'timezone',
            'preferred_communication',
        ]);
    }

    /** @test */
    public function onboarding_requires_minimum_three_skills()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet the requirement.',
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                // Only 2 skills - should fail
            ],
            'id_type' => 'national_id',
            'id_front_image' => $this->fakeImage('id_front.jpg'),
            'id_back_image' => $this->fakeImage('id_back.jpg'),
            'street_address' => '123 Test Street',
            'city' => 'Test City',
            'postal_code' => '12345',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
        ]);

        $response->assertSessionHasErrors(['skills_with_experience']);
    }

    /** @test */
    public function gig_worker_can_complete_onboarding_with_valid_data()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines', // Set during registration
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Full Stack Developer',
            'hourly_rate' => 75,
            'bio' => 'I am an experienced full stack developer with expertise in modern web technologies and cloud platforms.',
            'profile_picture' => $this->fakeImage('profile.jpg', 800, 800),
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend Development', 'Backend Development'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert'],
                ['skill' => 'React', 'experience_level' => 'intermediate'],
            ],
            'portfolio_items' => [],
            'id_type' => 'national_id',
            'id_front_image' => $this->fakeImage('id_front.jpg', 1024, 768),
            'id_back_image' => $this->fakeImage('id_back.jpg', 1024, 768),
            'street_address' => '456 Developer Avenue',
            'city' => 'Cebu City',
            'barangay' => 'Lahug',
            'postal_code' => '6000',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
                'tuesday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
                'wednesday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
                'thursday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
                'friday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
                'saturday' => ['enabled' => false, 'start' => '09:00', 'end' => '17:00'],
                'sunday' => ['enabled' => false, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email', 'chat'],
            'availability_notes' => 'Available for projects starting immediately.',
        ]);

        $response->assertRedirect('/jobs');
        
        $user->refresh();
        $this->assertTrue($user->profile_completed);
        $this->assertEquals('pending', $user->profile_status);
        $this->assertEquals(6, $user->onboarding_step);
        $this->assertEquals('Full Stack Developer', $user->professional_title);
        $this->assertEquals(75, $user->hourly_rate);
        $this->assertEquals('456 Developer Avenue', $user->street_address);
        $this->assertEquals('Cebu City', $user->city);
        $this->assertNotNull($user->address_verified_at);
    }

    /** @test */
    public function bio_must_be_at_least_50_characters()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'Too short', // Less than 50 characters
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => $this->fakeImage('id_front.jpg'),
            'id_back_image' => $this->fakeImage('id_back.jpg'),
            'street_address' => '123 Test Street',
            'city' => 'Test City',
            'postal_code' => '12345',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
        ]);

        $response->assertSessionHasErrors(['bio']);
    }

    /** @test */
    public function hourly_rate_must_be_between_5_and_10000()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
        ]);

        // Test rate too low
        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 2, // Too low
            'bio' => 'This is a test bio that is at least fifty characters long.',
        ]);

        $response->assertSessionHasErrors(['hourly_rate']);

        // Test rate too high
        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 15000, // Too high
            'bio' => 'This is a test bio that is at least fifty characters long.',
        ]);

        $response->assertSessionHasErrors(['hourly_rate']);
    }

    /** @test */
    public function portfolio_items_are_optional()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet requirements.',
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'portfolio_items' => [], // Empty portfolio
            'id_type' => 'national_id',
            'id_front_image' => $this->fakeImage('id_front.jpg'),
            'id_back_image' => $this->fakeImage('id_back.jpg'),
            'street_address' => '123 Test Street',
            'city' => 'Test City',
            'postal_code' => '12345',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
        ]);

        $response->assertRedirect('/jobs');
    }

    /** @test */
    public function address_fields_are_saved_correctly()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'United States', // Different from KYC country
        ]);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet requirements.',
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'id_type' => 'passport',
            'id_front_image' => $this->fakeImage('id_front.jpg'),
            'id_back_image' => $this->fakeImage('id_back.jpg'),
            'street_address' => '789 Remote Worker Street',
            'city' => 'Manila',
            'barangay' => 'Ermita',
            'postal_code' => '1000',
            'kyc_country' => 'Philippines', // Different from registration country
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
        ]);

        $response->assertRedirect('/jobs');
        
        $user->refresh();
        $this->assertEquals('Philippines', $user->country); // Should be updated with KYC country
        $this->assertEquals('789 Remote Worker Street', $user->street_address);
        $this->assertEquals('Manila', $user->city);
        $this->assertEquals('Ermita', $user->barangay);
        $this->assertEquals('1000', $user->postal_code);
        $this->assertNotNull($user->address_verified_at);
    }
}

