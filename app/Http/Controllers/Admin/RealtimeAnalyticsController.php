<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\GigJob;
use App\Models\Contract;
use App\Models\Transaction;
use App\Models\Bid;
use App\Models\Review;
use App\Models\Report;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class RealtimeAnalyticsController
{
    /**
     * Get real-time analytics overview
     */
    public function overview(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = Cache::remember("analytics_overview_{$period}", 60, function () use ($period) {
            return [
                'users' => $this->getUserMetrics($period),
                'jobs' => $this->getJobMetrics($period),
                'financial' => $this->getFinancialMetrics($period),
                'quality' => $this->getQualityMetrics($period),
                'timestamp' => now()->toIso8601String(),
            ];
        });

        return response()->json($data);
    }

    /**
     * Get real-time user metrics
     */
    public function userMetrics(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = $this->getUserMetrics($period);
        $data['timestamp'] = now()->toIso8601String();

        return response()->json($data);
    }

    /**
     * Get real-time job & contract metrics
     */
    public function jobMetrics(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = $this->getJobMetrics($period);
        $data['timestamp'] = now()->toIso8601String();

        return response()->json($data);
    }

    /**
     * Get real-time financial metrics
     */
    public function financialMetrics(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = $this->getFinancialMetrics($period);
        $data['timestamp'] = now()->toIso8601String();

        return response()->json($data);
    }

    /**
     * Get real-time quality metrics
     */
    public function qualityMetrics(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = $this->getQualityMetrics($period);
        $data['timestamp'] = now()->toIso8601String();

        return response()->json($data);
    }

    /**
     * Get user growth chart data
     */
    public function userGrowthChart(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = [];
        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $gigWorkers = User::where('user_type', 'gig_worker')
                ->whereDate('created_at', $date)->count();
            $employers = User::where('user_type', 'employer')
                ->whereDate('created_at', $date)->count();
            
            $data['labels'][] = $date->format('M d');
            $data['gig_workers'][] = $gigWorkers;
            $data['employers'][] = $employers;
        }

        return response()->json($data);
    }

    /**
     * Get revenue trend chart data
     */
    public function revenueTrendChart(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = [
            'labels' => [],
            'revenue' => [],
            'platform_fees' => [],
        ];

        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $revenue = Transaction::where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('amount') ?? 0;
            // Platform fees are collected from escrow and fee transactions, not release
            $fees = Transaction::whereIn('type', ['escrow', 'fee'])
                ->where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('platform_fee') ?? 0;
            
            $data['labels'][] = $date->format('M d');
            $data['revenue'][] = $revenue;
            $data['platform_fees'][] = $fees;
        }

        return response()->json($data);
    }

    /**
     * Get job trends chart data
     */
    public function jobTrendsChart(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = [
            'labels' => [],
            'jobs_posted' => [],
            'contracts_created' => [],
        ];

        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $jobs = GigJob::whereDate('created_at', $date)->count();
            $contracts = Contract::whereDate('created_at', $date)->count();
            
            $data['labels'][] = $date->format('M d');
            $data['jobs_posted'][] = $jobs;
            $data['contracts_created'][] = $contracts;
        }

        return response()->json($data);
    }

    /**
     * Get quality trend chart data
     */
    public function qualityTrendChart(Request $request)
    {
        $period = $request->get('period', 30);
        
        $data = [
            'labels' => [],
            'match_quality' => [],
            'avg_rating' => [],
            'completion_rate' => [],
        ];

        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            
            // Match quality
            $matchQuality = Contract::whereDate('created_at', '<=', $date)
                ->avg('match_quality') ?? 0;
            
            // Average rating
            $avgRating = Review::whereDate('created_at', '<=', $date)
                ->avg('rating') ?? 0;
            
            // Completion rate
            $totalContracts = Contract::whereDate('created_at', '<=', $date)->count();
            $completedContracts = Contract::where('status', 'completed')
                ->whereDate('created_at', '<=', $date)->count();
            $completionRate = $totalContracts > 0 ? ($completedContracts / $totalContracts) * 100 : 0;
            
            $data['labels'][] = $date->format('M d');
            $data['match_quality'][] = round($matchQuality, 2);
            $data['avg_rating'][] = round($avgRating * 20, 2); // Convert to percentage
            $data['completion_rate'][] = round($completionRate, 2);
        }

        return response()->json($data);
    }

    // Private helper methods

    private function getUserMetrics($period)
    {
        $startDate = now()->subDays($period);
        
        return [
            'total' => User::where('is_admin', false)->count(),
            'gig_workers' => User::where('user_type', 'gig_worker')->count(),
            'employers' => User::where('user_type', 'employer')->count(),
            'verified' => User::where('profile_status', 'approved')->count(),
            'pending' => User::where('profile_status', 'pending')->count(),
            'new_today' => User::whereDate('created_at', today())->count(),
            'new_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
            'new_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            'email_verified' => User::whereNotNull('email_verified_at')->count(),
            'id_verified' => User::where('id_verification_status', 'verified')->count(),
        ];
    }

    private function getJobMetrics($period)
    {
        $startDate = now()->subDays($period);
        
        $totalJobs = GigJob::count();
        $activeJobs = GigJob::where('status', 'open')->count();
        $totalContracts = Contract::count();
        $completedContracts = Contract::where('status', 'completed')->count();
        $activeContracts = Contract::where('status', 'active')->count();
        
        return [
            'total_jobs' => $totalJobs,
            'active_jobs' => $activeJobs,
            'completed_jobs' => GigJob::where('status', 'completed')->count(),
            'total_contracts' => $totalContracts,
            'active_contracts' => $activeContracts,
            'completed_contracts' => $completedContracts,
            'completion_rate' => $totalContracts > 0 ? round(($completedContracts / $totalContracts) * 100, 1) : 0,
            'avg_contract_value' => Contract::where('status', 'completed')->avg('amount') ?? 0,
            'total_contract_value' => Contract::where('status', 'completed')->sum('amount') ?? 0,
            'new_jobs_today' => GigJob::whereDate('created_at', today())->count(),
            'new_contracts_today' => Contract::whereDate('created_at', today())->count(),
        ];
    }

    private function getFinancialMetrics($period)
    {
        $startDate = now()->subDays($period);
        
        $totalRevenue = Transaction::where('status', 'completed')->sum('amount') ?? 0;
        // Platform fees are collected from escrow and fee transactions, not release
        $platformFees = Transaction::whereIn('type', ['escrow', 'fee'])
            ->where('status', 'completed')
            ->sum('platform_fee') ?? 0;
        $totalTransactions = Transaction::count();
        $completedTransactions = Transaction::where('status', 'completed')->count();
        
        return [
            'total_revenue' => $totalRevenue,
            'platform_fees' => $platformFees,
            'this_month_revenue' => Transaction::where('status', 'completed')
                ->whereDate('created_at', '>=', now()->startOfMonth())
                ->sum('amount') ?? 0,
            'this_month_platform_fees' => Transaction::whereIn('type', ['escrow', 'fee'])
                ->where('status', 'completed')
                ->whereDate('created_at', '>=', now()->startOfMonth())
                ->sum('platform_fee') ?? 0,
            'today_revenue' => Transaction::where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('amount') ?? 0,
            'today_platform_fees' => Transaction::whereIn('type', ['escrow', 'fee'])
                ->where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('platform_fee') ?? 0,
            'total_transactions' => $totalTransactions,
            'completed_transactions' => $completedTransactions,
            'pending_transactions' => Transaction::where('status', 'pending')->count(),
            'success_rate' => $totalTransactions > 0 ? round(($completedTransactions / $totalTransactions) * 100, 1) : 0,
            'avg_transaction' => Transaction::where('status', 'completed')->avg('amount') ?? 0,
            'total_payouts' => Transaction::where('type', 'release')
                ->where('status', 'completed')
                ->sum('net_amount') ?? 0,
        ];
    }

    private function getQualityMetrics($period)
    {
        $startDate = now()->subDays($period);
        
        $totalContracts = Contract::count();
        $completedContracts = Contract::where('status', 'completed')->count();
        $cancelledContracts = Contract::where('status', 'cancelled')->count();
        $totalReports = Report::count();
        $totalReviews = Review::count();
        
        return [
            'avg_match_quality' => Contract::avg('match_quality') ?? 0,
            'avg_rating' => Review::avg('rating') ?? 0,
            'completion_rate' => $totalContracts > 0 ? round(($completedContracts / $totalContracts) * 100, 1) : 0,
            'cancellation_rate' => $totalContracts > 0 ? round(($cancelledContracts / $totalContracts) * 100, 2) : 0,
            'dispute_rate' => $totalContracts > 0 ? round(($totalReports / $totalContracts) * 100, 2) : 0,
            'pending_disputes' => Report::where('status', 'pending')->count(),
            'resolved_disputes' => Report::where('status', 'resolved')->count(),
            'perfect_ratings' => Review::where('rating', 5)->count(),
            'perfect_ratings_percentage' => $totalReviews > 0 ? round((Review::where('rating', 5)->count() / $totalReviews) * 100, 1) : 0,
            'total_reviews' => $totalReviews,
        ];
    }
}
