<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Unit tests for IdVerificationController
 * Tests Requirements: 1.1-1.10, 2.1-2.10, 3.1-3.7, 9.1-9.8, 10.1-10.8
 */
class IdVerificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('r2');
        Log::spy();
    }

    /**
     * Test uploadFront method with valid image
     * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
     */
    public function test_upload_front_with_valid_image()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
        ]);

        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Front ID uploaded successfully',
            ])
            ->assertJsonStructure([
                'success',
                'url',
                'message',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertStringContainsString('id_verification', $user->id_front_image);
    }

    /**
     * Test uploadFront method with oversized file
     * Requirements: 1.4, 9.1
     */
    public function test_upload_front_rejects_oversized_file()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        $largeImage = UploadedFile::fake()->image('id_front.jpg')->size(6000); // 6MB

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $largeImage,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['front_image']);

        $user->refresh();
        $this->assertNull($user->id_front_image);
    }

    /**
     * Test uploadFront method with invalid file type
     * Requirements: 1.4, 9.2
     */
    public function test_upload_front_rejects_invalid_file_type()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        $invalidFile = UploadedFile::fake()->create('id_front.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $invalidFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['front_image']);

        $user->refresh();
        $this->assertNull($user->id_front_image);
    }

    /**
     * Test uploadFront method without authentication
     */
    public function test_upload_front_requires_authentication()
    {
        $frontImage = UploadedFile::fake()->image('id_front.jpg');

        $response = $this->postJson('/api/id-verification/upload-front', [
            'front_image' => $frontImage,
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test uploadBack method with valid image
     * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1
     */
    public function test_upload_back_with_valid_image()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
                'message' => 'ID verification submitted successfully',
            ])
            ->assertJsonStructure([
                'success',
                'url',
                'status',
                'message',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test uploadBack method without front image
     * Requirements: 2.1
     */
    public function test_upload_back_requires_front_image_first()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_verification_status' => 'pending',
        ]);

        $backImage = UploadedFile::fake()->image('id_back.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Please upload front ID first',
            ]);

        $user->refresh();
        $this->assertNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test uploadBack method with oversized file
     * Requirements: 2.4, 9.1
     */
    public function test_upload_back_rejects_oversized_file()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
        ]);

        $largeImage = UploadedFile::fake()->image('id_back.jpg')->size(6000); // 6MB

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $largeImage,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['back_image']);

        $user->refresh();
        $this->assertNull($user->id_back_image);
    }

    /**
     * Test uploadBack method with invalid file type
     * Requirements: 2.4, 9.2
     */
    public function test_upload_back_rejects_invalid_file_type()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/front.jpg',
        ]);

        $invalidFile = UploadedFile::fake()->create('id_back.txt', 1000, 'text/plain');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $invalidFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['back_image']);

        $user->refresh();
        $this->assertNull($user->id_back_image);
    }

    /**
     * Test resubmit method with valid images
     * Requirements: 3.5, 3.6, 6.13, 6.14
     */
    public function test_resubmit_with_valid_images()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => 'https://example.com/old_front.jpg',
            'id_back_image' => 'https://example.com/old_back.jpg',
            'id_verification_status' => 'rejected',
            'id_verification_notes' => 'Previous rejection reason',
        ]);

        $frontImage = UploadedFile::fake()->image('new_front.jpg', 1024, 768)->size(2048);
        $backImage = UploadedFile::fake()->image('new_back.jpg', 1024, 768)->size(2048);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $frontImage,
                'back_image' => $backImage,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'ID resubmitted successfully',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
        $this->assertNull($user->id_verification_notes);
    }

    /**
     * Test resubmit method with missing front image
     */
    public function test_resubmit_requires_both_images()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected',
        ]);

        $backImage = UploadedFile::fake()->image('id_back.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'back_image' => $backImage,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['front_image']);
    }

    /**
     * Test resubmit method with oversized files
     * Requirements: 9.1
     */
    public function test_resubmit_rejects_oversized_files()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'rejected',
        ]);

        $largeFront = UploadedFile::fake()->image('front.jpg')->size(6000);
        $largeBack = UploadedFile::fake()->image('back.jpg')->size(6000);

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/resubmit', [
                'front_image' => $largeFront,
                'back_image' => $largeBack,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['front_image', 'back_image']);
    }

    /**
     * Test sequential upload flow
     * Requirements: 1.1-1.10, 2.1-2.10, 3.1-3.7
     */
    public function test_complete_sequential_upload_flow()
    {
        $user = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_front_image' => null,
            'id_back_image' => null,
            'id_verification_status' => 'pending',
        ]);

        // Step 1: Upload front image
        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);
        
        $frontResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $frontResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);

        // Step 2: Upload back image
        $backImage = UploadedFile::fake()->image('id_back.jpg', 1024, 768)->size(2048);
        
        $backResponse = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-back', [
                'back_image' => $backImage,
            ]);

        $backResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'pending',
            ]);

        $user->refresh();
        $this->assertNotNull($user->id_front_image);
        $this->assertNotNull($user->id_back_image);
        $this->assertEquals('pending', $user->id_verification_status);
    }

    /**
     * Test upload with various image formats
     * Requirements: 1.4, 2.4
     */
    public function test_upload_accepts_various_image_formats()
    {
        // Test JPG format
        $user1 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'pending',
        ]);
        $jpgImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);
        $response1 = $this->actingAs($user1)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $jpgImage]);
        $response1->assertStatus(200)->assertJson(['success' => true]);
        $user1->refresh();
        $this->assertNotNull($user1->id_front_image);

        // Test PNG format
        $user2 = User::factory()->create([
            'user_type' => 'gig_worker',
            'id_verification_status' => 'pending',
        ]);
        $pngImage = UploadedFile::fake()->image('id_front.png', 1024, 768)->size(2048);
        $response2 = $this->actingAs($user2)
            ->postJson('/api/id-verification/upload-front', ['front_image' => $pngImage]);
        $response2->assertStatus(200)->assertJson(['success' => true]);
        $user2->refresh();
        $this->assertNotNull($user2->id_front_image);
    }

    /**
     * Test error handling for upload failures
     * Requirements: 9.3, 9.4, 9.5
     */
    public function test_upload_handles_service_failures_gracefully()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        // Mock FileUploadService to simulate failure
        $this->mock(FileUploadService::class, function ($mock) {
            $mock->shouldReceive('uploadWithRetry')
                ->once()
                ->andReturn([
                    'success' => false,
                    'error' => 'Upload failed. Please check your connection and try again.',
                    'error_code' => 'UPLOAD_FAILED',
                ]);
        });

        $frontImage = UploadedFile::fake()->image('id_front.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure([
                'success',
                'message',
            ]);

        $user->refresh();
        $this->assertNull($user->id_front_image);
    }

    /**
     * Test logging for upload operations
     * Requirements: 9.6, 10.10
     */
    public function test_upload_operations_are_logged()
    {
        $user = User::factory()->create(['user_type' => 'gig_worker']);

        $frontImage = UploadedFile::fake()->image('id_front.jpg', 1024, 768)->size(2048);

        $this->actingAs($user)
            ->postJson('/api/id-verification/upload-front', [
                'front_image' => $frontImage,
            ]);

        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_STARTED', \Mockery::type('array'));
        
        Log::shouldHaveReceived('info')
            ->with('ID_VERIFICATION_FRONT_UPLOAD_SUCCESS', \Mockery::type('array'));
    }
}
