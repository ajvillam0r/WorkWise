<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class R2StorageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use real R2 storage for these tests
        // We'll test actual R2 connectivity and upload functionality
    }

    /** @test */
    public function profile_picture_uploads_to_r2_successfully()
    {
        // Skip if R2 is not configured
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Create a test image file
        $profilePicture = UploadedFile::fake()->image('profile.jpg', 800, 800)->size(500);

        $startTime = microtime(true);

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Full Stack Developer',
            'hourly_rate' => 75,
            'bio' => 'I am an experienced full stack developer with expertise in modern web technologies and cloud platforms.',
            'profile_picture' => $profilePicture,
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend Development', 'Backend Development'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert'],
                ['skill' => 'React', 'experience_level' => 'intermediate'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg', 1024, 768),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg', 1024, 768),
            'street_address' => '456 Developer Avenue',
            'city' => 'Cebu City',
            'postal_code' => '6000',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email'],
        ]);

        $uploadTime = microtime(true) - $startTime;

        $response->assertRedirect('/jobs');
        
        $user->refresh();
        
        // Verify profile picture URL is set
        $this->assertNotNull($user->profile_picture);
        
        // Verify the URL contains the expected path structure
        $this->assertStringContainsString('profiles/' . $user->id, $user->profile_picture);
        
        // Verify upload completed within 5 seconds
        $this->assertLessThan(5, $uploadTime, 'Profile picture upload took longer than 5 seconds');
        
        // Try to access the URL (basic connectivity check)
        if (str_starts_with($user->profile_picture, 'http')) {
            $headers = @get_headers($user->profile_picture);
            $this->assertNotFalse($headers, 'Profile picture URL is not accessible');
            $this->assertStringContainsString('200', $headers[0], 'Profile picture URL did not return 200 OK');
        }
    }

    /** @test */
    public function profile_picture_is_stored_in_correct_r2_path()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        $profilePicture = UploadedFile::fake()->image('profile.jpg', 800, 800);

        $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet requirements.',
            'profile_picture' => $profilePicture,
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        $user->refresh();
        
        // Verify the path structure: profiles/{user_id}/
        $expectedPathPattern = '/profiles\/' . $user->id . '\//';
        $this->assertMatchesRegularExpression($expectedPathPattern, $user->profile_picture);
    }

    /** @test */
    public function id_verification_images_upload_to_r2_successfully()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        $idFrontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(800);
        $idBackImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(800);

        $startTime = microtime(true);

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
            'id_type' => 'national_id',
            'id_front_image' => $idFrontImage,
            'id_back_image' => $idBackImage,
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

        $uploadTime = microtime(true) - $startTime;

        $response->assertRedirect('/jobs');
        
        $user->refresh();
        
        // Verify both ID images are uploaded
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        
        // Verify the URLs contain the expected path structure
        $this->assertStringContainsString('id_verification/' . $user->id, $user->id_front_image);
        $this->assertStringContainsString('id_verification/' . $user->id, $user->id_back_image);
        
        // Verify uploads completed within 10 seconds (5 seconds each)
        $this->assertLessThan(10, $uploadTime, 'ID verification images upload took longer than 10 seconds');
        
        // Try to access the URLs (basic connectivity check)
        if (str_starts_with($user->id_front_image, 'http')) {
            $headers = @get_headers($user->id_front_image);
            $this->assertNotFalse($headers, 'ID front image URL is not accessible');
            $this->assertStringContainsString('200', $headers[0], 'ID front image URL did not return 200 OK');
        }
        
        if (str_starts_with($user->id_back_image, 'http')) {
            $headers = @get_headers($user->id_back_image);
            $this->assertNotFalse($headers, 'ID back image URL is not accessible');
            $this->assertStringContainsString('200', $headers[0], 'ID back image URL did not return 200 OK');
        }
    }

    /** @test */
    public function id_verification_images_are_stored_in_correct_r2_path()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        $this->actingAs($user)->post('/onboarding/gig-worker', [
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
            'id_front_image' => UploadedFile::fake()->image('passport_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('passport_back.jpg'),
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

        $user->refresh();
        
        // Verify the path structure: id_verification/{user_id}/
        $expectedPathPattern = '/id_verification\/' . $user->id . '\//';
        $this->assertMatchesRegularExpression($expectedPathPattern, $user->id_front_image);
        $this->assertMatchesRegularExpression($expectedPathPattern, $user->id_back_image);
    }

    /** @test */
    public function resume_file_uploads_to_r2_successfully()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Test with PDF resume
        $resumeFile = UploadedFile::fake()->create('resume.pdf', 1024, 'application/pdf');

        $startTime = microtime(true);

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
            'resume_file' => $resumeFile,
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        $uploadTime = microtime(true) - $startTime;

        $response->assertRedirect('/jobs');
        
        $user->refresh();
        
        // Verify resume file URL is set
        $this->assertNotNull($user->resume_file);
        
        // Verify the URL contains the expected path structure
        $this->assertStringContainsString('portfolios/' . $user->id . '/documents', $user->resume_file);
        
        // Verify upload completed within 5 seconds
        $this->assertLessThan(5, $uploadTime, 'Resume file upload took longer than 5 seconds');
        
        // Try to access the URL (basic connectivity check)
        if (str_starts_with($user->resume_file, 'http')) {
            $headers = @get_headers($user->resume_file);
            $this->assertNotFalse($headers, 'Resume file URL is not accessible');
            $this->assertStringContainsString('200', $headers[0], 'Resume file URL did not return 200 OK');
        }
    }

    /** @test */
    public function resume_file_is_stored_in_correct_r2_path()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        $this->actingAs($user)->post('/onboarding/gig-worker', [
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
            'resume_file' => UploadedFile::fake()->create('my_resume.pdf', 2048, 'application/pdf'),
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        $user->refresh();
        
        // Verify the path structure: portfolios/{user_id}/documents/
        $expectedPathPattern = '/portfolios\/' . $user->id . '\/documents\//';
        $this->assertMatchesRegularExpression($expectedPathPattern, $user->resume_file);
    }

    /** @test */
    public function resume_file_accepts_different_formats()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $formats = [
            ['file' => 'resume.pdf', 'mime' => 'application/pdf'],
            ['file' => 'resume.doc', 'mime' => 'application/msword'],
            ['file' => 'resume.docx', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];

        foreach ($formats as $format) {
            $user = User::factory()->create([
                'user_type' => 'gig_worker',
                'profile_completed' => false,
                'country' => 'Philippines',
            ]);

            $resumeFile = UploadedFile::fake()->create($format['file'], 1024, $format['mime']);

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
                'resume_file' => $resumeFile,
                'id_type' => 'national_id',
                'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
                'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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
            
            $user->refresh();
            $this->assertNotNull($user->resume_file, "Failed to upload {$format['file']}");
        }
    }

    /** @test */
    public function r2_upload_failure_returns_user_friendly_error()
    {
        // Create a user
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Mock Storage to simulate R2 failure
        Storage::shouldReceive('disk')
            ->with('r2')
            ->andReturnSelf();
        
        Storage::shouldReceive('putFile')
            ->andThrow(new \Exception('R2 connection failed'));

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet requirements.',
            'profile_picture' => UploadedFile::fake()->image('profile.jpg'),
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        // Verify user-friendly error message is shown
        $response->assertSessionHasErrors(['profile_picture']);
        
        // Verify the error message is user-friendly (not technical)
        $errors = session('errors');
        if ($errors) {
            $profilePictureError = $errors->get('profile_picture')[0] ?? '';
            $this->assertStringContainsString('Failed to upload', $profilePictureError);
            $this->assertStringContainsString('try again', $profilePictureError);
        }
    }

    /** @test */
    public function form_data_is_preserved_on_upload_failure()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Mock Storage to simulate R2 failure
        Storage::shouldReceive('disk')
            ->with('r2')
            ->andReturnSelf();
        
        Storage::shouldReceive('putFile')
            ->andThrow(new \Exception('R2 connection failed'));

        $formData = [
            'professional_title' => 'Senior Developer',
            'hourly_rate' => 85,
            'bio' => 'This is my detailed professional bio that is at least fifty characters long.',
            'profile_picture' => UploadedFile::fake()->image('profile.jpg'),
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'expert'],
                ['skill' => 'React', 'experience_level' => 'intermediate'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
            'street_address' => '456 Developer Street',
            'city' => 'Manila',
            'postal_code' => '1000',
            'kyc_country' => 'Philippines',
            'working_hours' => [
                'monday' => ['enabled' => true, 'start' => '09:00', 'end' => '17:00'],
            ],
            'timezone' => 'Asia/Manila',
            'preferred_communication' => ['email', 'chat'],
        ];

        $response = $this->actingAs($user)->post('/onboarding/gig-worker', $formData);

        // Verify form redirects back with input
        $response->assertRedirect();
        $response->assertSessionHasInput('professional_title', 'Senior Developer');
        $response->assertSessionHasInput('hourly_rate', 85);
        $response->assertSessionHasInput('bio', 'This is my detailed professional bio that is at least fifty characters long.');
    }

    /** @test */
    public function error_is_logged_when_r2_upload_fails()
    {
        if (!env('R2_ACCESS_KEY_ID') || !env('R2_BUCKET')) {
            $this->markTestSkipped('R2 storage is not configured');
        }

        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Mock Storage to simulate R2 failure
        Storage::shouldReceive('disk')
            ->with('r2')
            ->andReturnSelf();
        
        Storage::shouldReceive('putFile')
            ->andThrow(new \Exception('Simulated R2 failure'));

        // Mock Log to verify error is logged
        Log::shouldReceive('info')->andReturn(null);
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function ($message, $context) use ($user) {
                return str_contains($message, 'upload failed') &&
                       isset($context['user_id']) &&
                       $context['user_id'] === $user->id;
            });

        $this->actingAs($user)->post('/onboarding/gig-worker', [
            'professional_title' => 'Web Developer',
            'hourly_rate' => 50,
            'bio' => 'This is a test bio that is at least fifty characters long to meet requirements.',
            'profile_picture' => UploadedFile::fake()->image('profile.jpg'),
            'broad_category' => 'Web Development',
            'specific_services' => ['Frontend', 'Backend'],
            'skills_with_experience' => [
                ['skill' => 'PHP', 'experience_level' => 'expert'],
                ['skill' => 'JavaScript', 'experience_level' => 'intermediate'],
                ['skill' => 'React', 'experience_level' => 'beginner'],
            ],
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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
    }

    /** @test */
    public function invalid_file_type_returns_validation_error()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Try to upload an invalid file type for resume
        $invalidFile = UploadedFile::fake()->create('resume.txt', 1024, 'text/plain');

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
            'resume_file' => $invalidFile,
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        $response->assertSessionHasErrors(['resume_file']);
    }

    /** @test */
    public function file_size_exceeding_limit_returns_validation_error()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'profile_completed' => false,
            'country' => 'Philippines',
        ]);

        // Try to upload a file larger than 5MB (5120 KB)
        $largeFile = UploadedFile::fake()->create('resume.pdf', 6000, 'application/pdf');

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
            'resume_file' => $largeFile,
            'id_type' => 'national_id',
            'id_front_image' => UploadedFile::fake()->image('id_front.jpg'),
            'id_back_image' => UploadedFile::fake()->image('id_back.jpg'),
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

        $response->assertSessionHasErrors(['resume_file']);
    }
}
