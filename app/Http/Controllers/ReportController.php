<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display user's submitted reports
     */
    public function index(): Response
    {
        $reports = Report::where('reporter_id', auth()->id())
            ->with(['reportedUser', 'project.job'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Reports/Index', [
            'reports' => $reports
        ]);
    }

    /**
     * Submit a new report
     */
    public function store(Request $request)
    {
        $request->validate([
            'reported_user_id' => 'required|exists:users,id|different:reporter_id',
            'project_id' => 'nullable|exists:projects,id',
            'type' => 'required|in:fraud,spam,inappropriate,scam,fake_profile,other',
            'description' => 'required|string|min:20|max:1000',
            'evidence' => 'nullable|array',
            'evidence.*' => 'string|max:500'
        ]);

        // Ensure user can't report themselves
        if ($request->reported_user_id == auth()->id()) {
            return back()->withErrors(['reported_user_id' => 'You cannot report yourself.']);
        }

        // Check if user has already reported this user for the same project
        $existingReport = Report::where('reporter_id', auth()->id())
            ->where('reported_user_id', $request->reported_user_id)
            ->where('project_id', $request->project_id)
            ->where('type', $request->type)
            ->first();

        if ($existingReport) {
            return back()->withErrors(['report' => 'You have already submitted a similar report for this user.']);
        }

        Report::create([
            'reporter_id' => auth()->id(),
            'reported_user_id' => $request->reported_user_id,
            'project_id' => $request->project_id,
            'type' => $request->type,
            'description' => $request->description,
            'evidence' => $request->evidence,
            'status' => 'pending'
        ]);

        return back()->with('success', 'Report submitted successfully. We will review it and take appropriate action.');
    }

    /**
     * Display specific report details
     */
    public function show(Report $report): Response
    {
        // Ensure user can only view their own reports
        if ($report->reporter_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $report->load(['reportedUser', 'project.job', 'reporter']);

        return Inertia::render('Reports/Show', [
            'report' => $report
        ]);
    }

    /**
     * Show report form for specific user
     */
    public function create(Request $request): Response
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'project_id' => 'nullable|exists:projects,id'
        ]);

        $reportedUser = User::findOrFail($request->user_id);
        $project = $request->project_id ? Project::findOrFail($request->project_id) : null;

        // Ensure user can't report themselves
        if ($reportedUser->id === auth()->id()) {
            abort(403, 'You cannot report yourself.');
        }

        return Inertia::render('Reports/Create', [
            'reportedUser' => $reportedUser,
            'project' => $project,
            'reportTypes' => [
                'fraud' => 'Fraudulent activity or scam',
                'spam' => 'Spam or unwanted messages',
                'inappropriate' => 'Inappropriate behavior or content',
                'scam' => 'Attempted scam or deception',
                'fake_profile' => 'Fake or misleading profile',
                'other' => 'Other violation'
            ]
        ]);
    }

    /**
     * Get report statistics (for admin dashboard)
     */
    public function statistics()
    {
        $stats = [
            'total_reports' => Report::count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
            'resolved_reports' => Report::where('status', 'resolved')->count(),
            'reports_by_type' => Report::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'recent_reports' => Report::with(['reporter', 'reportedUser'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
        ];

        return response()->json($stats);
    }

    /**
     * Admin: Update report status
     */
    public function updateStatus(Request $request, Report $report)
    {
        // This would be for admin users only
        // For demo purposes, we'll allow any user to simulate admin actions

        $request->validate([
            'status' => 'required|in:pending,investigating,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:1000'
        ]);

        $report->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'resolved_at' => $request->status === 'resolved' ? now() : null
        ]);

        return back()->with('success', 'Report status updated successfully.');
    }

    /**
     * Get fraud detection insights
     */
    public function fraudInsights()
    {
        // AI-powered fraud detection insights
        $insights = [
            'high_risk_users' => User::whereHas('reportsReceived', function($query) {
                $query->where('type', 'fraud')
                      ->where('status', '!=', 'dismissed');
            })
            ->withCount('reportsReceived')
            ->having('reports_received_count', '>=', 2)
            ->limit(10)
            ->get(),

            'fraud_patterns' => [
                'common_types' => Report::where('type', 'fraud')
                    ->selectRaw('description, COUNT(*) as frequency')
                    ->groupBy('description')
                    ->orderBy('frequency', 'desc')
                    ->limit(5)
                    ->get(),

                'time_patterns' => Report::selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
                    ->groupBy('hour')
                    ->orderBy('hour')
                    ->get()
            ],

            'prevention_tips' => [
                'Always verify freelancer credentials before hiring',
                'Use the platform\'s escrow system for payments',
                'Be cautious of unusually low bids or prices',
                'Report suspicious behavior immediately',
                'Check user reviews and ratings carefully'
            ]
        ];

        return response()->json($insights);
    }
}
