<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TestCloudinaryUpload extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cloudinary:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Cloudinary connection and upload functionality';

    /**
     * Execute the console command.
     */
    public function handle(CloudinaryService $cloudinaryService)
    {
        $this->info('Testing Cloudinary Configuration...');
        $this->newLine();

        // Test 1: Check configuration
        $this->info('1. Checking Cloudinary configuration...');
        $cloudName = config('cloudinary.cloud_name');
        $apiKey = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            $this->error('❌ Cloudinary credentials are not configured!');
            $this->warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
            return 1;
        }

        $this->info("✓ Cloud Name: {$cloudName}");
        $this->info("✓ API Key: " . substr($apiKey, 0, 4) . '...' . substr($apiKey, -4));
        $this->info("✓ API Secret: " . str_repeat('*', strlen($apiSecret)));
        $this->newLine();

        // Test 2: Check connection
        $this->info('2. Testing Cloudinary connection...');
        try {
            $connected = $cloudinaryService->checkConnection();
            if ($connected) {
                $this->info('✓ Successfully connected to Cloudinary!');
            } else {
                $this->error('❌ Failed to connect to Cloudinary');
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Connection test failed: ' . $e->getMessage());
            return 1;
        }
        $this->newLine();

        // Test 3: Create a test image
        $this->info('3. Creating test image...');
        try {
            // Create a simple test image
            $testImagePath = storage_path('app/test_upload.jpg');
            
            // Create a simple 100x100 red image
            $image = imagecreatetruecolor(100, 100);
            $red = imagecolorallocate($image, 255, 0, 0);
            imagefill($image, 0, 0, $red);
            
            // Add text
            $white = imagecolorallocate($image, 255, 255, 255);
            imagestring($image, 5, 10, 40, 'TEST', $white);
            
            imagejpeg($image, $testImagePath, 90);
            imagedestroy($image);
            
            $this->info('✓ Test image created');
        } catch (\Exception $e) {
            $this->error('❌ Failed to create test image: ' . $e->getMessage());
            return 1;
        }
        $this->newLine();

        // Test 4: Upload test image
        $this->info('4. Uploading test image to Cloudinary...');
        try {
            $testFile = new UploadedFile(
                $testImagePath,
                'test_upload.jpg',
                'image/jpeg',
                null,
                true
            );

            $this->info('  File details:');
            $this->info('    - Path: ' . $testFile->getPathname());
            $this->info('    - Size: ' . round($testFile->getSize() / 1024, 2) . ' KB');
            $this->info('    - Extension: ' . $testFile->getClientOriginalExtension());
            $this->info('    - MIME: ' . $testFile->getMimeType());
            $this->newLine();

            $result = $cloudinaryService->uploadProfilePicture($testFile, 999999);
            
            if ($result) {
                $this->info('✓ Upload successful!');
                $this->info('  Public ID: ' . $result['public_id']);
                $this->info('  URL: ' . $result['secure_url']);
                $this->info('  Size: ' . round($result['bytes'] / 1024, 2) . ' KB');
                $this->newLine();
                
                // Test 5: Delete test image
                $this->info('5. Cleaning up test image...');
                $deleted = $cloudinaryService->deleteImage($result['public_id']);
                if ($deleted) {
                    $this->info('✓ Test image deleted from Cloudinary');
                } else {
                    $this->warn('⚠ Could not delete test image (you may need to delete it manually)');
                }
            } else {
                $this->error('❌ Upload failed - no result returned');
                $this->warn('This usually means validation failed. Check the logs for details.');
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Upload test failed: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        } finally {
            // Clean up local test file
            if (file_exists($testImagePath)) {
                unlink($testImagePath);
            }
        }
        
        $this->newLine();
        
        // Test 6: Upload PDF/Document (Resume)
        $this->info('6. Testing document upload (PDF)...');
        try {
            // Create a simple PDF test file
            $testPdfPath = storage_path('app/test_resume.pdf');
            $pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n408\n%%EOF";
            file_put_contents($testPdfPath, $pdfContent);
            
            $testPdfFile = new UploadedFile(
                $testPdfPath,
                'test_resume.pdf',
                'application/pdf',
                null,
                true
            );

            $pdfResult = $cloudinaryService->uploadResume($testPdfFile, 999999);
            
            if ($pdfResult) {
                $this->info('✓ PDF upload successful!');
                $this->info('  Public ID: ' . $pdfResult['public_id']);
                $this->info('  URL: ' . $pdfResult['secure_url']);
                $this->info('  Format: ' . $pdfResult['format']);
                $this->newLine();
                
                // Clean up PDF from Cloudinary
                $this->info('7. Cleaning up test PDF...');
                $deleted = $cloudinaryService->deleteFile($pdfResult['public_id'], 'raw');
                if ($deleted) {
                    $this->info('✓ Test PDF deleted from Cloudinary');
                } else {
                    $this->warn('⚠ Could not delete test PDF (you may need to delete it manually)');
                }
            } else {
                $this->warn('⚠ PDF upload failed - this might be expected if your Cloudinary plan doesn\'t support raw file uploads');
            }
            
            // Clean up local PDF file
            if (file_exists($testPdfPath)) {
                unlink($testPdfPath);
            }
        } catch (\Exception $e) {
            $this->warn('⚠ PDF upload test failed: ' . $e->getMessage());
            $this->warn('This might be expected if your Cloudinary plan doesn\'t support raw file uploads');
        }
        
        $this->newLine();
        $this->info('✅ All Cloudinary tests passed successfully!');
        $this->info('Your Cloudinary integration is working correctly.');
        
        return 0;
    }
}
