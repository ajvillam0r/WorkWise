<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OnboardingBackwardCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_employer_profile_with_legacy_verification_data_loads_correctly(): void
    {
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'email_verified_at' => now(),
            'profile_status' => 'approved',
            'onboarding_step' => 3,
            'company_name' => 'Legacy Tech Corp',
            'company_size' => '11-50',
            'industry' => 'Technology',
            'business_registration_document' => 'https://example.com/legacy-doc.pdf',
            'tax_id' => '123-456-789',
        ]);

        $response = $this->actingAs($employer)->get(route('profile.edit'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->has('auth.user')
        );
        
        // Verify legacy data is preserved in database
        $employer->refresh();
        $this->assertEquals('https://example.com/legacy-doc.pdf', $employer->business_registration_document);
        $this->assertEquals('123-456-789', $employer->tax_id);
    }

    public function test_gig_worker_profile_with_legacy_availability_data_loads_correctly(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'profile_status' => 'pending',
            'onboarding_step' => 6,
            'professional_title' => 'Full Stack Developer',
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
            'availability_notes' => 'Available for urgent projects on weekends',
        ]);

        $response = $this->actingAs($gigWorker)->get(route('profile.edit'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->has('auth.user')
        );
        
        // Verify legacy availability data is preserved in database
        $gigWorker->refresh();
        $this->assertEquals('Asia/Manila', $gigWorker->timezone);
        $this->assertEquals('Available for urgent projects on weekends', $gigWorker->availability_notes);
        $this->assertNotNull($gigWorker->working_hours);
        $this->assertNotNull($gigWorker->preferred_communication);
    }

    public function test_gig_worker_profile_with_legacy_address_data_loads_correctly(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'profile_status' => 'pending',
            'onboarding_step' => 6,
            'professional_title' => 'Graphic Designer',
            'street_address' => '123 Main Street',
            'city' => 'Cebu City',
            'postal_code' => '6000',
            'country' => 'Philippines',
            'address_verified_at' => now()->subDays(30),
        ]);

        $response = $this->actingAs($gigWorker)->get(route('profile.edit'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->has('auth.user')
        );
        
        // Verify legacy address data is preserved in database
        $gigWorker->refresh();
        $this->assertEquals('123 Main Street', $gigWorker->street_address);
        $this->assertEquals('Cebu City', $gigWorker->city);
        $this->assertEquals('6000', $gigWorker->postal_code);
        $this->assertEquals('Philippines', $gigWorker->country);
        $this->assertNotNull($gigWorker->address_verified_at);
    }

    public function test_profile_editing_works_with_legacy_data(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'profile_status' => 'pending',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'bio' => 'Original bio',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'street_address' => '123 Main Street',
            'city' => 'Cebu City',
        ]);

        $response = $this->actingAs($gigWorker)->patch(route('profile.update'), [
            'bio' => 'Updated bio with new information',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', [
            'id' => $gigWorker->id,
            'bio' => 'Updated bio with new information',
        ]);

        $gigWorker->refresh();
        $this->assertEquals('123 Main Street', $gigWorker->street_address);
        $this->assertEquals('Cebu City', $gigWorker->city);
        $this->assertNotNull($gigWorker->working_hours);
        $this->assertEquals('Asia/Manila', $gigWorker->timezone);
    }

    public function test_no_errors_when_accessing_profiles_with_removed_fields(): void
    {
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'email_verified_at' => now(),
            'profile_status' => 'approved',
            'company_name' => 'Test Company',
            'business_registration_document' => 'https://example.com/doc.pdf',
            'tax_id' => '999-888-777',
        ]);

        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'profile_status' => 'pending',
            'professional_title' => 'Developer',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
            'availability_notes' => 'Available weekdays',
            'street_address' => '456 Test St',
            'city' => 'Manila',
            'postal_code' => '1000',
            'address_verified_at' => now(),
        ]);

        $response = $this->actingAs($employer)->get(route('profile.edit'));
        $response->assertStatus(200);
        $response->assertSessionHasNoErrors();

        $response = $this->actingAs($gigWorker)->get(route('profile.edit'));
        $response->assertStatus(200);
        $response->assertSessionHasNoErrors();

        $response = $this->actingAs($employer)->patch(route('profile.update'), [
            'company_name' => 'Updated Company Name',
        ]);
        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $response = $this->actingAs($gigWorker)->patch(route('profile.update'), [
            'professional_title' => 'Senior Developer',
        ]);
        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
    }

    public function test_employer_with_legacy_tax_id_can_update_profile(): void
    {
        $employer = User::factory()->create([
            'user_type' => 'employer',
            'email_verified_at' => now(),
            'company_name' => 'Original Company',
            'company_size' => '11-50',
            'industry' => 'Technology',
            'tax_id' => 'TAX-123-456',
            'business_registration_document' => 'https://example.com/reg.pdf',
        ]);

        $response = $this->actingAs($employer)->patch(route('profile.update'), [
            'company_description' => 'We are a leading technology company.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', [
            'id' => $employer->id,
            'company_description' => 'We are a leading technology company.',
        ]);

        $employer->refresh();
        $this->assertEquals('TAX-123-456', $employer->tax_id);
        $this->assertEquals('https://example.com/reg.pdf', $employer->business_registration_document);
    }

    public function test_gig_worker_can_update_availability_with_legacy_address(): void
    {
        $gigWorker = User::factory()->create([
            'user_type' => 'gig_worker',
            'email_verified_at' => now(),
            'professional_title' => 'Content Writer',
            'street_address' => '321 Writer Lane',
            'city' => 'Quezon City',
            'postal_code' => '1100',
            'country' => 'Philippines',
            'address_verified_at' => now()->subDays(60),
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
        ]);

        $newWorkingHours = [
            'monday' => ['enabled' => true, 'start' => '08:00', 'end' => '16:00'],
            'tuesday' => ['enabled' => true, 'start' => '08:00', 'end' => '16:00'],
            'wednesday' => ['enabled' => true, 'start' => '08:00', 'end' => '16:00'],
            'thursday' => ['enabled' => true, 'start' => '08:00', 'end' => '16:00'],
            'friday' => ['enabled' => true, 'start' => '08:00', 'end' => '16:00'],
            'saturday' => ['enabled' => true, 'start' => '10:00', 'end' => '14:00'],
            'sunday' => ['enabled' => false, 'start' => '09:00', 'end' => '17:00'],
        ];

        $response = $this->actingAs($gigWorker)->patch(route('profile.update'), [
            'working_hours' => $newWorkingHours,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $gigWorker->refresh();
        $this->assertEquals($newWorkingHours, $gigWorker->working_hours);
        $this->assertEquals('321 Writer Lane', $gigWorker->street_address);
        $this->assertEquals('Quezon City', $gigWorker->city);
        $this->assertEquals('1100', $gigWorker->postal_code);
        $this->assertNotNull($gigWorker->address_verified_at);
    }
}
