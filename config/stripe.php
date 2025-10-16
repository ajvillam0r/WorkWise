<?php

return [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'currency' => env('STRIPE_CURRENCY', 'usd'),
    
    // Stripe Identity Configuration
    'identity' => [
        'webhook_secret' => env('STRIPE_IDENTITY_WEBHOOK_SECRET'),
        'return_url' => env('STRIPE_IDENTITY_RETURN_URL', env('APP_URL') . '/identity/verify/return'),
    ],
];