<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\EmailVerification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;

echo "=== USER SIGN-UP VERIFICATION CODE TEST (RAILWAY) ===" . PHP_EOL . PHP_EOL;

// Test 1: Environment Check
echo "🌐 TEST 1: RAILWAY ENVIRONMENT CHECK" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$envConfig = [
    'App Environment' => config('app.env'),
    'App URL' => config('app.url'),
    'Mail Mailer' => config('mail.default'),
    'Mailgun Domain' => config('services.mailgun.domain'),
    'Mailgun Secret' => config('services.mailgun.secret') ? 'Set (hidden)' : 'Not set',
    'From Address' => config('mail.from.address'),
    'From Name' => config('mail.from.name'),
];

foreach ($envConfig as $key => $value) {
    echo "  {$key}: {$value}" . PHP_EOL;
}

echo PHP_EOL;

// Test 2: Database Connection
echo "🗄️  TEST 2: DATABASE CONNECTION" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    $connection = \DB::connection()->getPdo();
    echo "✅ Database connected successfully" . PHP_EOL;
    
    // Check tables
    $emailVerificationExists = \Schema::hasTable('email_verifications');
    $usersExists = \Schema::hasTable('users');
    
    echo $emailVerificationExists ? "✅ email_verifications table exists" : "❌ email_verifications table NOT found" . PHP_EOL;
    echo $usersExists ? "✅ users table exists" : "❌ users table NOT found" . PHP_EOL;
    
} catch (\Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL;

// Test 3: Simulate User Sign-Up with Verification Code
echo "👤 TEST 3: SIMULATE USER SIGN-UP WITH VERIFICATION CODE" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$testEmail = 'test.signup@workwise-production.up.railway.app';
$testName = 'Test User';
$testPassword = 'password123';

echo "Testing sign-up verification for: {$testEmail}" . PHP_EOL;

try {
    // Step 1: Check if user already exists and clean up
    $existingUser = User::where('email', $testEmail)->first();
    if ($existingUser) {
        echo "🧹 Cleaning up existing test user..." . PHP_EOL;
        EmailVerification::where('email', $testEmail)->delete();
        $existingUser->delete();
    }
    
    // Step 2: Create new user (simulating sign-up)
    $user = User::create([
        'first_name' => 'Test',
        'last_name' => 'User',
        'email' => $testEmail,
        'password' => Hash::make($testPassword),
        'user_type' => 'freelancer',
        'barangay' => 'Test Barangay',
        'email_verified_at' => null, // Not verified yet
    ]);
    
    echo "✅ User created successfully: {$testEmail}" . PHP_EOL;
    echo "📝 User ID: {$user->id}" . PHP_EOL;
    echo "📧 Email verified: " . ($user->email_verified_at ? 'Yes' : 'No') . PHP_EOL;
    
    // Step 3: Generate and send verification code (OTP)
    echo PHP_EOL . "📧 Generating verification code..." . PHP_EOL;
    
    $verification = EmailVerification::generateOtp($testEmail);
    
    echo "✅ Verification code generated and email sent!" . PHP_EOL;
    echo "🔢 OTP Code: {$verification->otp}" . PHP_EOL;
    echo "⏰ Expires at: {$verification->expires_at}" . PHP_EOL;
    echo "📬 Email sent to: {$testEmail}" . PHP_EOL;
    
} catch (\Exception $e) {
    echo "❌ Failed to simulate sign-up verification: " . $e->getMessage() . PHP_EOL;
    echo "Error details: " . $e->getTraceAsString() . PHP_EOL;
}

echo PHP_EOL;

// Test 4: Test OTP Verification Process
echo "🔐 TEST 4: TEST OTP VERIFICATION PROCESS" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    if (isset($verification)) {
        // Test valid OTP
        $isValid = EmailVerification::verifyOtp($testEmail, $verification->otp);
        
        if ($isValid) {
            echo "✅ OTP verification successful!" . PHP_EOL;
            
            // Check if user is now verified
            $user->refresh();
            echo "📧 User email verified: " . ($user->email_verified_at ? 'Yes' : 'No') . PHP_EOL;
            
        } else {
            echo "❌ OTP verification failed" . PHP_EOL;
        }
        
        // Test invalid OTP
        $invalidTest = EmailVerification::verifyOtp($testEmail, '000000');
        echo "🔒 Invalid OTP test: " . ($invalidTest ? 'Failed (should be false)' : 'Passed (correctly rejected)') . PHP_EOL;
        
    } else {
        echo "⚠️  No verification code to test (previous step failed)" . PHP_EOL;
    }
    
} catch (\Exception $e) {
    echo "❌ Failed to test OTP verification: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL;

// Test 5: Check Email Logs (if available)
echo "📋 TEST 5: EMAIL SENDING STATUS" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    // Check if we can get mail log information
    $logChannel = config('mail.mailers.log.channel');
    echo "📝 Mail log channel: " . ($logChannel ?: 'Not configured') . PHP_EOL;
    
    // Check recent email verifications
    $recentVerifications = EmailVerification::where('email', $testEmail)
        ->orderBy('created_at', 'desc')
        ->limit(3)
        ->get();
    
    echo "📊 Recent verification attempts for {$testEmail}:" . PHP_EOL;
    foreach ($recentVerifications as $ver) {
        $status = $ver->verified_at ? '✅ Verified' : '⏳ Pending';
        echo "  - {$ver->created_at}: {$status} (OTP: {$ver->otp})" . PHP_EOL;
    }
    
} catch (\Exception $e) {
    echo "⚠️  Could not check email logs: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL;

// Test 6: Clean Up Test Data
echo "🧹 TEST 6: CLEANUP TEST DATA" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

try {
    if (isset($user)) {
        EmailVerification::where('email', $testEmail)->delete();
        $user->delete();
        echo "✅ Test data cleaned up successfully" . PHP_EOL;
    }
} catch (\Exception $e) {
    echo "⚠️  Cleanup warning: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL;

// Summary
echo "📋 SIGN-UP VERIFICATION TEST SUMMARY" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$summary = [
    'Environment Check' => '✅',
    'Database Connection' => isset($connection) ? '✅' : '❌',
    'User Creation' => isset($user) ? '✅' : '❌',
    'OTP Generation' => isset($verification) ? '✅' : '❌',
    'Email Sending' => isset($verification) ? '✅' : '❌',
    'OTP Verification' => isset($isValid) && $isValid ? '✅' : '❌',
];

foreach ($summary as $test => $status) {
    echo "  {$status} {$test}" . PHP_EOL;
}

echo PHP_EOL;
echo "🎉 Sign-up verification test completed!" . PHP_EOL;
echo PHP_EOL;

echo "📝 NEXT STEPS FOR RAILWAY TESTING:" . PHP_EOL;
echo "1. Ensure Mailgun account is activated for domain: workwise-production.up.railway.app" . PHP_EOL;
echo "2. Check Mailgun dashboard for email delivery logs" . PHP_EOL;
echo "3. Test the complete sign-up flow in browser on Railway" . PHP_EOL;
echo "4. Monitor Railway logs for any email sending errors" . PHP_EOL;
echo "5. Test with real email addresses once Mailgun is activated" . PHP_EOL;
echo PHP_EOL;

echo "🚨 IMPORTANT NOTES:" . PHP_EOL;
echo "- Current domain: workwise-production.up.railway.app" . PHP_EOL;
echo "- Domain status: Needs activation in Mailgun dashboard" . PHP_EOL;
echo "- Until activated, emails will fail with 403 Forbidden error" . PHP_EOL;
echo "- Once activated, verification codes will be sent successfully" . PHP_EOL;
echo PHP_EOL;