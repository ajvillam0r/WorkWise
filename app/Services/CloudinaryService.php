<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Transformation\Resize;
use Cloudinary\Transformation\Gravity;
use Cloudinary\Transformation\Quality;
use Cloudinary\Transformation\Format;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Exception;

class CloudinaryService
{
    protected $cloudinary;
    protected $config;
    protected $maxRetries = 2; // Reduced from 3 to 2 to avoid timeout
    protected $retryDelay = 500000; // Reduced from 1 second to 0.5 seconds

    public function __construct()
    {
        $this->config = config('cloudinary');
        
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $this->config['cloud_name'],
                'api_key' => $this->config['api_key'],
                'api_secret' => $this->config['api_secret'],
                'secure' => $this->config['secure']
            ]
        ]);
    }

    /**
     * Check if Cloudinary connection is working
     *
     * @return bool
     */
    public function checkConnection(): bool
    {
        try {
            // Try to list resources as a simple connection test
            $this->cloudinary->adminApi()->ping();
            return true;
        } catch (Exception $e) {
            Log::error('Cloudinary connection check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Upload with retry logic
     *
     * @param callable $uploadFunction
     * @param string $context
     * @return array|null
     */
    protected function uploadWithRetry(callable $uploadFunction, string $context): ?array
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                $attempts++;
                Log::info("Cloudinary upload attempt {$attempts}/{$this->maxRetries}", ['context' => $context]);
                
                $result = $uploadFunction();
                
                if ($result) {
                    if ($attempts > 1) {
                        Log::info("Cloudinary upload succeeded after {$attempts} attempts", ['context' => $context]);
                    }
                    return $result;
                }
            } catch (Exception $e) {
                $lastException = $e;
                Log::warning("Cloudinary upload attempt {$attempts} failed", [
                    'context' => $context,
                    'error' => $e->getMessage(),
                    'attempt' => $attempts
                ]);

                if ($attempts < $this->maxRetries) {
                    // Linear backoff instead of exponential to avoid long waits
                    $delay = $this->retryDelay * $attempts;
                    usleep($delay);
                }
            }
        }

        Log::error('Cloudinary upload failed after all retries', [
            'context' => $context,
            'attempts' => $attempts,
            'last_error' => $lastException ? $lastException->getMessage() : 'Unknown'
        ]);

        return null;
    }

    /**
     * Upload profile picture to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $userId
     * @return array|null
     */
    public function uploadProfilePicture(UploadedFile $file, int $userId): ?array
    {
        // Validate file first
        if (!$this->validateProfilePicture($file)) {
            return null;
        }

        $publicId = "workwise/profile_pictures/user_{$userId}_" . time();

        return $this->uploadWithRetry(function() use ($file, $publicId) {
            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'public_id' => $publicId,
                    'folder' => $this->config['profile_pictures']['folder'],
                    'transformation' => [
                        'width' => $this->config['profile_pictures']['transformation']['width'],
                        'height' => $this->config['profile_pictures']['transformation']['height'],
                        'crop' => $this->config['profile_pictures']['transformation']['crop'],
                        'gravity' => $this->config['profile_pictures']['transformation']['gravity'],
                        'quality' => $this->config['profile_pictures']['transformation']['quality'],
                        'format' => $this->config['profile_pictures']['transformation']['format']
                    ],
                    'allowed_formats' => $this->config['profile_pictures']['allowed_formats'],
                    'timeout' => 30 // Reduced from 60 to 30 seconds to prevent PHP timeout
                ]
            );

            return [
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'url' => $result['url'],
                'width' => $result['width'],
                'height' => $result['height'],
                'format' => $result['format'],
                'bytes' => $result['bytes']
            ];
        }, "profile_picture_user_{$userId}");
    }

    /**
     * Delete image from Cloudinary
     *
     * @param string $publicId
     * @return bool
     */
    public function deleteImage(string $publicId): bool
    {
        try {
            $result = $this->cloudinary->uploadApi()->destroy($publicId);
            return $result['result'] === 'ok';
        } catch (Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get optimized URL for profile picture
     *
     * @param string $publicId
     * @param int $width
     * @param int $height
     * @return string
     */
    public function getOptimizedUrl(string $publicId, int $width = 300, int $height = 300): string
    {
        try {
            return $this->cloudinary->image($publicId)
                ->resize(Resize::fill($width, $height)->gravity(Gravity::face()))
                ->quality(Quality::auto())
                ->format(Format::auto())
                ->toUrl();
        } catch (Exception $e) {
            Log::error('Cloudinary URL generation failed: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Validate profile picture file
     *
     * @param UploadedFile $file
     * @return bool
     */
    private function validateProfilePicture(UploadedFile $file): bool
    {
        // Check file size
        if ($file->getSize() > $this->config['profile_pictures']['max_file_size']) {
            Log::warning('File size exceeds limit: ' . $file->getSize());
            return false;
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $this->config['profile_pictures']['allowed_formats'])) {
            Log::warning('Invalid file format: ' . $extension);
            return false;
        }

        // Check if file is actually an image
        if (!getimagesize($file->getPathname())) {
            Log::warning('File is not a valid image');
            return false;
        }

        return true;
    }

    /**
     * Extract public ID from Cloudinary URL
     *
     * @param string $url
     * @return string|null
     */
    public function extractPublicId(string $url): ?string
    {
        try {
            // Parse Cloudinary URL to extract public_id
            $pattern = '/\/v\d+\/(.+)\.[a-zA-Z]+$/';
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
            return null;
        } catch (Exception $e) {
            Log::error('Failed to extract public ID: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get image info from Cloudinary
     *
     * @param string $publicId
     * @return array|null
     */
    public function getImageInfo(string $publicId): ?array
    {
        try {
            $result = $this->cloudinary->adminApi()->asset($publicId);
            return [
                'public_id' => $result['public_id'],
                'format' => $result['format'],
                'width' => $result['width'],
                'height' => $result['height'],
                'bytes' => $result['bytes'],
                'created_at' => $result['created_at'],
                'secure_url' => $result['secure_url']
            ];
        } catch (Exception $e) {
            Log::error('Failed to get image info: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload ID verification image to Cloudinary (secure authenticated folder)
     *
     * @param UploadedFile $file
     * @param int $userId
     * @param string $side ('front' or 'back')
     * @return array|null
     */
    public function uploadIdVerification(UploadedFile $file, int $userId, string $side): ?array
    {
        try {
            // Validate file
            if (!$this->validateFile($file, $this->config['id_verification'])) {
                return null;
            }

            $publicId = "workwise/id_verification/user_{$userId}_id_{$side}_" . time();

            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'public_id' => $publicId,
                    'folder' => $this->config['id_verification']['folder'],
                    'type' => 'authenticated', // Secure access
                    'allowed_formats' => $this->config['id_verification']['allowed_formats'],
                    'resource_type' => 'auto',
                    'timeout' => 30 // Reduced from 60 to 30 seconds to prevent PHP timeout
                ]
            );

            return [
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'url' => $result['url'],
                'format' => $result['format'],
                'bytes' => $result['bytes'],
                'resource_type' => $result['resource_type']
            ];

        } catch (Exception $e) {
            Log::error('ID verification upload failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'user_id' => $userId,
                'side' => $side
            ]);
            return null;
        }
    }

    /**
     * Upload portfolio item to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $userId
     * @param int $index
     * @return array|null
     */
    public function uploadPortfolioItem(UploadedFile $file, int $userId, int $index): ?array
    {
        try {
            // Validate file
            if (!$this->validateFile($file, $this->config['portfolio'])) {
                return null;
            }

            $publicId = "workwise/portfolios/user_{$userId}_portfolio_{$index}_" . time();

            $uploadOptions = [
                'public_id' => $publicId,
                'folder' => $this->config['portfolio']['folder'],
                'allowed_formats' => $this->config['portfolio']['allowed_formats'],
                'resource_type' => 'auto'
            ];

            // Apply transformation only for images
            $extension = strtolower($file->getClientOriginalExtension());
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                $uploadOptions['transformation'] = [
                    'width' => $this->config['portfolio']['transformation']['width'],
                    'height' => $this->config['portfolio']['transformation']['height'],
                    'crop' => $this->config['portfolio']['transformation']['crop'],
                    'quality' => $this->config['portfolio']['transformation']['quality'],
                    'format' => $this->config['portfolio']['transformation']['format']
                ];
            }

            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                $uploadOptions
            );

            return [
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'url' => $result['url'],
                'format' => $result['format'],
                'bytes' => $result['bytes'],
                'resource_type' => $result['resource_type']
            ];

        } catch (Exception $e) {
            Log::error('Portfolio upload failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'user_id' => $userId,
                'item_index' => $itemIndex
            ]);
            return null;
        }
    }

    /**
     * Upload resume to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $userId
     * @return array|null
     */
    public function uploadResume(UploadedFile $file, int $userId): ?array
    {
        try {
            // Validate file
            if (!$this->validateFile($file, $this->config['resumes'])) {
                return null;
            }

            $publicId = "workwise/resumes/user_{$userId}_resume_" . time();

            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'public_id' => $publicId,
                    'folder' => $this->config['resumes']['folder'],
                    'allowed_formats' => $this->config['resumes']['allowed_formats'],
                    'resource_type' => 'auto'
                ]
            );

            return [
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'url' => $result['url'],
                'format' => $result['format'],
                'bytes' => $result['bytes'],
                'resource_type' => $result['resource_type']
            ];

        } catch (Exception $e) {
            Log::error('Resume upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload message attachment to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $userId
     * @param int|null $messageId
     * @return array|null
     */
    public function uploadMessageAttachment(UploadedFile $file, int $userId, ?int $messageId = null): ?array
    {
        try {
            // Validate file
            if (!$this->validateFile($file, $this->config['message_attachments'])) {
                return null;
            }

            $messageIdStr = $messageId ? "_{$messageId}" : '';
            $publicId = "workwise/messages/user_{$userId}_message{$messageIdStr}_" . time();

            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'public_id' => $publicId,
                    'folder' => $this->config['message_attachments']['folder'],
                    'allowed_formats' => $this->config['message_attachments']['allowed_formats'],
                    'resource_type' => 'auto'
                ]
            );

            return [
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'url' => $result['url'],
                'format' => $result['format'],
                'bytes' => $result['bytes'],
                'resource_type' => $result['resource_type'],
                'original_filename' => $file->getClientOriginalName()
            ];

        } catch (Exception $e) {
            Log::error('Message attachment upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generic file validation method
     *
     * @param UploadedFile $file
     * @param array $config
     * @return bool
     */
    private function validateFile(UploadedFile $file, array $config): bool
    {
        // Check file size
        if ($file->getSize() > $config['max_file_size']) {
            Log::warning('File size exceeds limit: ' . $file->getSize() . ' > ' . $config['max_file_size']);
            return false;
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $config['allowed_formats'])) {
            Log::warning('Invalid file format: ' . $extension);
            return false;
        }

        // Additional validation for image files
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            if (!getimagesize($file->getPathname())) {
                Log::warning('File is not a valid image');
                return false;
            }
        }

        return true;
    }

    /**
     * Delete file from Cloudinary (generic for all resource types)
     *
     * @param string $publicId
     * @param string $resourceType ('image', 'raw', 'video', 'auto')
     * @return bool
     */
    public function deleteFile(string $publicId, string $resourceType = 'image'): bool
    {
        try {
            $result = $this->cloudinary->uploadApi()->destroy($publicId, [
                'resource_type' => $resourceType
            ]);
            return $result['result'] === 'ok';
        } catch (Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }
}