<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Services\FraudDetectionService;

echo "=== FRAUD DETECTION TEST ===" . PHP_EOL . PHP_EOL;

// Get test user
$user = User::where('user_type', 'employer')->first();
if (!$user) {
    $user = User::first();
}

if (!$user) {
    echo "❌ No users found in database!" . PHP_EOL;
    exit(1);
}

echo "Testing with user: " . $user->full_name . " (" . $user->email . ")" . PHP_EOL;
echo "User Type: " . $user->user_type . PHP_EOL;
echo PHP_EOL;

// Initialize fraud detection service
$service = new FraudDetectionService();

// Analyze user
echo "🔍 Analyzing user for fraud..." . PHP_EOL;
$analysis = $service->analyzeUserFraud($user);

echo PHP_EOL;
echo "📊 FRAUD ANALYSIS RESULTS" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

// Overall risk score
echo PHP_EOL;
echo "Overall Risk Score: " . number_format($analysis['overall_risk_score'], 2) . "/100" . PHP_EOL;

// Risk level
echo "Risk Level: ";
if ($analysis['overall_risk_score'] >= 90) {
    echo "🔴 CRITICAL" . PHP_EOL;
} elseif ($analysis['overall_risk_score'] >= 70) {
    echo "🟠 HIGH" . PHP_EOL;
} elseif ($analysis['overall_risk_score'] >= 50) {
    echo "🟡 MEDIUM" . PHP_EOL;
} elseif ($analysis['overall_risk_score'] >= 30) {
    echo "⚠️  LOW" . PHP_EOL;
} else {
    echo "✅ MINIMAL" . PHP_EOL;
}

// Risk factors breakdown
echo PHP_EOL;
echo "Risk Factors Breakdown:" . PHP_EOL;
echo str_repeat("-", 50) . PHP_EOL;
foreach ($analysis['risk_factors'] as $factorName => $factor) {
    $displayName = str_replace('_', ' ', ucwords($factorName, '_'));
    echo PHP_EOL;
    echo "  📌 {$displayName}: " . number_format($factor['risk_score'], 2) . "/100" . PHP_EOL;
    
    if (!empty($factor['indicators'])) {
        foreach ($factor['indicators'] as $indicator) {
            echo "     ⚠️  {$indicator}" . PHP_EOL;
        }
    } else {
        echo "     ✅ No issues detected" . PHP_EOL;
    }
    
    if (!empty($factor['data'])) {
        echo "     Data: " . json_encode($factor['data']) . PHP_EOL;
    }
}

// Fraud indicators
echo PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;
echo "Fraud Indicators:" . PHP_EOL;
if (empty($analysis['fraud_indicators'])) {
    echo "  ✅ None detected (clean account)" . PHP_EOL;
} else {
    foreach ($analysis['fraud_indicators'] as $indicator) {
        echo "  ⚠️  {$indicator}" . PHP_EOL;
    }
}

// Recommendations
echo PHP_EOL;
echo "Recommendations:" . PHP_EOL;
foreach ($analysis['recommendations'] as $recommendation) {
    echo "  • {$recommendation}" . PHP_EOL;
}

// Get fraud statistics
echo PHP_EOL . PHP_EOL;
echo "=== FRAUD DETECTION STATISTICS ===" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$stats = $service->getFraudStatistics();
echo "Total Cases: " . $stats['total_cases'] . PHP_EOL;
echo "Active Cases: " . $stats['active_cases'] . PHP_EOL;
echo "Resolved Cases: " . $stats['resolved_cases'] . PHP_EOL;
echo "Critical Cases: " . $stats['critical_cases'] . PHP_EOL;
echo "Average Risk Score: " . number_format($stats['avg_risk_score'], 2) . PHP_EOL;
echo "Total Financial Impact: ₱" . number_format($stats['total_financial_impact'], 2) . PHP_EOL;
echo "Recent Alerts (24h): " . $stats['recent_alerts'] . PHP_EOL;
echo "False Positives: " . $stats['false_positives'] . PHP_EOL;

// Check fraud detection rules
echo PHP_EOL . PHP_EOL;
echo "=== ACTIVE FRAUD DETECTION RULES ===" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

$rules = \App\Models\FraudDetectionRule::where('enabled', true)
    ->orderBy('priority', 'asc')
    ->get();

echo "Total Active Rules: " . $rules->count() . PHP_EOL . PHP_EOL;

foreach ($rules as $rule) {
    echo "  🛡️  {$rule->rule_name}" . PHP_EOL;
    echo "     Type: {$rule->rule_type}" . PHP_EOL;
    echo "     Risk Score: {$rule->risk_score}" . PHP_EOL;
    echo "     Severity: {$rule->severity}" . PHP_EOL;
    echo "     Priority: {$rule->priority}" . PHP_EOL;
    echo "     Triggers: {$rule->trigger_count}" . PHP_EOL;
    echo PHP_EOL;
}

echo PHP_EOL;
echo "✅ Fraud detection test completed successfully!" . PHP_EOL;
