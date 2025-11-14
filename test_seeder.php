<?php

/**
 * Test script to verify the CleanWorkWiseSeeder
 * Run this after seeding: php test_seeder.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\GigJob;

echo "🧪 Testing CleanWorkWiseSeeder...\n\n";

// Test 1: Check total users
echo "Test 1: Total Users\n";
$totalUsers = User::count();
echo "Expected: 7 (1 admin + 3 gig workers + 3 employers)\n";
echo "Actual: $totalUsers\n";
echo $totalUsers === 7 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 2: Check gig workers
echo "Test 2: Gig Workers\n";
$gigWorkers = User::where('user_type', 'gig_worker')->count();
echo "Expected: 3\n";
echo "Actual: $gigWorkers\n";
echo $gigWorkers === 3 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 3: Check employers
echo "Test 3: Employers\n";
$employers = User::where('user_type', 'employer')->count();
echo "Expected: 3\n";
echo "Actual: $employers\n";
echo $employers === 3 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 4: Check admin
echo "Test 4: Admin User\n";
$admin = User::where('is_admin', true)->count();
echo "Expected: 1\n";
echo "Actual: $admin\n";
echo $admin === 1 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 5: Check jobs
echo "Test 5: Total Jobs\n";
$totalJobs = GigJob::count();
echo "Expected: 6\n";
echo "Actual: $totalJobs\n";
echo $totalJobs === 6 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 6: Check email verification
echo "Test 6: Email Verification\n";
$verifiedUsers = User::whereNotNull('email_verified_at')->count();
echo "Expected: 7 (all users)\n";
echo "Actual: $verifiedUsers\n";
echo $verifiedUsers === 7 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 7: Check profile completion
echo "Test 7: Profile Completion\n";
$completedProfiles = User::where('profile_completed', true)->count();
echo "Expected: 6 (all except admin)\n";
echo "Actual: $completedProfiles\n";
echo $completedProfiles >= 6 ? "✅ PASS\n\n" : "❌ FAIL\n\n";

// Test 8: Check specific gig workers
echo "Test 8: Specific Gig Workers\n";
$carlos = User::where('email', 'carlos.dev@workwise.ph')->first();
$maria = User::where('email', 'maria.design@workwise.ph')->first();
$juan = User::where('email', 'juan.writer@workwise.ph')->first();

if ($carlos && $maria && $juan) {
    echo "✅ All gig workers found\n";
    echo "  - Carlos: {$carlos->professional_title} (₱{$carlos->hourly_rate}/hr)\n";
    echo "  - Maria: {$maria->professional_title} (₱{$maria->hourly_rate}/hr)\n";
    echo "  - Juan: {$juan->professional_title} (₱{$juan->hourly_rate}/hr)\n\n";
} else {
    echo "❌ FAIL - Some gig workers not found\n\n";
}

// Test 9: Check specific employers
echo "Test 9: Specific Employers\n";
$tech = User::where('email', 'tech.startup@workwise.ph')->first();
$creative = User::where('email', 'creative.agency@workwise.ph')->first();
$ecommerce = User::where('email', 'ecommerce.business@workwise.ph')->first();

if ($tech && $creative && $ecommerce) {
    echo "✅ All employers found\n";
    echo "  - {$tech->company_name} (₱{$tech->escrow_balance} balance)\n";
    echo "  - {$creative->company_name} (₱{$creative->escrow_balance} balance)\n";
    echo "  - {$ecommerce->company_name} (₱{$ecommerce->escrow_balance} balance)\n\n";
} else {
    echo "❌ FAIL - Some employers not found\n\n";
}

// Test 10: Check skills
echo "Test 10: Skills Data\n";
if ($carlos) {
    $skillsCount = count($carlos->skills_with_experience ?? []);
    echo "Carlos has $skillsCount skills\n";
    echo $skillsCount > 0 ? "✅ PASS\n\n" : "❌ FAIL\n\n";
} else {
    echo "❌ FAIL - Carlos not found\n\n";
}

// Test 11: Check jobs per employer
echo "Test 11: Jobs Per Employer\n";
if ($tech && $creative && $ecommerce) {
    $techJobs = GigJob::where('employer_id', $tech->id)->count();
    $creativeJobs = GigJob::where('employer_id', $creative->id)->count();
    $ecommerceJobs = GigJob::where('employer_id', $ecommerce->id)->count();
    
    echo "InnovateTech: $techJobs jobs\n";
    echo "Creative Minds: $creativeJobs jobs\n";
    echo "ShopPH: $ecommerceJobs jobs\n";
    
    $allHaveJobs = $techJobs === 2 && $creativeJobs === 2 && $ecommerceJobs === 2;
    echo $allHaveJobs ? "✅ PASS\n\n" : "❌ FAIL\n\n";
} else {
    echo "❌ FAIL - Employers not found\n\n";
}

// Test 12: Check job details
echo "Test 12: Job Details\n";
$jobWithSkills = GigJob::whereNotNull('required_skills')->first();
if ($jobWithSkills) {
    $skillsCount = count($jobWithSkills->required_skills ?? []);
    echo "Sample job has $skillsCount required skills\n";
    echo $skillsCount > 0 ? "✅ PASS\n\n" : "❌ FAIL\n\n";
} else {
    echo "❌ FAIL - No jobs with skills found\n\n";
}

// Summary
echo "═══════════════════════════════════════\n";
echo "📊 Test Summary\n";
echo "═══════════════════════════════════════\n\n";

echo "✅ Test Accounts:\n";
echo "   Admin: admin@workwise.com (password)\n";
echo "   Gig Workers: carlos.dev@workwise.ph, maria.design@workwise.ph, juan.writer@workwise.ph (password123)\n";
echo "   Employers: tech.startup@workwise.ph, creative.agency@workwise.ph, ecommerce.business@workwise.ph (password123)\n\n";

echo "📈 Data Created:\n";
echo "   Users: $totalUsers\n";
echo "   Gig Workers: $gigWorkers\n";
echo "   Employers: $employers\n";
echo "   Jobs: $totalJobs\n\n";

echo "🎉 Seeder test complete!\n";
