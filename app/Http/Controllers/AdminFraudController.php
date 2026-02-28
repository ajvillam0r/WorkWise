<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\FraudDetectionCase;
use App\Models\FraudDetectionAlert;
use App\Models\FraudDetectionRule;
use App\Models\FraudWatchlist;
use App\Models\GigJob;
use App\Models\ImmutableAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AdminFraudController extends Controller
{
    /**
     * Fraud detection dashboard
     */
    public function dashboard(): Response
    {
        $stats = [
            'total_cases' => FraudDetectionCase::count(),
            'active_cases' => FraudDetectionCase::where('status', 'investigating')->count(),
            'resolved_cases' => FraudDetectionCase::where('status', 'resolved')->count(),
            'critical_cases' => FraudDetectionCase::where('severity', 'critical')->count(),
            'total_alerts' => FraudDetectionAlert::count(),
            'active_alerts' => FraudDetectionAlert::where('status', 'active')->count(),
            'acknowledged_alerts' => FraudDetectionAlert::where('status', 'acknowledged')->count(),
            'false_positives' => FraudDetectionAlert::where('status', 'false_positive')->count(),
            'enabled_rules' => FraudDetectionRule::where('enabled', true)->count(),
            'total_rules' => FraudDetectionRule::count(),
            'avg_risk_score' => FraudDetectionCase::avg('fraud_score') ?? 0,
        ];

        $recentCases = FraudDetectionCase::with(['user', 'assignedAdmin'])
            ->latest()
            ->limit(5)
            ->get();

        $recentAlerts = FraudDetectionAlert::with(['user', 'assignedAdmin'])
            ->latest()
            ->limit(10)
            ->get();

        $topRiskUsers = User::select('users.*')
            ->join('fraud_detection_cases', 'users.id', '=', 'fraud_detection_cases.user_id')
            ->where('fraud_detection_cases.status', '!=', 'false_positive')
            ->groupBy('users.id')
            ->orderByRaw('COUNT(*) DESC, MAX(fraud_detection_cases.fraud_score) DESC')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Fraud/Dashboard', [
            'stats' => $stats,
            'recentCases' => $recentCases,
            'recentAlerts' => $recentAlerts,
            'topRiskUsers' => $topRiskUsers,
        ]);
    }

    /**
     * List all fraud detection cases
     */
    public function cases(Request $request): Response
    {
        $query = FraudDetectionCase::with(['user', 'assignedAdmin']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by severity
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by fraud type
        if ($request->filled('fraud_type')) {
            $query->where('fraud_type', $request->fraud_type);
        }

        // Search by case ID or user
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('case_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                               ->orWhere('last_name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $cases = $query->orderBy('detected_at', 'desc')->paginate(15);

        return Inertia::render('Admin/Fraud/Cases/Index', [
            'cases' => $cases,
            'filters' => $request->only(['status', 'severity', 'fraud_type', 'search']),
        ]);
    }

    /**
     * Show specific fraud case details
     */
    public function showCase(FraudDetectionCase $case): Response
    {
        $case->load([
            'user',
            'assignedAdmin',
            'alerts' => function ($query) {
                $query->orderBy('triggered_at', 'desc');
            }
        ]);

        $relatedCases = FraudDetectionCase::where('user_id', $case->user_id)
            ->where('id', '!=', $case->id)
            ->orderBy('detected_at', 'desc')
            ->limit(5)
            ->get();

        $watchlistEntry = FraudWatchlist::where('user_id', $case->user_id)->with('addedBy')->first();

        $userJobs = GigJob::where('employer_id', $case->user_id)->latest()->get();

        return Inertia::render('Admin/Fraud/Cases/Show', [
            'fraudCase' => $case,
            'relatedCases' => $relatedCases,
            'watchlistEntry' => $watchlistEntry,
            'userJobs' => $userJobs,
        ]);
    }

    /**
     * Update fraud case status
     */
    public function updateCaseStatus(Request $request, FraudDetectionCase $case)
    {
        $request->validate([
            'status' => 'required|in:investigating,confirmed,false_positive,resolved',
            'severity' => 'required|in:low,medium,high,critical',
            'investigation_notes' => 'nullable|string',
            'resolution_data' => 'nullable|array',
        ]);

        $oldStatus = $case->status;
        $updateData = [
            'status' => $request->status,
            'severity' => $request->severity,
        ];

        if ($request->status === 'resolved' && $request->filled('resolution_data')) {
            $updateData['resolved_at'] = now();
            $updateData['resolution_data'] = $request->resolution_data;
        }

        $case->update($updateData);

        // Add investigation note if provided
        if ($request->filled('investigation_notes')) {
            $case->addInvestigationNote(
                $request->investigation_notes,
                auth()->user()
            );
        }

        // Log the status change
        ImmutableAuditLog::createLog(
            'fraud_detection_cases',
            'UPDATE',
            $case->id,
            auth()->id(),
            'admin',
            ['status' => $oldStatus],
            ['status' => $request->status],
            ['action' => 'status_update', 'reason' => 'admin_action']
        );

        return back()->with('success', 'Fraud case status updated successfully.');
    }

    /**
     * Assign case to admin
     */
    public function assignCase(Request $request, FraudDetectionCase $case)
    {
        $request->validate([
            'admin_id' => 'required|exists:users,id',
        ]);

        $oldAdminId = $case->assigned_admin_id;
        $case->update([
            'assigned_admin_id' => $request->admin_id,
        ]);

        // Log the assignment
        ImmutableAuditLog::createLog(
            'fraud_detection_cases',
            'UPDATE',
            $case->id,
            auth()->id(),
            'admin',
            ['assigned_admin_id' => $oldAdminId],
            ['assigned_admin_id' => $request->admin_id],
            ['action' => 'case_assignment']
        );

        return back()->with('success', 'Case assigned successfully.');
    }

    /**
     * List fraud detection alerts
     */
    public function alerts(Request $request): Response
    {
        $query = FraudDetectionAlert::with(['user', 'assignedAdmin', 'fraudCase']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by severity
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by alert type
        if ($request->filled('alert_type')) {
            $query->where('alert_type', $request->alert_type);
        }

        // Search by alert ID or user
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('alert_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                               ->orWhere('last_name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $alerts = $query->orderBy('triggered_at', 'desc')->paginate(20);

        return Inertia::render('Admin/Fraud/Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $request->only(['status', 'severity', 'alert_type', 'search']),
        ]);
    }

    /**
     * Show specific alert details
     */
    public function showAlert(FraudDetectionAlert $alert): Response
    {
        $alert->load(['user', 'assignedAdmin', 'fraudCase']);

        return Inertia::render('Admin/Fraud/Alerts/Show', [
            'alert' => $alert,
        ]);
    }

    /**
     * Acknowledge alert
     */
    public function acknowledgeAlert(FraudDetectionAlert $alert)
    {
        $alert->acknowledge(auth()->user());

        return back()->with('success', 'Alert acknowledged successfully.');
    }

    /**
     * Resolve alert
     */
    public function resolveAlert(Request $request, FraudDetectionAlert $alert)
    {
        $request->validate([
            'resolution_notes' => 'required|string',
        ]);

        $alert->resolve([
            'notes' => $request->resolution_notes,
            'resolved_by' => auth()->id(),
            'resolved_at' => now()->toISOString(),
        ]);

        return back()->with('success', 'Alert resolved successfully.');
    }

    /**
     * Mark alert as false positive
     */
    public function markAlertFalsePositive(FraudDetectionAlert $alert)
    {
        $alert->markAsFalsePositive();

        return back()->with('success', 'Alert marked as false positive.');
    }

    /**
     * Fraud detection rules management
     */
    public function rules(Request $request): Response
    {
        $query = FraudDetectionRule::with(['creator', 'updater']);

        // Filter by status
        if ($request->filled('enabled')) {
            $query->where('enabled', $request->boolean('enabled'));
        }

        // Filter by type
        if ($request->filled('rule_type')) {
            $query->where('rule_type', $request->rule_type);
        }

        // Filter by severity
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        // Search by rule name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('rule_name', 'like', "%{$search}%");
        }

        $rules = $query->orderBy('priority', 'asc')->paginate(15);

        return Inertia::render('Admin/Fraud/Rules/Index', [
            'rules' => $rules,
            'filters' => $request->only(['enabled', 'rule_type', 'severity', 'search']),
        ]);
    }

    /**
     * Show rule details
     */
    public function showRule(FraudDetectionRule $rule): Response
    {
        $rule->load(['creator', 'updater']);

        return Inertia::render('Admin/Fraud/Rules/Show', [
            'rule' => $rule,
        ]);
    }

    /**
     * Toggle rule status
     */
    public function toggleRule(FraudDetectionRule $rule)
    {
        $oldStatus = $rule->enabled;
        $rule->update([
            'enabled' => !$oldStatus,
            'updated_by' => auth()->id(),
        ]);

        // Log the rule status change
        ImmutableAuditLog::createLog(
            'fraud_detection_rules',
            'UPDATE',
            $rule->id,
            auth()->id(),
            'admin',
            ['enabled' => $oldStatus],
            ['enabled' => !$oldStatus],
            ['action' => 'rule_toggle']
        );

        $status = $rule->enabled ? 'enabled' : 'disabled';
        return back()->with('success', "Rule {$status} successfully.");
    }

    /**
     * Audit logs viewer
     */
    public function auditLogs(Request $request): Response
    {
        $query = ImmutableAuditLog::with(['user'])
            ->orderBy('logged_at', 'desc');

        // Filter by user ID (e.g. from Case Show "View audit timeline for this user")
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by table
        if ($request->filled('table_name')) {
            $query->where('table_name', $request->table_name);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by user type
        if ($request->filled('user_type')) {
            $query->where('user_type', $request->user_type);
        }

        // Search by record ID or user
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('record_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('first_name', 'like', "%{$search}%")
                               ->orWhere('last_name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->paginate(25)->withQueryString();

        return Inertia::render('Admin/Fraud/AuditLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['table_name', 'action', 'user_type', 'search', 'user_id']),
        ]);
    }

    /**
     * Show audit log details
     */
    public function showAuditLog(ImmutableAuditLog $log): Response
    {
        $log->load(['user']);

        return Inertia::render('Admin/Fraud/AuditLogs/Show', [
            'log' => $log,
        ]);
    }

    /**
     * Verify audit log integrity
     */
    public function verifyAuditLog(ImmutableAuditLog $log)
    {
        $isValid = $log->verifyIntegrity();

        if (!$isValid) {
            Log::warning('Audit log integrity check failed', [
                'log_id' => $log->log_id,
                'user_id' => auth()->id(),
            ]);

            return back()->with('error', 'Audit log integrity check failed. Possible tampering detected.');
        }

        return back()->with('success', 'Audit log integrity verified successfully.');
    }

    /**
     * List watchlist entries
     */
    public function watchlist(): Response
    {
        $entries = FraudWatchlist::with(['user', 'addedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return Inertia::render('Admin/Fraud/Watchlist/Index', [
            'entries' => $entries,
        ]);
    }

    /**
     * Add user to watchlist
     */
    public function addToWatchlist(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        $userId = (int) $request->user_id;
        if (FraudWatchlist::where('user_id', $userId)->exists()) {
            return back()->with('error', 'User is already on the watchlist.');
        }

        FraudWatchlist::create([
            'user_id' => $userId,
            'added_by' => auth()->id(),
            'reason' => $request->reason,
        ]);

        ImmutableAuditLog::createLog(
            'fraud_watchlist',
            'CREATE',
            0,
            auth()->id(),
            'admin',
            null,
            ['user_id' => $userId, 'reason' => $request->reason],
            ['action' => 'add_to_watchlist']
        );

        return back()->with('success', 'User added to watchlist.');
    }

    /**
     * Remove user from watchlist
     */
    public function removeFromWatchlist(User $user)
    {
        $entry = FraudWatchlist::where('user_id', $user->id)->first();
        if (!$entry) {
            return back()->with('error', 'User is not on the watchlist.');
        }
        $entry->delete();

        ImmutableAuditLog::createLog(
            'fraud_watchlist',
            'DELETE',
            $entry->id,
            auth()->id(),
            'admin',
            ['user_id' => $user->id],
            null,
            ['action' => 'remove_from_watchlist']
        );

        return back()->with('success', 'User removed from watchlist.');
    }

    /**
     * Hide a job (admin – fraud case context)
     */
    public function hideJob(GigJob $job)
    {
        $job->update(['hidden_by_admin' => true]);
        ImmutableAuditLog::createLog(
            'gig_jobs',
            'UPDATE',
            $job->id,
            auth()->id(),
            'admin',
            ['hidden_by_admin' => false],
            ['hidden_by_admin' => true],
            ['action' => 'admin_hide_job']
        );
        return back()->with('success', 'Job hidden from public listing.');
    }

    /**
     * Unhide a job (admin)
     */
    public function unhideJob(GigJob $job)
    {
        $job->update(['hidden_by_admin' => false]);
        ImmutableAuditLog::createLog(
            'gig_jobs',
            'UPDATE',
            $job->id,
            auth()->id(),
            'admin',
            ['hidden_by_admin' => true],
            ['hidden_by_admin' => false],
            ['action' => 'admin_unhide_job']
        );
        return back()->with('success', 'Job is visible again.');
    }

    /**
     * Delete a job (admin – fraud context, bypasses employer check)
     */
    public function deleteJob(GigJob $job)
    {
        $jobId = $job->id;
        $title = $job->title;
        $job->delete();
        ImmutableAuditLog::createLog(
            'gig_jobs',
            'DELETE',
            $jobId,
            auth()->id(),
            'admin',
            ['id' => $jobId, 'title' => $title],
            null,
            ['action' => 'admin_delete_job']
        );
        return back()->with('success', 'Job deleted.');
    }

    /**
     * Require ID verification (KYC) for a user – blocks them until verified
     */
    public function requireKyc(User $user)
    {
        if ($user->isAdmin()) {
            return back()->with('error', 'Cannot require KYC for admin users.');
        }
        $user->update(['id_verification_required_by_admin' => true]);
        ImmutableAuditLog::createLog(
            'users',
            'UPDATE',
            $user->id,
            auth()->id(),
            'admin',
            ['id_verification_required_by_admin' => false],
            ['id_verification_required_by_admin' => true],
            ['action' => 'require_kyc_fraud']
        );
        return back()->with('success', 'User must complete ID verification before continuing. They have been blocked from other actions.');
    }

    /**
     * Clear mandatory KYC requirement for a user
     */
    public function clearKycRequirement(User $user)
    {
        $user->update(['id_verification_required_by_admin' => false]);
        ImmutableAuditLog::createLog(
            'users',
            'UPDATE',
            $user->id,
            auth()->id(),
            'admin',
            ['id_verification_required_by_admin' => true],
            ['id_verification_required_by_admin' => false],
            ['action' => 'clear_kyc_requirement']
        );
        return back()->with('success', 'KYC requirement cleared. User can use the platform without completing ID verification.');
    }

    /**
     * Fraud analytics and reporting
     */
    public function analytics(): Response
    {
        $analytics = [
            'fraud_trends' => $this->getFraudTrends(),
            'top_fraud_types' => $this->getTopFraudTypes(),
            'geographic_distribution' => $this->getGeographicDistribution(),
            'temporal_patterns' => $this->getTemporalPatterns(),
            'rule_effectiveness' => $this->getRuleEffectiveness(),
            'financial_impact' => $this->getFinancialImpact(),
        ];

        return Inertia::render('Admin/Fraud/Analytics/Index', [
            'analytics' => $analytics,
        ]);
    }

    /**
     * Get fraud trends data
     */
    private function getFraudTrends(): array
    {
        return FraudDetectionCase::selectRaw('
                DATE(detected_at) as date,
                COUNT(*) as cases,
                AVG(fraud_score) as avg_score,
                SUM(financial_impact) as total_impact
            ')
            ->where('detected_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    /**
     * Get top fraud types
     */
    private function getTopFraudTypes(): array
    {
        return FraudDetectionCase::selectRaw('fraud_type, COUNT(*) as count')
            ->groupBy('fraud_type')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get geographic distribution
     */
    private function getGeographicDistribution(): array
    {
        return FraudDetectionCase::selectRaw('
                JSON_UNQUOTE(JSON_EXTRACT(location_data, "$.country")) as country,
                COUNT(*) as cases
            ')
            ->whereNotNull('location_data')
            ->groupBy('country')
            ->orderBy('cases', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get temporal patterns
     */
    private function getTemporalPatterns(): array
    {
        $driver = DB::connection()->getDriverName();
        $hourExtract = $driver === 'pgsql' 
            ? "EXTRACT(HOUR FROM detected_at)" 
            : "HOUR(detected_at)";
        $dayName = $driver === 'pgsql' 
            ? "TO_CHAR(detected_at, 'Day')" 
            : "DAYNAME(detected_at)";

        return FraudDetectionCase::selectRaw("
                {$hourExtract} as hour,
                COUNT(*) as cases,
                {$dayName} as day_name
            ")
            ->where('detected_at', '>=', now()->subDays(7))
            ->groupBy('hour', 'day_name')
            ->orderBy('hour')
            ->get()
            ->toArray();
    }

    /**
     * Get rule effectiveness
     */
    private function getRuleEffectiveness(): array
    {
        return FraudDetectionRule::selectRaw('
                rule_name,
                trigger_count,
                enabled,
                severity,
                risk_score
            ')
            ->orderBy('trigger_count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get financial impact
     */
    private function getFinancialImpact(): array
    {
        return FraudDetectionCase::selectRaw('
                SUM(financial_impact) as total_impact,
                AVG(financial_impact) as avg_impact,
                COUNT(*) as total_cases,
                SUM(CASE WHEN status = "resolved" THEN financial_impact ELSE 0 END) as recovered_amount
            ')
            ->first()
            ->toArray();
    }
}
