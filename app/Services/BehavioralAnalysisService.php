<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserBehaviorAnalytics;
use App\Models\SecurityAlert;
use App\Models\UserTypingPattern;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class BehavioralAnalysisService
{
    private const RISK_THRESHOLD_HIGH = 0.8;
    private const RISK_THRESHOLD_MEDIUM = 0.6;
    private const RISK_THRESHOLD_LOW = 0.4;

    /**
     * Analyze user behavior and calculate risk score
     */
    public function analyzeUserBehavior(User $user, string $action, Request $request, array $additionalData = []): array
    {
        $behaviorData = $this->collectBehaviorData($request, $additionalData);
        $deviceFingerprint = $this->generateDeviceFingerprint($request);
        
        // Store behavior data
        $analytics = UserBehaviorAnalytics::create([
            'user_id' => $user->id,
            'session_id' => session()->getId(),
            'action_type' => $action,
            'behavior_data' => $behaviorData,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_fingerprint' => $deviceFingerprint,
        ]);

        // Calculate risk score
        $riskScore = $this->calculateRiskScore($user, $behaviorData, $action);
        
        // Update analytics with risk score
        $analytics->update([
            'risk_score' => $riskScore,
            'risk_factors' => $this->identifyRiskFactors($user, $behaviorData, $riskScore),
            'flagged' => $riskScore >= self::RISK_THRESHOLD_MEDIUM,
            'analyzed_at' => now()
        ]);

        // Trigger security alerts if needed
        if ($riskScore >= self::RISK_THRESHOLD_HIGH) {
            $this->triggerSecurityAlert($user, $action, $riskScore, $analytics);
        }

        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->getRiskLevel($riskScore),
            'risk_factors' => $analytics->risk_factors,
            'recommended_actions' => $this->getRecommendedActions($riskScore),
            'flagged' => $analytics->flagged
        ];
    }

    /**
     * Collect behavior data from request
     */
    private function collectBehaviorData(Request $request, array $additionalData): array
    {
        return [
            'timestamp' => now()->toISOString(),
            'page_url' => $request->url(),
            'referrer' => $request->header('referer'),
            'screen_resolution' => $request->header('Screen-Resolution'),
            'timezone' => $request->header('Timezone'),
            'language' => $request->header('Accept-Language'),
            'typing_data' => $additionalData['typing_data'] ?? null,
            'mouse_movements' => $additionalData['mouse_movements'] ?? null,
            'form_interaction_time' => $additionalData['form_time'] ?? null,
            'click_patterns' => $additionalData['click_patterns'] ?? null,
            'scroll_behavior' => $additionalData['scroll_behavior'] ?? null,
        ];
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
     * Calculate comprehensive risk score
     */
    private function calculateRiskScore(User $user, array $behaviorData, string $action): float
    {
        $riskFactors = [
            'device_consistency' => $this->analyzeDeviceConsistency($user, $behaviorData),
            'typing_pattern' => $this->analyzeTypingPattern($user, $behaviorData),
            'location_anomaly' => $this->analyzeLocationAnomaly($user, $behaviorData),
            'time_pattern' => $this->analyzeTimePattern($user, $behaviorData),
            'action_frequency' => $this->analyzeActionFrequency($user, $action),
            'session_behavior' => $this->analyzeSessionBehavior($user, $behaviorData),
        ];

        // Weighted risk calculation
        $weights = [
            'device_consistency' => 0.25,
            'typing_pattern' => 0.20,
            'location_anomaly' => 0.20,
            'time_pattern' => 0.15,
            'action_frequency' => 0.10,
            'session_behavior' => 0.10,
        ];

        $totalRisk = 0;
        foreach ($riskFactors as $factor => $risk) {
            $totalRisk += $risk * $weights[$factor];
        }

        return min(1.0, max(0.0, $totalRisk));
    }

    /**
     * Analyze device consistency
     */
    private function analyzeDeviceConsistency(User $user, array $behaviorData): float
    {
        $recentDevices = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->pluck('device_fingerprint')
            ->unique()
            ->count();

        // More than 5 different devices in 30 days is suspicious
        if ($recentDevices > 5) {
            return 0.8;
        } elseif ($recentDevices > 3) {
            return 0.5;
        }

        return 0.1;
    }

    /**
     * Analyze typing patterns
     */
    private function analyzeTypingPattern(User $user, array $behaviorData): float
    {
        if (!isset($behaviorData['typing_data'])) {
            return 0.0;
        }

        $storedPattern = UserTypingPattern::where('user_id', $user->id)->first();
        
        if (!$storedPattern) {
            // Store first typing pattern
            $this->storeTypingPattern($user, $behaviorData['typing_data']);
            return 0.0;
        }

        // Compare current typing with stored pattern
        $currentSpeed = $behaviorData['typing_data']['speed'] ?? 0;
        $storedSpeed = $storedPattern->avg_typing_speed;

        $speedDifference = abs($currentSpeed - $storedSpeed) / max($storedSpeed, 1);

        // Update stored pattern
        $this->updateTypingPattern($storedPattern, $behaviorData['typing_data']);

        // High difference indicates possible account compromise
        if ($speedDifference > 0.5) {
            return 0.9;
        } elseif ($speedDifference > 0.3) {
            return 0.6;
        }

        return 0.1;
    }

    /**
     * Store typing pattern
     */
    private function storeTypingPattern(User $user, array $typingData): void
    {
        UserTypingPattern::create([
            'user_id' => $user->id,
            'avg_typing_speed' => $typingData['speed'] ?? 0,
            'keystroke_dynamics' => $typingData['keystroke_timing'] ?? [],
            'pause_patterns' => $typingData['pause_patterns'] ?? [],
            'common_typos' => $typingData['typos'] ?? [],
            'device_type' => $typingData['device_type'] ?? 'unknown',
        ]);
    }

    /**
     * Update typing pattern
     */
    private function updateTypingPattern(UserTypingPattern $pattern, array $typingData): void
    {
        $newSpeed = $typingData['speed'] ?? $pattern->avg_typing_speed;
        $sampleCount = $pattern->sample_count + 1;
        
        // Calculate weighted average
        $avgSpeed = (($pattern->avg_typing_speed * $pattern->sample_count) + $newSpeed) / $sampleCount;

        $pattern->update([
            'avg_typing_speed' => $avgSpeed,
            'sample_count' => $sampleCount,
            'last_updated' => now(),
        ]);
    }

    /**
     * Analyze location anomaly
     */
    private function analyzeLocationAnomaly(User $user, array $behaviorData): float
    {
        $currentIP = request()->ip();
        $recentIPs = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->pluck('ip_address')
            ->unique();

        if (!$recentIPs->contains($currentIP)) {
            // New IP address - check if it's from a different country/region
            $ipInfo = $this->getIPInfo($currentIP);
            $userLocation = $user->location ?? 'Philippines';

            if ($ipInfo['country'] !== 'Philippines' && strpos($userLocation, 'Philippines') !== false) {
                return 0.9; // High risk for international access
            }

            return 0.4; // Medium risk for new IP
        }

        return 0.1;
    }

    /**
     * Get IP information (simplified - in production use a real IP geolocation service)
     */
    private function getIPInfo(string $ip): array
    {
        // This is a simplified version - implement with real IP geolocation service
        return [
            'country' => 'Philippines', // Default for demo
            'region' => 'Central Visayas',
            'city' => 'Lapu-Lapu City'
        ];
    }

    /**
     * Analyze time patterns
     */
    private function analyzeTimePattern(User $user, array $behaviorData): float
    {
        $currentHour = now()->hour;
        
        $recentActivity = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->get()
            ->groupBy(function ($item) {
                return $item->created_at->hour;
            });

        $usualHours = $recentActivity->keys()->toArray();

        // Check if current activity is during unusual hours
        if (!in_array($currentHour, $usualHours) && ($currentHour < 6 || $currentHour > 23)) {
            return 0.6; // Medium risk for unusual hours
        }

        return 0.1;
    }

    /**
     * Analyze action frequency
     */
    private function analyzeActionFrequency(User $user, string $action): float
    {
        $recentActions = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('action_type', $action)
            ->where('created_at', '>=', now()->subHour())
            ->count();

        // Define suspicious frequency thresholds per action type
        $thresholds = [
            'login' => 5,
            'message' => 50,
            'bid' => 10,
            'payment' => 3,
            'profile_update' => 5,
        ];

        $threshold = $thresholds[$action] ?? 10;

        if ($recentActions > $threshold) {
            return 0.8; // High risk for excessive activity
        } elseif ($recentActions > $threshold * 0.7) {
            return 0.5; // Medium risk
        }

        return 0.1;
    }

    /**
     * Analyze session behavior
     */
    private function analyzeSessionBehavior(User $user, array $behaviorData): float
    {
        $sessionId = session()->getId();
        $sessionActions = UserBehaviorAnalytics::where('user_id', $user->id)
            ->where('session_id', $sessionId)
            ->count();

        // Very rapid actions in a single session might indicate automation
        if ($sessionActions > 20) {
            return 0.7;
        } elseif ($sessionActions > 10) {
            return 0.4;
        }

        return 0.1;
    }

    /**
     * Identify specific risk factors
     */
    private function identifyRiskFactors(User $user, array $behaviorData, float $riskScore): array
    {
        $factors = [];

        if ($riskScore >= self::RISK_THRESHOLD_HIGH) {
            $factors[] = 'High risk behavior detected';
        }

        // Add specific risk factors based on analysis
        // This would be expanded based on the specific risks identified

        return $factors;
    }

    /**
     * Get risk level string
     */
    private function getRiskLevel(float $riskScore): string
    {
        if ($riskScore >= self::RISK_THRESHOLD_HIGH) {
            return 'high';
        } elseif ($riskScore >= self::RISK_THRESHOLD_MEDIUM) {
            return 'medium';
        } elseif ($riskScore >= self::RISK_THRESHOLD_LOW) {
            return 'low';
        }

        return 'minimal';
    }

    /**
     * Get recommended actions based on risk score
     */
    private function getRecommendedActions(float $riskScore): array
    {
        if ($riskScore >= self::RISK_THRESHOLD_HIGH) {
            return [
                'Require additional verification',
                'Temporarily restrict account',
                'Alert security team',
                'Monitor closely'
            ];
        } elseif ($riskScore >= self::RISK_THRESHOLD_MEDIUM) {
            return [
                'Request email verification',
                'Monitor activity',
                'Log security event'
            ];
        }

        return ['Continue normal monitoring'];
    }

    /**
     * Trigger security alert
     */
    private function triggerSecurityAlert(User $user, string $action, float $riskScore, UserBehaviorAnalytics $analytics): void
    {
        SecurityAlert::create([
            'user_id' => $user->id,
            'alert_type' => 'behavioral_anomaly',
            'risk_score' => $riskScore,
            'alert_data' => [
                'action' => $action,
                'analytics_id' => $analytics->id,
                'behavior_data' => $analytics->behavior_data,
                'device_fingerprint' => $analytics->device_fingerprint,
            ],
            'status' => 'pending',
            'severity' => $this->getSeverity($riskScore),
            'description' => "Suspicious behavior detected for user {$user->id} during {$action}",
            'recommended_actions' => $this->getRecommendedActions($riskScore),
        ]);

        // Log the security alert
        Log::warning('Security Alert Triggered', [
            'user_id' => $user->id,
            'action' => $action,
            'risk_score' => $riskScore,
            'ip_address' => $analytics->ip_address,
        ]);

        // Send notification to security team (implement as needed)
        // $this->notifySecurityTeam($user, $action, $riskScore);
    }

    /**
     * Get severity level
     */
    private function getSeverity(float $riskScore): string
    {
        if ($riskScore >= 0.9) {
            return 'critical';
        } elseif ($riskScore >= self::RISK_THRESHOLD_HIGH) {
            return 'high';
        } elseif ($riskScore >= self::RISK_THRESHOLD_MEDIUM) {
            return 'medium';
        }

        return 'low';
    }
}
