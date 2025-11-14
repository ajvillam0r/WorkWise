<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Report;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\Bid;
use App\Models\Contract;
use App\Models\GigJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Get real-time dashboard statistics
     */
    public function realtimeStats()
    {
        $stats = [
            // User Statistics
            'users' => [
                'total' => User::where('is_admin', false)->count(),
                'gig_workers' => User::where('user_type', 'gig_worker')->count(),
                'employers' => User::where('user_type', 'employer')->count(),
                'verified' => User::where('profile_status', 'approved')->count(),
                'pending' => User::where('profile_status', 'pending')->count(),
                'suspended' => User::where('profile_status', 'rejected')->count(),
                'new_today' => User::where('is_admin', false)->whereDate('created_at', today())->count(),
                'new_this_week' => User::where('is_admin', false)->where('created_at', '>=', now()->startOfWeek())->count(),
                'new_this_month' => User::where('is_admin', false)->where('created_at', '>=', now()->startOfMonth())->count(),
                'email_verified' => User::whereNotNull('email_verified_at')->count(),
                'email_unverified' => User::whereNull('email_verified_at')->count(),
            ],
            
            // ID Verification Statistics
            'id_verification' => [
                'pending' => User::where('id_verification_status', 'pending')->whereNotNull('id_front_image')->count(),
                'verified' => User::where('id_verification_status', 'verified')->count(),
                'rejected' => User::where('id_verification_status', 'rejected')->count(),
                'total_submissions' => User::whereNotNull('id_front_image')->count(),
            ],
            
            // Job Statistics
            'jobs' => [
                'total' => GigJob::count(),
                'open' => GigJob::where('status', 'open')->count(),
                'in_progress' => GigJob::where('status', 'in_progress')->count(),
                'completed' => GigJob::where('status', 'completed')->count(),
                'closed' => GigJob::where('status', 'closed')->count(),
                'new_today' => GigJob::whereDate('created_at', today())->count(),
            ],
            
            // Project Statistics
            'projects' => [
                'total' => Project::count(),
                'active' => Project::whereIn('status', ['active', 'in_progress'])->count(),
                'completed' => Project::where('status', 'completed')->count(),
                'cancelled' => Project::where('status', 'cancelled')->count(),
                'average_value' => Project::avg('agreed_amount') ?? 0,
            ],
            
            // Bid Statistics
            'bids' => [
                'total' => Bid::count(),
                'pending' => Bid::where('status', 'pending')->count(),
                'accepted' => Bid::where('status', 'accepted')->count(),
                'rejected' => Bid::where('status', 'rejected')->count(),
                'new_today' => Bid::whereDate('created_at', today())->count(),
            ],
            
            // Contract Statistics
            'contracts' => [
                'total' => Contract::count(),
                'active' => Contract::where('status', 'active')->count(),
                'completed' => Contract::where('status', 'completed')->count(),
                'cancelled' => Contract::where('status', 'cancelled')->count(),
            ],
            
            // Transaction Statistics
            'transactions' => [
                'total' => Transaction::count(),
                'completed' => Transaction::where('status', 'completed')->count(),
                'pending' => Transaction::where('status', 'pending')->count(),
                'failed' => Transaction::where('status', 'failed')->count(),
                'total_value' => Transaction::where('status', 'completed')->sum('amount') ?? 0,
                'platform_earnings' => Transaction::where('type', 'release')->where('status', 'completed')->sum('platform_fee') ?? 0,
                'today_value' => Transaction::where('status', 'completed')->whereDate('created_at', today())->sum('amount') ?? 0,
            ],
            
            // Report Statistics
            'reports' => [
                'total' => Report::count(),
                'pending' => Report::where('status', 'pending')->count(),
                'investigating' => Report::where('status', 'investigating')->count(),
                'resolved' => Report::where('status', 'resolved')->count(),
                'dismissed' => Report::where('status', 'dismissed')->count(),
                'new_today' => Report::whereDate('created_at', today())->count(),
            ],
            
            // Timestamp for real-time updates
            'last_updated' => now()->toIso8601String(),
        ];

        return response()->json($stats);
    }

    /**
     * Get real-time user growth data for charts
     */
    public function userGrowthData(Request $request)
    {
        $period = $request->get('period', '7days'); // 7days, 30days, 12months
        
        $data = [];
        
        switch ($period) {
            case '7days':
                for ($i = 6; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $data['labels'][] = $date->format('M d');
                    $data['gig_workers'][] = User::where('user_type', 'gig_worker')
                        ->whereDate('created_at', $date)->count();
                    $data['employers'][] = User::where('user_type', 'employer')
                        ->whereDate('created_at', $date)->count();
                }
                break;
                
            case '30days':
                for ($i = 29; $i >= 0; $i--) {
                    $date = now()->subDays($i);
                    $data['labels'][] = $date->format('M d');
                    $data['gig_workers'][] = User::where('user_type', 'gig_worker')
                        ->whereDate('created_at', $date)->count();
                    $data['employers'][] = User::where('user_type', 'employer')
                        ->whereDate('created_at', $date)->count();
                }
                break;
                
            case '12months':
                for ($i = 11; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $data['labels'][] = $date->format('M Y');
                    $data['gig_workers'][] = User::where('user_type', 'gig_worker')
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count();
                    $data['employers'][] = User::where('user_type', 'employer')
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count();
                }
                break;
        }
        
        return response()->json($data);
    }

    /**
     * Get real-time activity feed
     */
    public function realtimeActivities(Request $request)
    {
        $limit = $request->get('limit', 20);
        $activities = collect();

        // Recent user registrations
        $recentUsers = User::where('is_admin', false)
            ->latest()
            ->limit(5)
            ->get();
            
        foreach ($recentUsers as $user) {
            $activities->push([
                'id' => 'user_' . $user->id,
                'type' => 'user_registration',
                'title' => "New {$user->user_type}: {$user->first_name} {$user->last_name}",
                'subtitle' => "Email: {$user->email} • Status: " . ucfirst($user->profile_status ?? 'pending'),
                'timestamp' => $user->created_at->toIso8601String(),
                'time_ago' => $user->created_at->diffForHumans(),
                'icon' => 'person_add',
                'color' => 'blue',
                'link' => "/admin/users/{$user->id}",
            ]);
        }

        // Recent job postings
        $recentJobs = GigJob::with('employer')
            ->latest()
            ->limit(5)
            ->get();
            
        foreach ($recentJobs as $job) {
            $activities->push([
                'id' => 'job_' . $job->id,
                'type' => 'job_posted',
                'title' => "New Job: {$job->title}",
                'subtitle' => "Posted by: " . ($job->employer ? $job->employer->first_name . ' ' . $job->employer->last_name : 'Unknown'),
                'timestamp' => $job->created_at->toIso8601String(),
                'time_ago' => $job->created_at->diffForHumans(),
                'icon' => 'work',
                'color' => 'green',
                'link' => "/jobs/{$job->id}",
            ]);
        }

        // Recent bids
        $recentBids = Bid::with(['gigWorker', 'job'])
            ->latest()
            ->limit(5)
            ->get();
            
        foreach ($recentBids as $bid) {
            $activities->push([
                'id' => 'bid_' . $bid->id,
                'type' => 'bid_placed',
                'title' => "New Bid: ₱" . number_format($bid->amount, 2),
                'subtitle' => "By: " . ($bid->gigWorker ? $bid->gigWorker->first_name . ' ' . $bid->gigWorker->last_name : 'Unknown') . 
                             " on " . ($bid->job ? $bid->job->title : 'Unknown Job'),
                'timestamp' => $bid->created_at->toIso8601String(),
                'time_ago' => $bid->created_at->diffForHumans(),
                'icon' => 'local_offer',
                'color' => 'purple',
                'link' => "/jobs/{$bid->job_id}",
            ]);
        }

        // Recent transactions
        $recentTransactions = Transaction::with(['payer', 'payee'])
            ->where('status', 'completed')
            ->latest()
            ->limit(5)
            ->get();
            
        foreach ($recentTransactions as $transaction) {
            $activities->push([
                'id' => 'transaction_' . $transaction->id,
                'type' => 'payment_completed',
                'title' => "Payment: ₱" . number_format($transaction->amount, 2),
                'subtitle' => "From: " . ($transaction->payer ? $transaction->payer->first_name : 'Unknown') . 
                             " to " . ($transaction->payee ? $transaction->payee->first_name : 'Unknown'),
                'timestamp' => $transaction->created_at->toIso8601String(),
                'time_ago' => $transaction->created_at->diffForHumans(),
                'icon' => 'payments',
                'color' => 'emerald',
                'link' => "/admin/payments",
            ]);
        }

        // Recent reports
        $recentReports = Report::with(['reporter', 'reportedUser'])
            ->latest()
            ->limit(5)
            ->get();
            
        foreach ($recentReports as $report) {
            $activities->push([
                'id' => 'report_' . $report->id,
                'type' => 'report_filed',
                'title' => "New Report: {$report->reason}",
                'subtitle' => "Reporter: " . ($report->reporter ? $report->reporter->first_name : 'Unknown') . 
                             " • Status: " . ucfirst($report->status),
                'timestamp' => $report->created_at->toIso8601String(),
                'time_ago' => $report->created_at->diffForHumans(),
                'icon' => 'flag',
                'color' => 'red',
                'link' => "/admin/reports/{$report->id}",
            ]);
        }

        // Sort by timestamp and limit
        $activities = $activities->sortByDesc('timestamp')->take($limit)->values();

        return response()->json($activities);
    }

    /**
     * Get platform health metrics
     */
    public function platformHealth()
    {
        $health = [
            'overall_status' => 'healthy', // healthy, warning, critical
            'metrics' => [
                'database' => [
                    'status' => 'healthy',
                    'response_time' => $this->checkDatabaseHealth(),
                ],
                'user_activity' => [
                    'status' => $this->getUserActivityStatus(),
                    'active_users_today' => User::whereDate('updated_at', today())->count(),
                ],
                'transaction_health' => [
                    'status' => $this->getTransactionHealth(),
                    'success_rate' => $this->getTransactionSuccessRate(),
                ],
                'report_queue' => [
                    'status' => $this->getReportQueueStatus(),
                    'pending_count' => Report::where('status', 'pending')->count(),
                ],
            ],
            'last_checked' => now()->toIso8601String(),
        ];

        return response()->json($health);
    }

    /**
     * Get revenue analytics
     */
    public function revenueAnalytics(Request $request)
    {
        $period = $request->get('period', '30days');
        
        $data = [
            'labels' => [],
            'revenue' => [],
            'transactions' => [],
        ];
        
        if ($period === '30days') {
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $data['labels'][] = $date->format('M d');
                $data['revenue'][] = Transaction::where('type', 'release')
                    ->where('status', 'completed')
                    ->whereDate('created_at', $date)
                    ->sum('platform_fee');
                $data['transactions'][] = Transaction::where('status', 'completed')
                    ->whereDate('created_at', $date)
                    ->count();
            }
        }
        
        return response()->json($data);
    }

    // Helper methods
    private function checkDatabaseHealth()
    {
        $start = microtime(true);
        DB::select('SELECT 1');
        $end = microtime(true);
        return round(($end - $start) * 1000, 2); // milliseconds
    }

    private function getUserActivityStatus()
    {
        $activeToday = User::whereDate('updated_at', today())->count();
        $totalUsers = User::where('is_admin', false)->count();
        
        if ($totalUsers == 0) return 'warning';
        
        $activityRate = ($activeToday / $totalUsers) * 100;
        
        if ($activityRate > 20) return 'healthy';
        if ($activityRate > 10) return 'warning';
        return 'critical';
    }

    private function getTransactionHealth()
    {
        $successRate = $this->getTransactionSuccessRate();
        
        if ($successRate > 95) return 'healthy';
        if ($successRate > 85) return 'warning';
        return 'critical';
    }

    private function getTransactionSuccessRate()
    {
        $total = Transaction::whereDate('created_at', '>=', now()->subDays(7))->count();
        if ($total == 0) return 100;
        
        $successful = Transaction::where('status', 'completed')
            ->whereDate('created_at', '>=', now()->subDays(7))
            ->count();
            
        return round(($successful / $total) * 100, 2);
    }

    private function getReportQueueStatus()
    {
        $pending = Report::where('status', 'pending')->count();
        
        if ($pending < 5) return 'healthy';
        if ($pending < 15) return 'warning';
        return 'critical';
    }
}
