<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\GigJob;
use App\Models\Contract;
use App\Models\Transaction;
use App\Models\Bid;
use App\Models\Review;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class AdminAnalyticsController
{
    /**
     * Get the period in days from request
     */
    protected function getPeriod(Request $request): int
    {
        $period = $request->query('period', 30);
        return in_array($period, [7, 30, 90]) ? $period : 30;
    }

    /**
     * Get date range for queries
     */
    protected function getDateRange(int $period): array
    {
        $endDate = now();
        $startDate = $endDate->copy()->subDays($period);
        return [$startDate, $endDate];
    }

    /**
     * Dashboard 1: User Analytics Overview
     */
    public function overview(Request $request)
    {
        $period = $this->getPeriod($request);
        [$startDate, $endDate] = $this->getDateRange($period);

        // Statistics Cards
        $stats = [
            'total_users' => User::count(),
            'new_users_this_month' => User::whereDate('created_at', '>=', now()->startOfMonth())->count(),
            'gig_workers' => User::where('user_type', 'gig_worker')->count(),
            'employers' => User::where('user_type', 'employer')->count(),
            'email_verified' => User::whereNotNull('email_verified_at')->count(),
            'id_verified' => User::where('id_verification_status', 'verified')->count(),
        ];

        // Calculate percentages
        $stats['gig_worker_percentage'] = $stats['total_users'] > 0 
            ? round(($stats['gig_workers'] / $stats['total_users']) * 100, 1)
            : 0;
        $stats['employer_percentage'] = $stats['total_users'] > 0 
            ? round(($stats['employers'] / $stats['total_users']) * 100, 1)
            : 0;
        $stats['email_verified_percentage'] = $stats['total_users'] > 0
            ? round(($stats['email_verified'] / $stats['total_users']) * 100, 1)
            : 0;
        $stats['id_verified_percentage'] = $stats['total_users'] > 0
            ? round(($stats['id_verified'] / $stats['total_users']) * 100, 1)
            : 0;

        // Charts data
        $userGrowth = $this->getUserGrowthData($period);
        $userDistribution = $this->getUserDistributionData();
        $verificationStatus = $this->getVerificationStatusData();

        return Inertia::render('Admin/Analytics/Overview', [
            'period' => $period,
            'stats' => $stats,
            'userGrowth' => $userGrowth,
            'userDistribution' => $userDistribution,
            'verificationStatus' => $verificationStatus,
        ]);
    }

    /**
     * Dashboard 2: Jobs & Contracts Analytics
     */
    public function jobsContracts(Request $request)
    {
        $period = $this->getPeriod($request);
        [$startDate, $endDate] = $this->getDateRange($period);

        // Statistics Cards
        $stats = [
            'total_jobs' => GigJob::count(),
            'active_jobs' => GigJob::where('status', 'active')->count(),
            'total_contracts' => Contract::count(),
            'completed_contracts' => Contract::where('status', 'completed')->count(),
            'avg_contract_value' => Contract::where('status', 'completed')->avg('amount') ?? 0,
            'total_contract_value' => Contract::where('status', 'completed')->sum('amount') ?? 0,
        ];

        // Calculate percentages
        $stats['active_percentage'] = $stats['total_jobs'] > 0
            ? round(($stats['active_jobs'] / $stats['total_jobs']) * 100, 1)
            : 0;
        $stats['completed_percentage'] = $stats['total_contracts'] > 0
            ? round(($stats['completed_contracts'] / $stats['total_contracts']) * 100, 1)
            : 0;

        // Calculate completion rate
        if ($stats['total_contracts'] > 0) {
            $stats['completion_rate'] = $stats['completed_percentage'];
        } else {
            $stats['completion_rate'] = 0;
        }

        // Charts data
        $jobTrends = $this->getJobTrendsData($period);
        $contractStatus = $this->getContractStatusData();
        $topCategories = $this->getTopCategoriesData();

        return Inertia::render('Admin/Analytics/JobsContracts', [
            'period' => $period,
            'stats' => $stats,
            'jobTrends' => $jobTrends,
            'contractStatus' => $contractStatus,
            'topCategories' => $topCategories,
        ]);
    }

    /**
     * Dashboard 3: Financial Analytics
     */
    public function financial(Request $request)
    {
        $period = $this->getPeriod($request);
        [$startDate, $endDate] = $this->getDateRange($period);

        // Statistics Cards
        $completedTransactions = Transaction::where('status', 'completed');
        $monthTransactions = $completedTransactions->copy()->whereDate('created_at', '>=', now()->startOfMonth());

        $stats = [
            'total_revenue' => $completedTransactions->sum('amount') ?? 0,
            'this_month_revenue' => $monthTransactions->sum('amount') ?? 0,
            'platform_fees' => Transaction::where('type', 'platform_fee')->where('status', 'completed')->sum('platform_fee') ?? 0,
            'processed_volume' => $completedTransactions->sum('amount') ?? 0,
            'avg_transaction' => $completedTransactions->avg('amount') ?? 0,
            'success_rate' => $this->getTransactionSuccessRate(),
            'total_payouts' => Transaction::where('type', 'payout')->where('status', 'completed')->sum('amount') ?? 0,
        ];

        // Calculate percentages
        $stats['platform_fee_percentage'] = $stats['total_revenue'] > 0
            ? round(($stats['platform_fees'] / $stats['total_revenue']) * 100, 1)
            : 0;

        // Charts data
        $revenueTrend = $this->getRevenueTrendData($period);
        $topEarners = $this->getTopEarnersData();
        $monthlyRevenue = $this->getMonthlyRevenueData();

        return Inertia::render('Admin/Analytics/Financial', [
            'period' => $period,
            'stats' => $stats,
            'revenueTrend' => $revenueTrend,
            'topEarners' => $topEarners,
            'monthlyRevenue' => $monthlyRevenue,
        ]);
    }

    /**
     * Dashboard 4: Quality Metrics
     */
    public function quality(Request $request)
    {
        $period = $this->getPeriod($request);
        [$startDate, $endDate] = $this->getDateRange($period);

        // Statistics Cards
        $stats = [
            'avg_match_quality' => Contract::avg('match_quality') ?? 0,
            'match_quality_target' => 80,
            'dispute_rate' => $this->getDisputeRate(),
            'pending_disputes' => Report::where('status', 'pending')->count(),
            'completion_rate' => $this->getCompletionRate(),
            'cancellation_rate' => $this->getCancellationRate(),
            'avg_rating' => Review::avg('rating') ?? 0,
            'perfect_ratings' => Review::where('rating', 5)->count(),
        ];

        // Calculate perfect ratings percentage
        $totalReviews = Review::count();
        $stats['perfect_ratings_percentage'] = $totalReviews > 0
            ? round(($stats['perfect_ratings'] / $totalReviews) * 100, 1)
            : 0;

        // Charts data
        $qualityTrend = $this->getQualityTrendData($period);
        $ratingDistribution = $this->getRatingDistributionData();
        $disputeResolution = $this->getDisputeResolutionData();
        $categoryQuality = $this->getCategoryQualityData();

        return Inertia::render('Admin/Analytics/Quality', [
            'period' => $period,
            'stats' => $stats,
            'qualityTrend' => $qualityTrend,
            'ratingDistribution' => $ratingDistribution,
            'disputeResolution' => $disputeResolution,
            'categoryQuality' => $categoryQuality,
        ]);
    }

    /**
     * Chart Data Methods
     */

    /**
     * User growth trend data (30-day)
     */
    protected function getUserGrowthData(int $period): array
    {
        [$startDate, $endDate] = $this->getDateRange($period);

        $data = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = User::whereDate('created_at', '<=', $date)->count();
            $data[] = [
                'date' => $date->format('M d'),
                'count' => $count,
            ];
        }

        return [
            'labels' => array_column($data, 'date'),
            'datasets' => [
                [
                    'label' => 'Total Users',
                    'data' => array_column($data, 'count'),
                    'borderColor' => '#6366f1',
                    'backgroundColor' => 'rgba(99, 102, 241, 0.1)',
                    'borderWidth' => 2,
                    'tension' => 0.4,
                    'fill' => true,
                ]
            ]
        ];
    }

    /**
     * User type distribution
     */
    protected function getUserDistributionData(): array
    {
        $gigWorkers = User::where('user_type', 'gig_worker')->count();
        $employers = User::where('user_type', 'employer')->count();

                return [
            'labels' => ['Gig Workers', 'Employers'],
            'datasets' => [
                [
                    'data' => [$gigWorkers, $employers],
                    'backgroundColor' => ['#f97316', '#10b981'],
                    'borderColor' => ['#fff', '#fff'],
                    'borderWidth' => 2,
                ]
            ]
        ];
    }

    /**
     * Verification status data
     */
    protected function getVerificationStatusData(): array
    {
        $emailVerified = User::whereNotNull('email_verified_at')->count();
        $emailUnverified = User::whereNull('email_verified_at')->count();

        return [
            'labels' => ['Email Verified', 'Email Unverified', 'ID Verified', 'ID Pending', 'ID Rejected'],
            'datasets' => [
                [
                    'label' => 'Email Verification',
                    'data' => [$emailVerified, $emailUnverified],
                    'backgroundColor' => ['#10b981', '#ef4444'],
                    'borderColor' => ['#fff', '#fff'],
                    'borderWidth' => 2,
                ],
                [
                    'label' => 'ID Verification',
                    'data' => [
                        User::where('id_verification_status', 'verified')->count(),
                        User::where('id_verification_status', 'pending')->count(),
                        User::where('id_verification_status', 'rejected')->count(),
                    ],
                    'backgroundColor' => ['#10b981', '#f59e0b', '#ef4444'],
                    'borderColor' => ['#fff', '#fff', '#fff'],
                    'borderWidth' => 2,
                ]
            ]
        ];
    }

    /**
     * Job postings trend data
     */
    protected function getJobTrendsData(int $period): array
    {
        [$startDate, $endDate] = $this->getDateRange($period);

        $data = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = GigJob::whereDate('created_at', $date->format('Y-m-d'))->count();
            $data[] = [
                'date' => $date->format('M d'),
                'count' => $count,
            ];
        }

                return [
            'labels' => array_column($data, 'date'),
            'datasets' => [
                [
                    'label' => 'Jobs Posted',
                    'data' => array_column($data, 'count'),
                    'borderColor' => '#14b8a6',
                    'backgroundColor' => 'rgba(20, 184, 166, 0.1)',
                    'borderWidth' => 2,
                    'tension' => 0.4,
                    'fill' => true,
                ]
            ]
        ];
    }

    /**
     * Contract status distribution
     */
    protected function getContractStatusData(): array
    {
        $active = Contract::where('status', 'active')->count();
        $completed = Contract::where('status', 'completed')->count();
        $cancelled = Contract::where('status', 'cancelled')->count();

                return [
            'labels' => ['Active', 'Completed', 'Cancelled'],
            'datasets' => [
                [
                    'label' => 'Count',
                    'data' => [$active, $completed, $cancelled],
                    'backgroundColor' => ['#3b82f6', '#10b981', '#ef4444'],
                    'borderColor' => ['#fff', '#fff', '#fff'],
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Top job categories
     */
    protected function getTopCategoriesData(): array
    {
        $categories = GigJob::select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        return [
            'labels' => $categories->pluck('category')->toArray(),
            'datasets' => [
                [
                    'label' => 'Job Count',
                    'data' => $categories->pluck('count')->toArray(),
                    'backgroundColor' => '#10b981',
                    'borderColor' => '#fff',
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Revenue trend data
     */
    protected function getRevenueTrendData(int $period): array
    {
        [$startDate, $endDate] = $this->getDateRange($period);

        $data = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $revenue = Transaction::where('status', 'completed')
                ->whereDate('created_at', $date->format('Y-m-d'))
                ->sum('amount') ?? 0;
            $data[] = [
                'date' => $date->format('M d'),
                'amount' => $revenue,
            ];
        }

        return [
            'labels' => array_column($data, 'date'),
            'datasets' => [
                [
                    'label' => 'Revenue',
                    'data' => array_column($data, 'amount'),
                    'borderColor' => '#10b981',
                    'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                    'borderWidth' => 2,
                    'tension' => 0.4,
                    'fill' => true,
                ]
            ]
        ];
    }

    /**
     * Top earning gig workers
     */
    protected function getTopEarnersData(): array
    {
        $earners = User::select('id', 'first_name', 'last_name', DB::raw('SUM(earned) as total_earned'))
            ->where('user_type', 'gig_worker')
            ->groupBy('id', 'first_name', 'last_name')
            ->orderBy('total_earned', 'desc')
            ->limit(10)
            ->get();

        $names = $earners->map(function ($user) {
            return $user->first_name . ' ' . $user->last_name;
        })->toArray();

        $earnings = $earners->pluck('total_earned')->map(function ($amount) {
            return (float)($amount ?? 0);
        })->toArray();

        return [
            'labels' => $names,
            'datasets' => [
                [
                    'label' => 'Total Earnings',
                    'data' => $earnings,
                    'backgroundColor' => '#f59e0b',
                    'borderColor' => '#fff',
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Monthly revenue for last 12 months
     */
    protected function getMonthlyRevenueData(): array
    {
        $data = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $revenue = Transaction::where('status', 'completed')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('amount') ?? 0;
            $data[] = [
                'month' => $month->format('M'),
                'amount' => $revenue,
            ];
        }

        return [
            'labels' => array_column($data, 'month'),
            'datasets' => [
                [
                    'label' => 'Monthly Revenue',
                    'data' => array_column($data, 'amount'),
                    'backgroundColor' => '#3b82f6',
                    'borderColor' => '#fff',
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Quality trend data
     */
    protected function getQualityTrendData(int $period): array
    {
        [$startDate, $endDate] = $this->getDateRange($period);

        $data = [];
        for ($i = $period; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $quality = Contract::whereDate('created_at', '<=', $date)->avg('match_quality') ?? 0;
            $data[] = [
                'date' => $date->format('M d'),
                'quality' => round($quality, 2),
            ];
        }

        return [
            'labels' => array_column($data, 'date'),
            'datasets' => [
                [
                    'label' => 'Match Quality %',
                    'data' => array_column($data, 'quality'),
                    'borderColor' => '#a855f7',
                    'backgroundColor' => 'rgba(168, 85, 247, 0.1)',
                    'borderWidth' => 2,
                    'tension' => 0.4,
                    'fill' => true,
                ]
            ]
        ];
    }

    /**
     * Rating distribution
     */
    protected function getRatingDistributionData(): array
    {
        $ratings = [
            1 => Review::where('rating', 1)->count(),
            2 => Review::where('rating', 2)->count(),
            3 => Review::where('rating', 3)->count(),
            4 => Review::where('rating', 4)->count(),
            5 => Review::where('rating', 5)->count(),
        ];

        return [
            'labels' => ['1⭐', '2⭐', '3⭐', '4⭐', '5⭐'],
            'datasets' => [
                [
                    'label' => 'Review Count',
                    'data' => array_values($ratings),
                    'backgroundColor' => '#f59e0b',
                    'borderColor' => '#fff',
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Dispute resolution status
     */
    protected function getDisputeResolutionData(): array
    {
        $resolved = Report::where('status', 'resolved')->count();
        $pending = Report::where('status', 'pending')->count();

        return [
            'labels' => ['Resolved', 'Pending'],
            'datasets' => [
                [
                    'data' => [$resolved, $pending],
                    'backgroundColor' => ['#10b981', '#ef4444'],
                    'borderColor' => ['#fff', '#fff'],
                    'borderWidth' => 2,
                ]
            ]
        ];
    }

    /**
     * Category quality ranking
     */
    protected function getCategoryQualityData(): array
    {
        $categories = GigJob::select('category', DB::raw('AVG(match_quality) as avg_quality'), DB::raw('COUNT(*) as count'))
            ->where('match_quality', '>', 0)
            ->groupBy('category')
            ->orderBy('avg_quality', 'desc')
            ->limit(8)
            ->get();

        return [
            'labels' => $categories->pluck('category')->toArray(),
            'datasets' => [
                [
                    'label' => 'Avg Quality %',
                    'data' => $categories->pluck('avg_quality')->map(function ($q) {
                        return round($q, 1);
                    })->toArray(),
                    'backgroundColor' => '#a855f7',
                    'borderColor' => '#fff',
                    'borderWidth' => 1,
                ]
            ]
        ];
    }

    /**
     * Helper Methods
     */

    /**
     * Calculate transaction success rate
     */
    protected function getTransactionSuccessRate(): float
    {
        $total = Transaction::count();
        if ($total === 0) return 0;

        $completed = Transaction::where('status', 'completed')->count();
        return round(($completed / $total) * 100, 1);
    }

    /**
     * Calculate dispute rate
     */
    protected function getDisputeRate(): float
    {
        $totalContracts = Contract::count();
        if ($totalContracts === 0) return 0;

        $disputes = Report::count();
        return round(($disputes / $totalContracts) * 100, 2);
    }

    /**
     * Calculate completion rate
     */
    protected function getCompletionRate(): float
    {
        $total = Contract::count();
        if ($total === 0) return 0;

        $completed = Contract::where('status', 'completed')->count();
        return round(($completed / $total) * 100, 1);
    }

    /**
     * Calculate cancellation rate
     */
    protected function getCancellationRate(): float
    {
        $total = Contract::count();
        if ($total === 0) return 0;

        $cancelled = Contract::where('status', 'cancelled')->count();
        return round(($cancelled / $total) * 100, 2);
    }
}
