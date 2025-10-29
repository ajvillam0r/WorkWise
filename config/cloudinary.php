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
    | ID Verification Settings
    |--------------------------------------------------------------------------
    |
    | Settings for ID verification image uploads (secure storage)
    |
    */
    'id_verification' => [
        'folder' => 'workwise/id_verification',
        'access_type' => 'authenticated', // Restricted access
        'allowed_formats' => ['jpg', 'jpeg', 'png', 'pdf'],
        'max_file_size' => 10485760, // 10MB in bytes
        'timeout' => 60, // Upload timeout in seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Portfolio Settings
    |--------------------------------------------------------------------------
    |
    | Settings for portfolio file uploads
    |
    */
    'portfolio' => [
        'folder' => 'workwise/portfolios',
        'allowed_formats' => ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        'max_file_size' => 10485760, // 10MB in bytes
        'transformation' => [
            'width' => 1200,
            'height' => 900,
            'crop' => 'limit',
            'quality' => 'auto',
            'format' => 'auto'
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resume Settings
    |--------------------------------------------------------------------------
    |
    | Settings for resume file uploads
    |
    */
    'resumes' => [
        'folder' => 'workwise/resumes',
        'allowed_formats' => ['pdf', 'doc', 'docx'],
        'max_file_size' => 5242880, // 5MB in bytes
    ],

    /*
    |--------------------------------------------------------------------------
    | Message Attachments Settings
    |--------------------------------------------------------------------------
    |
    | Settings for message attachment uploads
    |
    */
    'message_attachments' => [
        'folder' => 'workwise/messages',
        'allowed_formats' => ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'zip', 'rar'],
        'max_file_size' => 10485760, // 10MB in bytes
    ],
];