<?php

namespace Tests\Unit\Services;

use App\Services\FileUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class FileUploadServiceTest extends TestCase
{
    private FileUploadService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create the service (no Cloudinary needed anymore)
        $this->service = $this->app->make(FileUploadService::class);
        
        // Fake the Supabase storage disk
        Storage::fake('supabase');
        Storage::fake('r2');
        
        // Prevent actual logging during tests
        Log::spy();
    }

    /** @test */
    public function it_uploads_file_to_r2_successfully(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('profile.jpg', 100, 100)->size(500); // 500KB
        $directory = 'profiles';
        $options = [
            'user_id' => 123,
            'user_type' => 'gig_worker',
            'visibility' => 'public',
        ];

        // Act
        $result = $this->service->uploadToSupabase($file, $directory, $options);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertNotNull($result['url']);
        $this->assertNotNull($result['path']);
        $this->assertNull($result['error']);
        $this->assertNull($result['error_code']);
        
        // Verify file was stored
        $this->assertStringContainsString('profiles/123/', $result['path']);
        Storage::disk('supabase')->assertExists($result['path']);
    }

    /** @test */
    public function it_handles_upload_failure_gracefully(): void
    {
        // Arrange
        Storage::shouldReceive('disk->putFileAs')
            ->andReturn(false);
        
        $file = UploadedFile::fake()->image('profile.jpg');
        $directory = 'profiles';

        // Act
        $result = $this->service->uploadToSupabase($file, $directory);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertNull($result['url']);
        $this->assertNull($result['path']);
        $this->assertNotNull($result['error']);
        $this->assertEquals('UPLOAD_FAILED', $result['error_code']);
    }

    /** @test */
    public function it_retries_failed_uploads(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('profile.jpg');
        $directory = 'profiles';
        $options = ['user_id' => 456];

        // Mock Storage to fail first attempt, succeed on second
        Storage::shouldReceive('disk')
            ->andReturnSelf()
            ->times(3); // disk() is called for each attempt
        
        Storage::shouldReceive('putFileAs')
            ->once()
            ->andReturn(false);
        
        Storage::shouldReceive('putFileAs')
            ->once()
            ->andReturn('profiles/456/profile_123456_abc123.jpg');
        
        Storage::shouldReceive('url')
            ->once()
            ->andReturn('https://r2.example.com/profiles/456/profile_123456_abc123.jpg');

        // Act
        $result = $this->service->uploadWithRetry($file, $directory, 2, $options);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertNotNull($result['url']);
    }

    /** @test */
    public function it_returns_error_after_exhausting_retries(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('profile.jpg');
        $directory = 'profiles';
        $maxRetries = 2;

        // Mock Storage to always fail
        Storage::shouldReceive('disk')
            ->andReturnSelf();
        
        Storage::shouldReceive('putFileAs')
            ->times(3) // Initial attempt + 2 retries
            ->andReturn(false);

        // Act
        $result = $this->service->uploadWithRetry($file, $directory, $maxRetries);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('UPLOAD_FAILED', $result['error_code']);
    }

    /** @test */
    public function it_validates_file_size_successfully(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('profile.jpg')->size(1024); // 1MB
        $rules = [
            'type' => 'image',
            'max_size' => 2097152, // 2MB
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertNull($result['error']);
        $this->assertNull($result['error_code']);
    }

    /** @test */
    public function it_rejects_oversized_files(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('large.jpg')->size(3072); // 3MB
        $rules = [
            'type' => 'image',
            'max_size' => 2097152, // 2MB limit
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertNotNull($result['error']);
        $this->assertEquals('FILE_TOO_LARGE', $result['error_code']);
        $this->assertStringContainsString('exceeds maximum allowed size', $result['error']);
    }

    /** @test */
    public function it_validates_file_type_successfully(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('profile.jpg'); // MIME: image/jpeg
        $rules = [
            'type' => 'image',
            'allowed_types' => ['image/jpeg', 'image/png'],
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert
        $this->assertTrue($result['success']);
    }

    /** @test */
    public function it_rejects_invalid_file_types(): void
    {
        // Arrange
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');
        $rules = [
            'type' => 'image',
            'allowed_types' => ['image/jpeg', 'image/png', 'image/gif'],
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertNotNull($result['error']);
        $this->assertEquals('INVALID_FILE_TYPE', $result['error_code']);
        $this->assertStringContainsString('Invalid file type', $result['error']);
    }

    /** @test */
    public function it_generates_unique_file_paths(): void
    {
        // Arrange
        $userId = 789;
        $directory = 'documents';
        $filename = 'My Resume.pdf';

        // Act
        $path1 = $this->service->generatePath($userId, $directory, $filename);
        
        // Sleep briefly to ensure different timestamp
        usleep(1000);
        
        $path2 = $this->service->generatePath($userId, $directory, $filename);

        // Assert
        $this->assertStringContainsString('documents/789/', $path1);
        $this->assertStringContainsString('.pdf', $path1);
        $this->assertStringContainsString('my-resume', $path1);
        
        // Paths should be unique
        $this->assertNotEquals($path1, $path2);
    }

    /** @test */
    public function it_generates_path_without_user_id(): void
    {
        // Arrange
        $directory = 'public';
        $filename = 'banner.jpg';

        // Act
        $path = $this->service->generatePath(null, $directory, $filename);

        // Assert
        $this->assertStringStartsWith('public/', $path);
        $this->assertStringContainsString('banner', $path);
        $this->assertStringContainsString('.jpg', $path);
    }

    /** @test */
    public function it_sanitizes_filenames_in_path_generation(): void
    {
        // Arrange
        $userId = 100;
        $directory = 'uploads';
        $filename = 'My File (1) [Special].jpg';

        // Act
        $path = $this->service->generatePath($userId, $directory, $filename);

        // Assert
        // Should convert to slug format
        $this->assertStringContainsString('my-file-1-special', $path);
        $this->assertStringNotContainsString('(', $path);
        $this->assertStringNotContainsString(')', $path);
        $this->assertStringNotContainsString('[', $path);
        $this->assertStringNotContainsString(']', $path);
    }

    /** @test */
    public function it_returns_correct_error_response_format(): void
    {
        // Arrange
        $file = UploadedFile::fake()->image('test.jpg')->size(5000); // 5MB
        $rules = [
            'type' => 'image',
            'max_size' => 2097152, // 2MB
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert - Verify response structure
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('error', $result);
        $this->assertArrayHasKey('error_code', $result);
        
        $this->assertIsBool($result['success']);
        $this->assertFalse($result['success']);
        $this->assertIsString($result['error']);
        $this->assertIsString($result['error_code']);
    }

    /** @test */
    public function it_validates_multiple_image_types(): void
    {
        // Test various image types
        $imageTypes = [
            ['jpg', 'image/jpeg'],
            ['png', 'image/png'],
            ['gif', 'image/gif'],
        ];

        foreach ($imageTypes as [$extension, $mimeType]) {
            $file = UploadedFile::fake()->create("test.{$extension}", 100, $mimeType);
            $rules = [
                'type' => 'image',
                'allowed_types' => ['image/jpeg', 'image/png', 'image/gif'],
            ];

            $result = $this->service->validateFile($file, $rules);

            $this->assertTrue($result['success'], "Failed to validate {$extension} file");
        }
    }

    /** @test */
    public function it_validates_document_types(): void
    {
        // Arrange
        $file = UploadedFile::fake()->create('resume.pdf', 1000, 'application/pdf');
        $rules = [
            'type' => 'document',
            'allowed_types' => ['application/pdf'],
            'max_size' => 5242880, // 5MB
        ];

        // Act
        $result = $this->service->validateFile($file, $rules);

        // Assert
        $this->assertTrue($result['success']);
    }
}
