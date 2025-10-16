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
use Illuminate\Support\Facades\Http;
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

    private string $aiApiKey;
    private string $aiModel;
    private string $aiBaseUrl;

    public function __construct()
    {
        // Initialize AI service for fraud analysis
        $this->aiApiKey = env('META_LLAMA_L4_SCOUT_FREE') ?: config('services.openrouter.api_key');
        $this->aiModel = 'meta-llama/llama-4-scout:free';
        $this->aiBaseUrl = config('services.openrouter.base_url') ?: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    }

    /**
     * Comprehensive fraud analysis for a user with AI enhancement
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
            'ai_analysis' => null,
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

        // Generate AI-powered fraud analysis
        $analysis['ai_analysis'] = $this->generateAIFraudAnalysis($user, $analysis);

        // Generate recommendations
        $analysis['recommendations'] = $this->generateRecommendations($analysis['overall_risk_score'], $analysis['risk_factors']);

        // Identify fraud indicators
        $analysis['fraud_indicators'] = $this->identifyFraudIndicators($analysis['risk_factors']);

        return $analysis;
    }

    /**
     * Generate AI-powered fraud analysis
     */
    private function generateAIFraudAnalysis(User $user, array $analysis): ?array
    {
        try {
            if (!$this->aiApiKey) {
                Log::warning('AI API key not configured for fraud detection');
                return null;
            }

            $prompt = $this->buildFraudAnalysisPrompt($user, $analysis);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->aiApiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => request()->header('referer') ?: config('app.url'),
                'X-Title' => 'WorkWise AI Fraud Detection'
            ])->timeout(30)->post("{$this->aiBaseUrl}/chat/completions", [
                'model' => $this->aiModel,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert AI fraud detection analyst specializing in online marketplace security. Analyze user behavior patterns, transaction anomalies, and risk indicators to provide detailed fraud assessment. Focus on: 1) Behavioral pattern analysis, 2) Transaction anomaly detection, 3) Risk level assessment, 4) Specific fraud type identification, 5) Actionable security recommendations. Always provide clear, professional analysis with specific risk scores and mitigation strategies.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'max_tokens' => 300,
                'temperature' => 0.3 // Lower temperature for more consistent fraud analysis
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $aiContent = $data['choices'][0]['message']['content'] ?? '';
                
                return [
                    'analysis' => $aiContent,
                    'confidence_score' => $this->extractConfidenceScore($aiContent),
                    'fraud_type_prediction' => $this->extractFraudType($aiContent),
                    'ai_risk_adjustment' => $this->calculateAIRiskAdjustment($aiContent),
                    'generated_at' => now(),
                ];
            }

            Log::warning('AI fraud analysis response not successful', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('AI fraud analysis error', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return null;
        }
    }

    /**
     * Build fraud analysis prompt for AI
     */
    private function buildFraudAnalysisPrompt(User $user, array $analysis): string
    {
        $userInfo = [
            'user_type' => $user->user_type,
            'account_age_days' => $user->created_at->diffInDays(now()),
            'email_verified' => $user->email_verified_at ? 'Yes' : 'No',
            'profile_completion' => $this->calculateProfileCompletion($user),
        ];

        $riskFactors = $analysis['risk_factors'];
        $overallRiskScore = $analysis['overall_risk_score'];

        return "Analyze this user's fraud risk profile:

USER PROFILE:
- User Type: {$userInfo['user_type']}
- Account Age: {$userInfo['account_age_days']} days
- Email Verified: {$userInfo['email_verified']}
- Profile Completion: {$userInfo['profile_completion']}%

RISK ANALYSIS RESULTS:
- Overall Risk Score: {$overallRiskScore}/100
- Payment Behavior Risk: {$riskFactors['payment_behavior']['risk_score']}/100
- Account Behavior Risk: {$riskFactors['account_behavior']['risk_score']}/100
- Transaction Pattern Risk: {$riskFactors['transaction_patterns']['risk_score']}/100
- Device Behavior Risk: {$riskFactors['device_behavior']['risk_score']}/100
- Geographic Behavior Risk: {$riskFactors['geographic_behavior']['risk_score']}/100

DETECTED INDICATORS:
" . $this->formatIndicatorsForAI($riskFactors) . "

Please provide:
1. Detailed behavioral pattern analysis
2. Specific fraud type assessment (if any)
3. Risk level classification (Low/Medium/High/Critical)
4. Confidence score (0-100%)
5. Recommended security actions
6. False positive likelihood assessment";
    }

    /**
     * Format risk indicators for AI analysis
     */
    private function formatIndicatorsForAI(array $riskFactors): string
    {
        $indicators = [];
        
        foreach ($riskFactors as $category => $data) {
            if (!empty($data['indicators'])) {
                $indicators[] = strtoupper(str_replace('_', ' ', $category)) . ': ' . implode(', ', $data['indicators']);
            }
        }

        return implode("\n", $indicators) ?: 'No specific indicators detected';
    }

    /**
     * Extract confidence score from AI response
     */
    private function extractConfidenceScore(string $aiContent): int
    {
        // Look for confidence patterns in AI response
        if (preg_match('/confidence[:\s]*(\d+)%?/i', $aiContent, $matches)) {
            return min(100, max(0, (int)$matches[1]));
        }
        
        return 75; // Default confidence
    }

    /**
     * Extract fraud type from AI response
     */
    private function extractFraudType(string $aiContent): ?string
    {
        $fraudTypes = [
            'payment_fraud' => ['payment fraud', 'credit card fraud', 'financial fraud'],
            'account_takeover' => ['account takeover', 'hijacking', 'unauthorized access'],
            'identity_theft' => ['identity theft', 'impersonation', 'fake identity'],
            'bot_activity' => ['bot', 'automated', 'scripted behavior'],
            'money_laundering' => ['money laundering', 'suspicious transfers'],
            'bid_manipulation' => ['bid manipulation', 'bid stuffing', 'fake bidding'],
        ];

        $lowerContent = strtolower($aiContent);
        
        foreach ($fraudTypes as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($lowerContent, $keyword) !== false) {
                    return $type;
                }
            }
        }

        return null;
    }

    /**
     * Calculate AI risk adjustment
     */
    private function calculateAIRiskAdjustment(string $aiContent): int
    {
        $lowerContent = strtolower($aiContent);
        $adjustment = 0;

        // Positive risk indicators
        if (strpos($lowerContent, 'high risk') !== false) $adjustment += 15;
        if (strpos($lowerContent, 'critical') !== false) $adjustment += 20;
        if (strpos($lowerContent, 'suspicious') !== false) $adjustment += 10;
        if (strpos($lowerContent, 'anomaly') !== false) $adjustment += 8;

        // Negative risk indicators
        if (strpos($lowerContent, 'low risk') !== false) $adjustment -= 10;
        if (strpos($lowerContent, 'false positive') !== false) $adjustment -= 15;
        if (strpos($lowerContent, 'legitimate') !== false) $adjustment -= 8;

        return max(-20, min(20, $adjustment)); // Cap adjustment between -20 and +20
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateProfileCompletion(User $user): int
    {
        $fields = ['first_name', 'last_name', 'email', 'user_type'];
        $completed = 0;
        $total = count($fields);

        foreach ($fields as $field) {
            if (!empty($user->$field)) {
                $completed++;
            }
        }

        return round(($completed / $total) * 100);
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

        if (!$request) {
            return [
                'risk_score' => 0,
                'indicators' => [],
                'data' => []
            ];
        }

        $currentIP = $request->ip();
        $userLocation = $user->location ?? 'Philippines';

        // Check for IP location mismatch
        $ipInfo = $this->getIPGeolocation($currentIP);
        if ($ipInfo && $ipInfo['country'] !== 'Philippines' && strpos($userLocation, 'Philippines') !== false) {
            $riskScore += 60;
            $indicators[] = 'Geographic location mismatch detected';
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

        return [
            'risk_score' => min(100, $riskScore),
            'indicators' => $indicators,
            'data' => [
                'current_ip' => $currentIP,
                'ip_info' => $ipInfo,
                'user_location' => $userLocation,
                'recent_ips' => $recentIPs,
            ]
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