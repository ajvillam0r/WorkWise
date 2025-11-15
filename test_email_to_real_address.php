<?php

/**
 * Real Email Verification Test
 * 
 * This script sends a verification email to your actual Gmail address
 * to verify the complete email flow.
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Config;

echo "=== Real Email Verification Test ===\n\n";

// Display current mail configuration
echo "Mail Configuration:\n";
echo "- Mailer: " . Config::get('mail.default') . "\n";
echo "- Host: " . Config::get('mail.mailers.smtp.host') . "\n";
echo "- Port: " . Config::get('mail.mailers.smtp.port') . "\n";
echo "- Username: " . Config::get('mail.mailers.smtp.username') . "\n";
echo "- From Address: " . Config::get('mail.from.address') . "\n\n";

// Find or create a user with your Gmail address
$testEmail = 'ajvillamorml@gmail.com';
$user = User::where('email', $testEmail)->first();

if (!$user) {
    echo "Creating test user with email: {$testEmail}\n\n";
    
    $user = User::create([
        'first_name' => 'Test',
        'last_name' => 'Verification',
        'email' => $testEmail,
        'password' => bcrypt('TestPassword123!'),
        'user_type' => 'gig_worker',
        'country' => 'Philippines',
    ]);
    
    echo "✓ Test user created\n\n";
} else {
    echo "Using existing user with email: {$testEmail}\n";
    
    // Reset email verification for testing
    if ($user->email_verified_at) {
        echo "Resetting email verification status for testing...\n";
        $user->email_verified_at = null;
        $user->save();
        echo "✓ Email verification reset\n\n";
    }
}

echo "User Details:\n";
echo "- ID: {$user->id}\n";
echo "- Name: {$user->first_name} {$user->last_name}\n";
echo "- Email: {$user->email}\n";
echo "- Email Verified: " . ($user->email_verified_at ? 'Yes' : 'No') . "\n\n";

// Send verification email
echo "Sending verification email to: {$user->email}\n";
echo "This may take a few seconds...\n\n";

try {
    $user->sendEmailVerificationNotification();
    
    echo "✅ SUCCESS! Verification email sent!\n\n";
    
    echo "📧 CHECK YOUR EMAIL NOW:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "1. Open Gmail: {$testEmail}\n";
    echo "2. Look for email from: " . Config::get('mail.from.address') . "\n";
    echo "3. Subject: 'Verify Email Address'\n";
    echo "4. Click the 'Verify Email Address' button\n";
    echo "5. You should be redirected to the dashboard\n\n";
    
    echo "⚠️  IMPORTANT NOTES:\n";
    echo "- Check your Spam/Junk folder if not in Inbox\n";
    echo "- The verification link expires after a certain time\n";
    echo "- You can resend the email from your profile page\n\n";
    
    echo "🔗 To test from the UI:\n";
    echo "1. Login with: {$testEmail}\n";
    echo "2. Go to Profile > Basic Info tab\n";
    echo "3. Look for 'Verification Status' section\n";
    echo "4. Click 'Verify Email' button\n\n";
    
} catch (\Exception $e) {
    echo "❌ ERROR: Failed to send email\n\n";
    echo "Error Message: " . $e->getMessage() . "\n\n";
    echo "Error Details:\n";
    echo $e->getTraceAsString() . "\n\n";
    
    echo "🔧 TROUBLESHOOTING:\n";
    echo "1. Verify .env file has correct Gmail credentials\n";
    echo "2. Ensure MAIL_MAILER=smtp (not 'log')\n";
    echo "3. Check App Password is correct (not regular password)\n";
    echo "4. Verify 2FA is enabled on Gmail account\n";
    echo "5. Run: php artisan config:clear\n";
    echo "6. Check firewall/antivirus settings\n";
}

echo "\n=== Test Complete ===\n";
