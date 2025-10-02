<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    /**
     * Display all reports
     */
    public function index(Request $request): Response
    {
        $query = Report::with(['reporter', 'reportedUser', 'project.job']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Search by user names
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('reportedUser', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(15);

        $stats = [
            'total_reports' => Report::count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
            'resolved_reports' => Report::where('status', 'resolved')->count(),
            'investigating_reports' => Report::where('status', 'investigating')->count(),
            'dismissed_reports' => Report::where('status', 'dismissed')->count(),
        ];

        return Inertia::render('Admin/Reports/Index', [
            'reports' => $reports,
            'stats' => $stats,
            'filters' => $request->only(['status', 'type', 'search']),
        ]);
    }

    /**
     * Show specific report details
     */
    public function show(Report $report): Response
    {
        $report->load([
            'reporter:id,first_name,last_name,email',
            'reportedUser:id,first_name,last_name,email,user_type,profile_status',
            'project:id,title,status,agreed_amount,created_at',
            'project.job:id,title'
        ]);

        // Get related reports involving the same users
        $relatedReports = Report::where(function ($query) use ($report) {
            $query->where('reporter_id', $report->reporter_id)
                  ->orWhere('reported_user_id', $report->reported_user_id);
        })
        ->where('id', '!=', $report->id)
        ->with(['reporter', 'reportedUser'])
        ->latest()
        ->limit(5)
        ->get();

        return Inertia::render('Admin/Reports/Show', [
            'report' => $report,
            'relatedReports' => $relatedReports,
        ]);
    }

    /**
     * Update report status
     */
    public function updateStatus(Request $request, Report $report)
    {
        $request->validate([
            'status' => 'required|in:pending,investigating,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:1000',
            'action_taken' => 'nullable|string|max:500',
        ]);

        $report->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'action_taken' => $request->action_taken,
            'resolved_at' => $request->status === 'resolved' ? now() : null,
            'resolved_by' => auth()->id(),
        ]);

        // If report is resolved and involves fraud, consider suspending the reported user
        if ($request->status === 'resolved' && $report->type === 'fraud') {
            $reportedUser = $report->reportedUser;
            if ($reportedUser) {
                // Check if user has multiple fraud reports
                $fraudReports = Report::where('reported_user_id', $reportedUser->id)
                    ->where('type', 'fraud')
                    ->where('status', 'resolved')
                    ->count();

                if ($fraudReports >= 3) {
                    $reportedUser->update(['profile_status' => 'rejected']);
                }
            }
        }

        return back()->with('success', 'Report status updated successfully.');
    }

    /**
     * Get fraud analytics
     */
    public function fraudAnalytics(): Response
    {
        $analytics = [
            'fraud_reports_by_month' => Report::where('type', 'fraud')
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get(),

            'top_reported_users' => User::whereHas('reportsReceived', function ($query) {
                $query->where('type', 'fraud')
                      ->where('status', '!=', 'dismissed');
            })
            ->withCount(['reportsReceived as fraud_reports' => function ($query) {
                $query->where('type', 'fraud');
            }])
            ->having('fraud_reports', '>', 0)
            ->orderBy('fraud_reports', 'desc')
            ->limit(10)
            ->get(),

            'fraud_patterns' => [
                'by_type' => Report::where('type', 'fraud')
                    ->selectRaw('description, COUNT(*) as frequency')
                    ->groupBy('description')
                    ->orderBy('frequency', 'desc')
                    ->limit(10)
                    ->get(),

                'by_time' => Report::where('type', 'fraud')
                    ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
                    ->groupBy('hour')
                    ->orderBy('hour')
                    ->get(),
            ],

            'prevention_metrics' => [
                'resolved_fraud_reports' => Report::where('type', 'fraud')->where('status', 'resolved')->count(),
                'dismissed_fraud_reports' => Report::where('type', 'fraud')->where('status', 'dismissed')->count(),
                'users_suspended_for_fraud' => User::where('profile_status', 'rejected')
                    ->whereHas('reportsReceived', function ($query) {
                        $query->where('type', 'fraud')->where('status', 'resolved');
                    })
                    ->count(),
            ],
        ];

        return Inertia::render('Admin/Reports/Analytics', [
            'analytics' => $analytics,
        ]);
    }

    /**
     * Bulk update reports
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'report_ids' => 'required|array',
            'report_ids.*' => 'exists:reports,id',
            'status' => 'required|in:pending,investigating,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        Report::whereIn('id', $request->report_ids)->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'resolved_at' => $request->status === 'resolved' ? now() : null,
            'resolved_by' => auth()->id(),
        ]);

        return back()->with('success', count($request->report_ids) . ' reports updated successfully.');
    }
}
