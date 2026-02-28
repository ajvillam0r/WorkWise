<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\FraudDetectionService;
use App\Models\FraudDetectionAlert;
use App\Models\FraudDetectionCase;
use App\Models\ImmutableAuditLog;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class FraudDetectionMiddleware
{
    private FraudDetectionService $fraudDetectionService;

    public function __construct(FraudDetectionService $fraudDetectionService)
    {
        $this->fraudDetectionService = $fraudDetectionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Skip fraud detection for non-authenticated users or admins
        if (!$user || $user->isAdmin()) {
            return $next($request);
        }

        // Get the route action to determine what type of fraud detection to apply
        $routeAction = $request->route()?->getActionName();

        // Apply fraud detection based on the action being performed
        $fraudResult = $this->analyzeRequest($user, $request, $routeAction);

        if ($fraudResult['requires_action']) {
            $response = $this->handleFraudAction($fraudResult, $request);
            if ($response !== null) {
                return $response;
            }
        }

        // Log the request for behavioral analysis
        $this->logUserBehavior($user, $request, $routeAction);

        return $next($request);
    }

    /**
     * Analyze the request for fraud indicators
     */
    private function analyzeRequest(User $user, Request $request, ?string $routeAction): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => null,
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Analyze based on route action
        switch (true) {
            case str_contains($routeAction, 'PaymentController'):
                $result = $this->analyzePaymentRequest($user, $request);
                break;

            case str_contains($routeAction, 'ProfileController'):
                $result = $this->analyzeProfileRequest($user, $request);
                break;

            case str_contains($routeAction, 'BidController'):
                $result = $this->analyzeBidRequest($user, $request);
                break;

            case str_contains($routeAction, 'ProjectController'):
                $result = $this->analyzeProjectRequest($user, $request);
                break;

            case str_contains($routeAction, 'MessageController'):
                $result = $this->analyzeMessageRequest($user, $request);
                break;

            case str_contains($routeAction, 'GigJobController'):
                $result = $this->analyzeJobRequest($user, $request);
                break;

            default:
                $result = $this->analyzeGeneralRequest($user, $request);
        }

        return $result;
    }

    /**
     * Analyze payment-related requests
     */
    private function analyzePaymentRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'payment_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for rapid successive payments
        $recentPayments = $user->paymentsMade()
            ->where('created_at', '>=', now()->subMinutes(5))
            ->count();

        if ($recentPayments >= 3) {
            $result['requires_action'] = true;
            $result['risk_score'] = 75;
            $result['alerts'][] = 'Multiple payment attempts in short time frame';
            $result['recommendations'][] = 'Require additional payment verification';
        }

        // Check for high-value payments (absolute threshold: ₱50,000 / $1,000)
        $paymentAmount = (float) $request->input('amount', 0);
        $userAvgPayment = $user->paymentsMade()
            ->where('status', 'completed')
            ->avg('amount') ?? 0;

        if ($paymentAmount > $userAvgPayment * 3 && $userAvgPayment > 0) {
            $result['requires_action'] = true;
            $result['risk_score'] = max($result['risk_score'], 60);
            $result['alerts'][] = 'Unusual payment amount detected';
            $result['recommendations'][] = 'Verify payment amount with user';
        }

        // Absolute high-value threshold: exceed ₱50,000 (amounts stored in PHP)
        if ($paymentAmount > 50000) {
            $result['requires_action'] = true;
            $result['risk_score'] = max($result['risk_score'], 60);
            $result['alerts'][] = 'High-value transaction detected';
            $result['recommendations'][] = 'Verify payment amount with user';
        }

        // Check for suspicious payment patterns
        if ($this->isSuspiciousPaymentPattern($user)) {
            $result['requires_action'] = true;
            $result['risk_score'] = max($result['risk_score'], 80);
            $result['alerts'][] = 'Suspicious payment pattern detected';
            $result['recommendations'][] = 'Temporarily suspend payment processing';
        }

        // Cross-request escalation: if user had a recent high-severity alert (e.g. email change), boost score so critical can trigger
        if ($result['requires_action'] && $result['risk_score'] >= 70 && $result['risk_score'] < 90) {
            $recentHighRisk = FraudDetectionAlert::where('user_id', $user->id)
                ->where('triggered_at', '>=', now()->subHour())
                ->where('risk_score', '>=', 70)
                ->exists();
            if ($recentHighRisk) {
                $result['risk_score'] = min(100, (int) $result['risk_score'] + 15);
                $result['alerts'][] = 'Recent high-risk activity escalation';
            }
        }

        return $result;
    }

    /**
     * Analyze profile-related requests
     */
    private function analyzeProfileRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'profile_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for rapid profile changes (cache counter set by ProfileController on each update)
        $profileChangeCount = (int) Cache::get('fraud_profile_changes_' . $user->id, 0);

        if ($profileChangeCount >= 2) {
            $result['requires_action'] = true;
            $result['risk_score'] = 70;
            $result['alerts'][] = 'Multiple profile changes in short time frame';
            $result['recommendations'][] = 'Require email verification for changes';
        }

        // Check for email changes
        if ($request->has('email') && $request->input('email') !== $user->email) {
            $result['requires_action'] = true;
            $result['risk_score'] = max($result['risk_score'], 85);
            $result['alerts'][] = 'Email address change detected';
            $result['recommendations'][] = 'Require current password and email verification';
        }

        // Already-verified users: reduce risk to prevent deadlock (block + impossible re-upload)
        if ($user->isIDVerified()) {
            if ($result['risk_score'] >= 85) {
                $result['risk_score'] = 60;
            } elseif ($result['risk_score'] >= 70) {
                $result['risk_score'] = 50;
            }
        }

        return $result;
    }

    /**
     * Analyze bid-related requests
     */
    private function analyzeBidRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'bid_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for rapid bid submissions
        $recentBids = $user->bids()
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        if ($recentBids >= 5) {
            $result['requires_action'] = true;
            $result['risk_score'] = 65;
            $result['alerts'][] = 'Rapid bid submissions detected';
            $result['recommendations'][] = 'Implement bid rate limiting';
        }

        // Check for bid amount anomalies
        $bidAmount = $request->input('bid_amount', 0);
        if ($bidAmount > 0) {
            $avgBidAmount = $user->bids()->avg('bid_amount') ?? 0;
            if ($avgBidAmount > 0 && $bidAmount > $avgBidAmount * 2) {
                $result['requires_action'] = true;
                $result['risk_score'] = max($result['risk_score'], 55);
                $result['alerts'][] = 'Unusual bid amount detected';
                $result['recommendations'][] = 'Verify bid amount legitimacy';
            }
        }

        return $result;
    }

    /**
     * Analyze project-related requests
     */
    private function analyzeProjectRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'project_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for rapid project creation
        $recentProjects = $user->employerProjects()
            ->where('created_at', '>=', now()->subHours(2))
            ->count();

        if ($recentProjects >= 3) {
            $result['requires_action'] = true;
            $result['risk_score'] = 60;
            $result['alerts'][] = 'Multiple project creations in short time';
            $result['recommendations'][] = 'Review project legitimacy';
        }

        return $result;
    }

    /**
     * Analyze job-creation requests (employer posting jobs via GigJobController)
     */
    private function analyzeJobRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'job_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for rapid job creation (project spoilage)
        $recentJobs = $user->postedJobs()
            ->where('created_at', '>=', now()->subHours(2))
            ->count();

        if ($recentJobs >= 3) {
            $result['requires_action'] = true;
            $result['risk_score'] = 60;
            $result['alerts'][] = 'Multiple project creations in short time';
            $result['recommendations'][] = 'Review project legitimacy';
        }

        return $result;
    }

    /**
     * Analyze message-related requests
     */
    private function analyzeMessageRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'message_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for message flooding
        $recentMessages = $user->sentMessages()
            ->where('created_at', '>=', now()->subMinutes(5))
            ->count();

        if ($recentMessages >= 10) {
            $result['requires_action'] = true;
            $result['risk_score'] = 50;
            $result['alerts'][] = 'High message volume detected';
            $result['recommendations'][] = 'Implement message rate limiting';
        }

        return $result;
    }

    /**
     * Analyze general requests
     */
    private function analyzeGeneralRequest(User $user, Request $request): array
    {
        $result = [
            'requires_action' => false,
            'action_type' => 'general_analysis',
            'risk_score' => 0,
            'alerts' => [],
            'recommendations' => [],
        ];

        // Check for unusual request patterns
        $requestCount = $this->getRecentRequestCount($user, $request->ip());

        if ($requestCount > 50) { // More than 50 requests per minute
            $result['requires_action'] = true;
            $result['risk_score'] = 40;
            $result['alerts'][] = 'High request volume detected';
            $result['recommendations'][] = 'Monitor for automated behavior';
        }

        return $result;
    }

    /**
     * Check for suspicious payment patterns
     */
    private function isSuspiciousPaymentPattern(User $user): bool
    {
        // Check for round number payments (often suspicious)
        $roundPayments = $user->paymentsMade()
            ->where('status', 'completed')
            ->whereRaw('amount = ROUND(amount, 0)')
            ->where('created_at', '>=', now()->subDays(1))
            ->count();

        $totalPayments = $user->paymentsMade()
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(1))
            ->count();

        if ($totalPayments > 0) {
            $roundPercentage = ($roundPayments / $totalPayments) * 100;
            return $roundPercentage > 80; // More than 80% round numbers
        }

        return false;
    }

    /**
     * Get recent request count for rate limiting
     */
    private function getRecentRequestCount(User $user, string $ip): int
    {
        return ImmutableAuditLog::where('user_id', $user->id)
            ->where('ip_address', $ip)
            ->where('created_at', '>=', now()->subMinute())
            ->count();
    }

    /**
     * Handle fraud detection actions
     */
    private function handleFraudAction(array $fraudResult, Request $request): ?Response
    {
        $user = Auth::user();

        // Create fraud alert
        $alert = FraudDetectionAlert::create([
            'user_id' => $user->id,
            'alert_type' => 'system_detected',
            'alert_message' => implode('; ', $fraudResult['alerts']),
            'alert_data' => $fraudResult,
            'risk_score' => $fraudResult['risk_score'],
            'severity' => $this->determineSeverity($fraudResult['risk_score']),
            'status' => 'active',
            'triggered_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => ['user_agent' => $request->userAgent()],
            'context_data' => [
                'route' => $request->route()?->getName(),
                'method' => $request->method(),
                'action_type' => $fraudResult['action_type'],
            ],
        ]);

        // Log the fraud detection event
        Log::warning('Fraud detection triggered', [
            'user_id' => $user->id,
            'alert_id' => $alert->id,
            'risk_score' => $fraudResult['risk_score'],
            'alerts' => $fraudResult['alerts'],
            'ip_address' => $request->ip(),
        ]);

        // Automate case creation for high risk actions (Score >= 70)
        if ($fraudResult['risk_score'] >= 70) {
            $analysis = [
                'overall_risk_score' => $fraudResult['risk_score'],
                'fraud_indicators' => $fraudResult['alerts'],
                'analyzed_at' => now(),
            ];
            
            $case = $this->fraudDetectionService->createFraudCase(
                $user, 
                $analysis, 
                $fraudResult['action_type'] === 'payment_analysis' ? 'payment_fraud' : 'suspicious_behavior'
            );
            
            // Link the alert to the newly created case
            $alert->update(['fraud_case_id' => $case->id]);
        }

        // Determine response based on risk level
        // Critical (>= 90): block with redirect. High (>= 70): block with redirect. Medium (< 70): allow request and flash warning only.
        if ($fraudResult['risk_score'] >= 90) {
            // Critical - block the request (Inertia gets redirect so ErrorModal can be shown)
            if ($request->inertia()) {
                return back()->withErrors(['fraud_alert' => 'Your account is under review. Please contact support.'])->with('security_verification', true);
            }
            if ($request->expectsJson() && !$request->inertia()) {
                return response()->json([
                    'error' => 'Request blocked due to security concerns',
                    'message' => 'Your account is under review. Please contact support.',
                ], 403);
            }
            return back()->withErrors(['fraud_alert' => 'Your account is under review. Please contact support.']);
        }
        if ($fraudResult['risk_score'] >= 70) {
            // High risk - block with redirect so Inertia shows security modal (case already created above)
            if ($request->inertia()) {
                return back()->withErrors(['fraud_alert' => 'Additional verification required. Please verify your identity to continue.'])->with('security_verification', true);
            }
            if ($request->expectsJson() && !$request->inertia()) {
                return response()->json([
                    'error' => 'Additional verification required',
                    'message' => 'Please verify your identity to continue.',
                    'verification_required' => true,
                ], 403);
            }
            return back()->withErrors(['fraud_alert' => 'Additional verification required. Please verify your identity to continue.']);
        }

        // Medium risk: allow the request to proceed and flash a warning (do not block)
        session()->flash('warning', 'Your activity has been flagged for review. Repeated flagged activity may result in account suspension.');
        
        return null;
    }

    /**
     * Log user behavior for analysis
     */
    private function logUserBehavior(User $user, Request $request, ?string $routeAction): void
    {
        // Only log a sample of requests to avoid database bloat
        if (rand(1, 10) !== 1) {
            return;
        }

        ImmutableAuditLog::createLog(
            'user_behavior',
            'REQUEST',
            0, // No specific record ID for behavior logging
            $user->id,
            'user',
            null,
            null,
            [
                'route_action' => $routeAction,
                'method' => $request->method(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referer' => $request->header('referer'),
                'request_size' => strlen($request->getContent()),
            ],
            $request->ip(),
            ['user_agent' => $request->userAgent()],
            session()->getId()
        );
    }

    /**
     * Determine severity based on risk score
     */
    private function determineSeverity(float $riskScore): string
    {
        if ($riskScore >= 90) {
            return 'critical';
        } elseif ($riskScore >= 70) {
            return 'high';
        } elseif ($riskScore >= 50) {
            return 'medium';
        }

        return 'low';
    }
}
