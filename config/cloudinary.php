<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for Cloudinary cloud storage.
    | You can configure your cloud name, API key, and API secret here.
    |
    */

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'secure' => env('CLOUDINARY_SECURE', true),
    'url' => env('CLOUDINARY_URL'),

    /*
    |--------------------------------------------------------------------------
    | Upload Settings
    |--------------------------------------------------------------------------
    |
    | Default settings for file uploads
    |
    */
    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),
    'folder' => env('CLOUDINARY_FOLDER', 'workwise'),
    
    /*
    |--------------------------------------------------------------------------
    | Profile Picture Settings
    |--------------------------------------------------------------------------
    |
    | Settings specific to profile picture uploads
    |
    */
    'profile_pictures' => [
        'folder' => 'workwise/profile_pictures',
        'transformation' => [
            'width' => 300,
            'height' => 300,
            'crop' => 'fill',
            'gravity' => 'face',
            'quality' => 'auto',
            'format' => 'auto'
        ],
        'allowed_formats' => ['jpg', 'jpeg', 'png', 'webp'],
        'max_file_size' => 5000000, // 5MB in bytes
    ],

    /*
    |--------------------------------------------------------------------------
    | Portfolio Image Settings
    |--------------------------------------------------------------------------
    |
    | Settings specific to portfolio image uploads
    |
    */
    'portfolio_images' => [
        'folder' => 'workwise/portfolio_images',
        'transformation' => [
            'width' => 800,
            'height' => 600,
            'crop' => 'fill',
            'quality' => 'auto',
            'format' => 'auto'
        ],
        'allowed_formats' => ['jpg', 'jpeg', 'png', 'webp'],
        'max_file_size' => 10000000, // 10MB in bytes
    ],
];