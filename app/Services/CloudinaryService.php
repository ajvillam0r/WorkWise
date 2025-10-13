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
     * Upload profile picture to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $userId
     * @return array|null
     */
    public function uploadProfilePicture(UploadedFile $file, int $userId): ?array
    {
        try {
            // Validate file
            if (!$this->validateProfilePicture($file)) {
                return null;
            }

            $publicId = "workwise/profile_pictures/user_{$userId}_" . time();

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
                    'allowed_formats' => $this->config['profile_pictures']['allowed_formats']
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

        } catch (Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage());
            return null;
        }
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
}