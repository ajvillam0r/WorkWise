<?php

namespace App\Services;

use App\Models\User;
use App\Models\FraudDetectionCase;
use App\Models\FraudDetectionAlert;
use App\Models\FraudDetectionRule;
use App\Models\ImmutableAuditLog;
use App\Models\UserBehaviorAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class FraudDetectionService
{
    private const FRAUD_SCORE_THRESHOLDS = [
        'minimal' => 0,
        'low' => 30,
        'medium' => 50,
        'high' => 70,
        'critical' => 90,
    ];

    /**
     * Comprehensive fraud analysis for a user
     */
    public function analyzeUserFraud(User $user, Request $request = null): array
    {
        $analysis = [
            'user_id' => $user->id,
            'overall_risk_score' => 0,
            'risk_factors' => [],
            'recommendations' => [],
            'fraud_indicators' => [],
            'behavioral_patterns' => [],
            'analyzed_at' => now(),
        ];

        // Analyze different fraud vectors
        $analysis['risk_factors']['payment_behavior'] = $this->analyzePaymentBehavior($user);
        $analysis['risk_factors']['account_behavior'] = $this->analyzeAccountBehavior($user);
        $analysis['risk_factors']['transaction_patterns'] = $this->analyzeTransactionPatterns($user);
        $analysis['risk_factors']['device_behavior'] = $this->analyzeDeviceBehavior($user, $request);
        $analysis['risk_factors']['geographic_behavior'] = $this->analyzeGeographicBehavior($user, $request);

        // Calculate overall risk score
        $analysis['overall_risk_score'] = $this->calculateOverallRiskScore($analysis['risk_factors']);

        // Generate recommendations
        $analysis['recommendations'] = $this->generateRecommendations($analysis['overall_risk_score'], $analysis['risk_factors']);

        // Identify fraud indicators
        $analysis['fraud_indicators'] = $this->identifyFraudIndicators($analysis['risk_factors']);

        return $analysis;
    }

    /**
     * Analyze payment behavior patterns
     */
    private function analyzePaymentBehavior(User $user): array
    {
        $riskScore = 0;
        $indicators = [];

        // Check for rapid successive payments
        $recentPayments = $user->paymentsMade()
            ->where('created_at', '>=', now()->subHours(1))
            ->count();

        if ($recentPayments > 5) {
            $riskScore += 40;
            $indicators[] = 'Multiple payments in short time frame';
        }

        // Check for high-value transactions
        $highValuePayments = $user->paymentsMade()
            ->where('amount', '>', 1000)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        if ($highValuePayments > 3) {
            $riskScore += 30;
            $indicators[] = 'Multiple high-value transactions';
        }

        // Check for failed payments
        $failedPayments = $user->paymentsMade()
            ->where('status', 'failed')
            ->where('created_at', '>=', now()->subDays(1))
            ->count();

        if ($failedPayments > 2) {
            $riskScore += 25;
            $indicators[] = 'Multiple failed payment attempts';
        }

        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => [
                'recent_payments' => $recentPayments,
                'high_value_payments' => $highValuePayments,
                'failed_payments' => $failedPayments,
            ]
        ];
    }

    /**
     * Analyze account behavior patterns
     */
    private function analyzeAccountBehavior(User $user): array
    {
        $riskScore = 0;
        $indicators = [];

        // Check for rapid profile changes
        $profileChanges = ImmutableAuditLog::where('user_id', $user->id)
            ->where('table_name', 'users')
            ->where('created_at', '>=', now()->subDays(1))
            ->count();

        if ($profileChanges > 3) {
            $riskScore += 35;
            $indicators[] = 'Multiple profile changes in short time';
        }

        // Check for suspicious email changes
        $emailChanges = ImmutableAuditLog::where('user_id', $user->id)
            ->where('table_name', 'users')
            ->where('new_values->email', '!=', null)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        if ($emailChanges > 1) {
            $riskScore += 50;
            $indicators[] = 'Multiple email address changes';
        }

        // Check for password reset frequency
        $passwordResets = ImmutableAuditLog::where('user_id', $user->id)
            ->where('table_name', 'users')
            ->where('new_values->password', '!=', null)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        if ($passwordResets > 2) {
            $riskScore += 30;
            $indicators[] = 'Frequent password resets';
        }

        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => [
                'profile_changes' => $profileChanges,
                'email_changes' => $emailChanges,
                'password_resets' => $passwordResets,
            ]
        ];
    }

    /**
     * Analyze transaction patterns
     */
    private function analyzeTransactionPatterns(User $user): array
    {
        $riskScore = 0;
        $indicators = [];

        // Check for unusual transaction amounts
        $avgTransaction = $user->paymentsMade()
            ->where('status', 'completed')
            ->avg('amount') ?? 0;

        $maxTransaction = $user->paymentsMade()
            ->where('status', 'completed')
            ->max('amount') ?? 0;

        if ($maxTransaction > $avgTransaction * 5 && $avgTransaction > 0) {
            $riskScore += 45;
            $indicators[] = 'Unusual transaction amount detected';
        }

        // Check for round number transactions (often suspicious)
        $roundTransactions = $user->paymentsMade()
            ->where('status', 'completed')
            ->whereRaw('amount = ROUND(amount, 0)')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $totalTransactions = $user->paymentsMade()
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        if ($roundTransactions > 0 && $totalTransactions > 0) {
            $roundPercentage = ($roundTransactions / $totalTransactions) * 100;
            if ($roundPercentage > 70) {
                $riskScore += 25;
                $indicators[] = 'High percentage of round number transactions';
            }
        }

        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => [
                'avg_transaction' => $avgTransaction,
                'max_transaction' => $maxTransaction,
                'round_transactions' => $roundTransactions,
                'total_transactions' => $totalTransactions,
            ]
        ];
    }

    /**
     * Analyze device behavior patterns
     */
    private function analyzeDeviceBehavior(User $user, Request $request = null): array
    {
        $riskScore = 0;
        $indicators = [];

        if (!$request) {
            return [
                'risk_score' => 0,
                'indicators' => [],
                'data' => []
            ];
        }

        // Check for device fingerprint consistency
        $currentFingerprint = $this->generateDeviceFingerprint($request);
        $recentFingerprints = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->pluck('device_fingerprint')
            ->unique()
            ->count();

        if ($recentFingerprints > 3) {
            $riskScore += 40;
            $indicators[] = 'Multiple device fingerprints detected';
        }

        // Check for user agent consistency
        $currentUserAgent = $request->userAgent();
        $recentUserAgents = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->pluck('user_agent')
            ->unique()
            ->count();

        if ($recentUserAgents > 2) {
            $riskScore += 30;
            $indicators[] = 'Multiple user agents detected';
        }

        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => [
                'current_fingerprint' => $currentFingerprint,
                'recent_fingerprints' => $recentFingerprints,
                'recent_user_agents' => $recentUserAgents,
            ]
        ];
    }

    /**
     * Analyze geographic behavior patterns
     */
    private function analyzeGeographicBehavior(User $user, Request $request = null): array
    {
        $riskScore = 0;
        $indicators = [];
        $data = [];

        if (!$request) {
            return [
                'risk_score' => 0,
                'indicators' => [],
                'data' => []
            ];
        }

        $currentIP = $request->ip();
        $registrationCountry = $user->country ?? 'Philippines';
        
        // Check for country mismatch between registration and KYC address
        if ($user->street_address && $user->country) {
            // User has completed KYC with address
            $data['registration_country'] = $registrationCountry;
            $data['kyc_country'] = $user->country;
            
            // If countries don't match, flag for review
            if ($registrationCountry !== $user->country) {
                $riskScore += 50;
                $indicators[] = "Country mismatch: Registered from {$registrationCountry} but KYC address is in {$user->country}";
            }
        }

        // Check for IP location mismatch with registration country
        $ipInfo = $this->getIPGeolocation($currentIP);
        if ($ipInfo && isset($ipInfo['country'])) {
            $data['current_ip_country'] = $ipInfo['country'];
            
            if ($ipInfo['country'] !== $registrationCountry) {
                $riskScore += 40;
                $indicators[] = "Current IP country ({$ipInfo['country']}) differs from registration country ({$registrationCountry})";
            }
        }

        // Check for rapid IP changes
        $recentIPs = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subHours(24))
            ->pluck('ip_address')
            ->unique()
            ->count();

        if ($recentIPs > 3) {
            $riskScore += 35;
            $indicators[] = 'Multiple IP addresses in short time frame';
        }

        // Add additional data
        $data['current_ip'] = $currentIP;
        $data['ip_info'] = $ipInfo;
        $data['recent_ips'] = $recentIPs;
        
        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => $data
        ];
    }

    /**
     * Calculate overall risk score
     */
    private function calculateOverallRiskScore(array $riskFactors): float
    {
        $totalScore = 0;
        $factorCount = 0;

        foreach ($riskFactors as $factor) {
            if (isset($factor['risk_score']) && $factor['risk_score'] > 0) {
                $totalScore += $factor['risk_score'];
                $factorCount++;
            }
        }

        if ($factorCount === 0) {
            return 0;
        }

        $averageScore = $totalScore / $factorCount;

        // Apply weighting based on factor importance
        $weightedScore = $averageScore * 1.2; // Slight increase for overall assessment

        return min(100, max(0, $weightedScore));
    }

    /**
     * Generate recommendations based on analysis
     */
    private function generateRecommendations(float $overallScore, array $riskFactors): array
    {
        $recommendations = [];

        if ($overallScore >= self::FRAUD_SCORE_THRESHOLDS['critical']) {
            $recommendations[] = 'Immediate account suspension recommended';
            $recommendations[] = 'Manual review by fraud team required';
            $recommendations[] = 'Contact user for verification';
        } elseif ($overallScore >= self::FRAUD_SCORE_THRESHOLDS['high']) {
            $recommendations[] = 'Enhanced verification required';
            $recommendations[] = 'Monitor account activity closely';
            $recommendations[] = 'Request additional identification';
        } elseif ($overallScore >= self::FRAUD_SCORE_THRESHOLDS['medium']) {
            $recommendations[] = 'Additional verification step recommended';
            $recommendations[] = 'Increase monitoring frequency';
        } else {
            $recommendations[] = 'Continue normal monitoring';
        }

        // Add specific recommendations based on risk factors
        foreach ($riskFactors as $factorName => $factor) {
            if ($factor['risk_score'] >= 50) {
                switch ($factorName) {
                    case 'payment_behavior':
                        $recommendations[] = 'Implement payment velocity limits';
                        break;
                    case 'account_behavior':
                        $recommendations[] = 'Require email verification for profile changes';
                        break;
                    case 'device_behavior':
                        $recommendations[] = 'Implement device fingerprinting';
                        break;
                    case 'geographic_behavior':
                        $recommendations[] = 'Add geographic restrictions';
                        break;
                }
            }
        }

        return array_unique($recommendations);
    }

    /**
     * Identify specific fraud indicators
     */
    private function identifyFraudIndicators(array $riskFactors): array
    {
        $indicators = [];

        foreach ($riskFactors as $factorName => $factor) {
            if (isset($factor['indicators'])) {
                $indicators = array_merge($indicators, $factor['indicators']);
            }
        }

        return array_unique($indicators);
    }

    /**
     * Generate device fingerprint
     */
    private function generateDeviceFingerprint(Request $request): array
    {
        return [
            'user_agent_hash' => hash('sha256', $request->userAgent()),
            'accept_language' => $request->header('Accept-Language'),
            'accept_encoding' => $request->header('Accept-Encoding'),
            'screen_resolution' => $request->header('Screen-Resolution'),
            'timezone' => $request->header('Timezone'),
            'platform' => $request->header('Sec-Ch-Ua-Platform'),
            'mobile' => $request->header('Sec-Ch-Ua-Mobile'),
        ];
    }

    /**
     * Get IP geolocation information
     */
    private function getIPGeolocation(string $ip): ?array
    {
        // This would integrate with a real IP geolocation service
        // For now, return mock data
        return [
            'country' => 'Philippines',
            'region' => 'Central Visayas',
            'city' => 'Lapu-Lapu City',
            'latitude' => 10.3103,
            'longitude' => 123.9494,
        ];
    }

    /**
     * Create fraud detection case
     */
    public function createFraudCase(User $user, array $analysis, string $fraudType = 'suspicious_behavior'): FraudDetectionCase
    {
        return FraudDetectionCase::create([
            'user_id' => $user->id,
            'fraud_type' => $fraudType,
            'description' => $this->generateCaseDescription($analysis),
            'evidence_data' => $analysis,
            'fraud_score' => $analysis['overall_risk_score'],
            'financial_impact' => $this->calculateFinancialImpact($user),
            'status' => 'investigating',
            'severity' => $this->determineSeverity($analysis['overall_risk_score']),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent() ? ['user_agent' => request()->userAgent()] : null,
            'location_data' => $this->getIPGeolocation(request()->ip()),
        ]);
    }

    /**
     * Generate case description
     */
    private function generateCaseDescription(array $analysis): string
    {
        $description = "Automated fraud detection case created. ";
        $description .= "Overall risk score: {$analysis['overall_risk_score']}. ";

        if (!empty($analysis['fraud_indicators'])) {
            $description .= "Detected indicators: " . implode(', ', $analysis['fraud_indicators']) . ". ";
        }

        $description .= "Analysis performed at: {$analysis['analyzed_at']->format('Y-m-d H:i:s')}";

        return $description;
    }

    /**
     * Calculate potential financial impact
     */
    private function calculateFinancialImpact(User $user): float
    {
        // Calculate based on recent transaction patterns
        $recentTransactions = $user->paymentsMade()
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');

        return $recentTransactions * 0.1; // 10% of recent activity as potential impact
    }

    /**
     * Determine severity level
     */
    private function determineSeverity(float $riskScore): string
    {
        if ($riskScore >= self::FRAUD_SCORE_THRESHOLDS['critical']) {
            return 'critical';
        } elseif ($riskScore >= self::FRAUD_SCORE_THRESHOLDS['high']) {
            return 'high';
        } elseif ($riskScore >= self::FRAUD_SCORE_THRESHOLDS['medium']) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Process fraud detection rules
     */
    public function processRules(User $user, string $action, Request $request): array
    {
        $triggeredRules = [];
        $rules = FraudDetectionRule::enabled()
            ->orderBy('priority', 'asc')
            ->get();

        foreach ($rules as $rule) {
            if ($this->evaluateRule($rule, $user, $action, $request)) {
                $triggeredRules[] = $rule;
                $rule->incrementTriggerCount();
            }
        }

        return $triggeredRules;
    }

    /**
     * Evaluate a specific rule
     */
    private function evaluateRule(FraudDetectionRule $rule, User $user, string $action, Request $request): bool
    {
        // This would contain the actual rule evaluation logic
        // For now, return false as a placeholder
        return false;
    }

    /**
     * Get fraud statistics
     */
    public function getFraudStatistics(): array
    {
        return [
            'total_cases' => FraudDetectionCase::count(),
            'active_cases' => FraudDetectionCase::where('status', 'investigating')->count(),
            'resolved_cases' => FraudDetectionCase::where('status', 'resolved')->count(),
            'critical_cases' => FraudDetectionCase::where('severity', 'critical')->count(),
            'avg_risk_score' => FraudDetectionCase::avg('fraud_score') ?? 0,
            'total_financial_impact' => FraudDetectionCase::sum('financial_impact'),
            'recent_alerts' => FraudDetectionAlert::where('created_at', '>=', now()->subHours(24))->count(),
            'false_positives' => FraudDetectionAlert::where('status', 'false_positive')->count(),
        ];
    }
}