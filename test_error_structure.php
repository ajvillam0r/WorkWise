<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing error structure from withErrors...\n";

// Simulate what happens when we use withErrors
$errors = [
    'error' => 'Insufficient escrow balance to accept this proposal.',
    'error_type' => 'insufficient_escrow',
    'required_amount' => 110506.00, // ₱110,506.00
    'current_balance' => 100.00 // ₱100.00
];

echo "Error data structure:\n";
print_r($errors);

// Check how this would be handled in Inertia
echo "\nIn Inertia, withErrors() creates validation errors, not flash data.\n";
echo "The errors would be available in page.props.errors, not page.props.flash\n";
echo "So we need to check both onError callback AND page.props.errors in onSuccess\n";