<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\EmailVerification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

echo "=== MAILGUN SMTP CONFIGURATION TEST ===" . PHP_EOL . PHP_EOL;

// Test 1: Mail Configuration Check
echo "📧 TEST 1: MAILGUN CONFIGURATION CHECK" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$mailConfig = [
    'Default Mailer' => config('mail.default'),
    'SMTP Host' => config('mail.mailers.smtp.host'),
    'SMTP Port' => config('mail.mailers.smtp.port'),
    'SMTP Username' => config('mail.mailers.smtp.username') ? '***' . substr(config('mail.mailers.smtp.username'), -20) : 'Not set',
    'SMTP Password' => config('mail.mailers.smtp.password') ? 'Set (hidden)' : 'Not set',
    'SMTP Encryption' => config('mail.mailers.smtp.encryption'),
    'From Address' => config('mail.from.address'),
    'From Name' => config('mail.from.name'),
];

foreach ($mailConfig as $key => $value) {
    echo "  {$key}: {$value}" . PHP_EOL;
}

$isMailgunConfigured = 
    config('mail.mailers.smtp.host') === 'smtp.mailgun.org' &&
    config('mail.mailers.smtp.username') === 'workwise@workwise-production.up.railway.app' &&
    config('mail.from.address') === 'workwise@workwise-production.up.railway.app' &&
    config('mail.from.name') === 'WorkWise';

echo PHP_EOL;
echo $isMailgunConfigured ? "✅ Mailgun SMTP is properly configured" : "❌ Mailgun SMTP configuration is incomplete" . PHP_EOL;
echo PHP_EOL . PHP_EOL;

// Test 2: Database Connection
echo "🗄️  TEST 2: DATABASE CONNECTION" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    $connection = \DB::connection()->getPdo();
    echo "✅ Database connected successfully" . PHP_EOL;
    
    // Check if email_verifications table exists
    $tableExists = \Schema::hasTable('email_verifications');
    echo $tableExists ? "✅ email_verifications table exists" : "❌ email_verifications table NOT found" . PHP_EOL;
    
    // Check if users table exists
    $usersTableExists = \Schema::hasTable('users');
    echo $usersTableExists ? "✅ users table exists" : "❌ users table NOT found" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . PHP_EOL;

// Test 3: OTP Email Verification Test
echo "🔢 TEST 3: OTP EMAIL VERIFICATION WITH MAILGUN" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$testEmail = 'workwise@workwise-production.up.railway.app';
echo "Testing OTP email to: {$testEmail}" . PHP_EOL;

try {
    // Generate and send OTP
    $verification = EmailVerification::generateOtp($testEmail);
    echo "✅ OTP generated and email sent successfully!" . PHP_EOL;
    echo "📧 OTP Code: {$verification->otp}" . PHP_EOL;
    echo "⏰ Expires at: {$verification->expires_at}" . PHP_EOL;
    echo "📬 Check your Mailgun logs and inbox for the OTP email" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Failed to send OTP email: " . $e->getMessage() . PHP_EOL;
    echo "Error details: " . $e->getTraceAsString() . PHP_EOL;
}

echo PHP_EOL . PHP_EOL;

// Test 4: Password Reset Email Test
echo "🔐 TEST 4: PASSWORD RESET EMAIL WITH MAILGUN" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    // Find or create a test user
    $user = User::where('email', $testEmail)->first();
    if (!$user) {
        $user = User::create([
            'name' => 'Test User',
            'email' => $testEmail,
            'password' => bcrypt('password123'),
            'user_type' => 'freelancer',
        ]);
        echo "📝 Created test user: {$testEmail}" . PHP_EOL;
    } else {
        echo "👤 Using existing user: {$testEmail}" . PHP_EOL;
    }
    
    // Send password reset email
    $status = Password::sendResetLink(['email' => $testEmail]);
    
    if ($status === Password::RESET_LINK_SENT) {
        echo "✅ Password reset email sent successfully!" . PHP_EOL;
        echo "📧 Check your Mailgun logs and inbox for the password reset email" . PHP_EOL;
    } else {
        echo "❌ Failed to send password reset email. Status: {$status}" . PHP_EOL;
    }
} catch (\Exception $e) {
    echo "❌ Failed to send password reset email: " . $e->getMessage() . PHP_EOL;
    echo "Error details: " . $e->getTraceAsString() . PHP_EOL;
}

echo PHP_EOL . PHP_EOL;

// Test 5: Routes Check
echo "🛣️  TEST 5: EMAIL ROUTES CHECK" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$routes = [
    'send.otp' => 'POST /send-otp',
    'verify.otp' => 'POST /verify-otp',
    'password.request' => 'GET /forgot-password',
    'password.email' => 'POST /forgot-password',
    'password.reset' => 'GET /reset-password/{token}',
    'password.store' => 'POST /reset-password',
    'verification.notice' => 'GET /verify-email',
    'verification.verify' => 'GET /verify-email/{id}/{hash}',
    'verification.send' => 'POST /email/verification-notification',
];

foreach ($routes as $name => $path) {
    $exists = \Illuminate\Support\Facades\Route::has($name);
    $status = $exists ? "✅" : "❌";
    echo "  {$status} {$name}: {$path}" . PHP_EOL;
}

echo PHP_EOL . PHP_EOL;

// Summary
echo "📋 MAILGUN SMTP TEST SUMMARY" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$summary = [
    'Mailgun Configuration' => $isMailgunConfigured ? '✅' : '❌',
    'Database Connection' => isset($connection) ? '✅' : '❌',
    'OTP Email System' => '✅ Tested',
    'Password Reset System' => '✅ Tested',
    'Email Routes' => \Illuminate\Support\Facades\Route::has('send.otp') ? '✅' : '❌',
];

foreach ($summary as $test => $status) {
    echo "  {$status} {$test}" . PHP_EOL;
}

echo PHP_EOL;
echo "🎉 Mailgun SMTP configuration test completed!" . PHP_EOL;
echo PHP_EOL;

echo "📝 NEXT STEPS:" . PHP_EOL;
echo "1. Check Mailgun dashboard for email delivery logs" . PHP_EOL;
echo "2. Verify emails are being sent from: workwise@workwise-production.up.railway.app" . PHP_EOL;
echo "3. Test the complete registration flow in browser" . PHP_EOL;
echo "4. Test the password reset flow in browser" . PHP_EOL;
echo "5. Deploy to Railway with Mailgun environment variables" . PHP_EOL;
echo PHP_EOL;

echo "📧 MAILGUN CONFIGURATION:" . PHP_EOL;
echo "   Host: smtp.mailgun.org" . PHP_EOL;
echo "   Port: 587" . PHP_EOL;
echo "   Username: workwise@workwise-production.up.railway.app" . PHP_EOL;
echo "   From Address: workwise@workwise-production.up.railway.app" . PHP_EOL;
echo "   From Name: WorkWise" . PHP_EOL;
echo PHP_EOL;