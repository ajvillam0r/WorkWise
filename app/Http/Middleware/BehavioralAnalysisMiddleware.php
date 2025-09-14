<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\BehavioralAnalysisService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BehavioralAnalysisMiddleware
{
    private BehavioralAnalysisService $behavioralAnalysis;

    public function __construct(BehavioralAnalysisService $behavioralAnalysis)
    {
        $this->behavioralAnalysis = $behavioralAnalysis;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$actions): mixed
    {
        // Only analyze authenticated users
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();
        $currentAction = $this->determineAction($request, $actions);

        // Skip analysis for low-risk actions
        if ($this->shouldSkipAnalysis($currentAction)) {
            return $next($request);
        }

        try {
            // Collect additional behavioral data from request
            $additionalData = $this->collectAdditionalData($request);

            // Perform behavioral analysis
            $analysis = $this->behavioralAnalysis->analyzeUserBehavior(
                $user,
                $currentAction,
                $request,
                $additionalData
            );

            // Handle high-risk behavior
            if ($analysis['risk_score'] >= 0.8) {
                return $this->handleHighRiskBehavior($request, $analysis);
            }

            // Add analysis results to request for downstream use
            $request->merge(['behavioral_analysis' => $analysis]);

        } catch (\Exception $e) {
            // Log error but don't block the request
            Log::error('Behavioral analysis failed', [
                'user_id' => $user->id,
                'action' => $currentAction,
                'error' => $e->getMessage()
            ]);
        }

        return $next($request);
    }

    /**
     * Determine the action being performed
     */
    private function determineAction(Request $request, array $actions): string
    {
        // Use provided action or infer from route
        if (!empty($actions)) {
            return $actions[0];
        }

        $route = $request->route();
        if ($route) {
            $routeName = $route->getName();
            $method = $request->method();
            
            // Map common routes to actions
            return match(true) {
                str_contains($routeName, 'login') => 'login',
                str_contains($routeName, 'message') => 'message',
                str_contains($routeName, 'bid') => 'bid',
                str_contains($routeName, 'payment') => 'payment',
                str_contains($routeName, 'profile') => 'profile_update',
                str_contains($routeName, 'project') => 'project_action',
                $method === 'POST' => 'form_submission',
                default => 'general_activity'
            };
        }

        return 'unknown_action';
    }

    /**
     * Check if analysis should be skipped for this action
     */
    private function shouldSkipAnalysis(string $action): bool
    {
        $skipActions = [
            'general_activity',
            'page_view',
            'static_content',
            'health_check'
        ];

        return in_array($action, $skipActions);
    }

    /**
     * Collect additional behavioral data from request
     */
    private function collectAdditionalData(Request $request): array
    {
        return [
            'typing_data' => $request->input('typing_data'),
            'mouse_movements' => $request->input('mouse_movements'),
            'form_time' => $request->input('form_interaction_time'),
            'click_patterns' => $request->input('click_patterns'),
            'scroll_behavior' => $request->input('scroll_behavior'),
            'page_focus_time' => $request->input('page_focus_time'),
            'tab_switches' => $request->input('tab_switches'),
        ];
    }

    /**
     * Handle high-risk behavior
     */
    private function handleHighRiskBehavior(Request $request, array $analysis): mixed
    {
        $riskScore = $analysis['risk_score'];
        $user = Auth::user();

        // Critical risk - block action and require verification
        if ($riskScore >= 0.9) {
            Log::critical('Critical risk behavior detected', [
                'user_id' => $user->id,
                'risk_score' => $riskScore,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'error' => 'Security verification required',
                'message' => 'Unusual activity detected. Please verify your identity.',
                'verification_required' => true,
                'risk_level' => 'critical'
            ], 403);
        }

        // High risk - require additional verification for sensitive actions
        if ($this->isSensitiveAction($this->determineAction($request, []))) {
            return response()->json([
                'error' => 'Additional verification required',
                'message' => 'Please confirm this action via email or SMS.',
                'verification_required' => true,
                'risk_level' => 'high'
            ], 403);
        }

        // Log high-risk behavior but allow action to continue
        Log::warning('High-risk behavior detected but allowed', [
            'user_id' => $user->id,
            'risk_score' => $riskScore,
            'action' => $this->determineAction($request, [])
        ]);

        return null; // Continue with request
    }

    /**
     * Check if action is sensitive and requires extra security
     */
    private function isSensitiveAction(string $action): bool
    {
        $sensitiveActions = [
            'payment',
            'bid',
            'profile_update',
            'password_change',
            'email_change',
            'bank_details_update',
            'contract_signing'
        ];

        return in_array($action, $sensitiveActions);
    }
}
