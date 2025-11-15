<?php

/**
 * Email Verification Test Script
 * 
 * This script tests the email verification functionality
 * by sending a verification email to a test user.
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

echo "=== Email Verification Test ===\n\n";

// Display current mail configuration
echo "Mail Configuration:\n";
echo "- Mailer: " . Config::get('mail.default') . "\n";
echo "- Host: " . Config::get('mail.mailers.smtp.host') . "\n";
echo "- Port: " . Config::get('mail.mailers.smtp.port') . "\n";
echo "- Username: " . Config::get('mail.mailers.smtp.username') . "\n";
echo "- Encryption: " . Config::get('mail.mailers.smtp.encryption') . "\n";
echo "- From Address: " . Config::get('mail.from.address') . "\n";
echo "- From Name: " . Config::get('mail.from.name') . "\n\n";

// Find a user without email verification
$user = User::whereNull('email_verified_at')->first();

if (!$user) {
    echo "❌ No unverified users found in the database.\n";
    echo "Creating a test user...\n\n";
    
    // Create a test user
    $user = User::create([
        'first_name' => 'Test',
        'last_name' => 'User',
        'email' => 'test.verification@example.com',
        'password' => bcrypt('password123'),
        'user_type' => 'gig_worker',
        'country' => 'Philippines',
    ]);
    
    echo "✓ Test user created: {$user->email}\n\n";
}

echo "Testing with user:\n";
echo "- ID: {$user->id}\n";
echo "- Name: {$user->first_name} {$user->last_name}\n";
echo "- Email: {$user->email}\n";
echo "- Email Verified: " . ($user->email_verified_at ? 'Yes' : 'No') . "\n\n";

// Test email sending
echo "Attempting to send verification email...\n";

try {
    // Send the verification notification
    $user->sendEmailVerificationNotification();
    
    echo "✓ Email verification notification sent successfully!\n\n";
    
    echo "Next steps:\n";
    echo "1. Check the email inbox for: {$user->email}\n";
    echo "2. Look for an email from: " . Config::get('mail.from.address') . "\n";
    echo "3. Click the verification link in the email\n";
    echo "4. The link should verify the email and redirect to the dashboard\n\n";
    
    echo "Note: If using Gmail, check:\n";
    echo "- Spam/Junk folder\n";
    echo "- Gmail's 'All Mail' folder\n";
    echo "- Make sure 2FA is enabled and you're using an App Password\n\n";
    
} catch (\Exception $e) {
    echo "❌ Error sending email: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n\n";
    
    echo "Troubleshooting tips:\n";
    echo "1. Verify Gmail SMTP credentials in .env file\n";
    echo "2. Ensure you're using an App Password (not your regular Gmail password)\n";
    echo "3. Check if 2-Factor Authentication is enabled on your Gmail account\n";
    echo "4. Verify firewall/antivirus isn't blocking port 587\n";
    echo "5. Try running: php artisan config:clear\n";
}

echo "\n=== Test Complete ===\n";
