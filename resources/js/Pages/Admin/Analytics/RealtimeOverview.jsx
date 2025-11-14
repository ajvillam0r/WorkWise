import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function RealtimeOverview({ auth }) {
    const [metrics, setMetrics] = useState(null);
    const [userGrowthData, setUserGrowthData] = useState(null);
    const [revenueTrendData, setRevenueTrendData] = useState(null);
    const [jobTrendsData, setJobTrendsData] = useState(null);
    const [qualityTrendData, setQualityTrendData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [period, setPeriod] = useState(30);

    const formatNumber = (num) => {
        if (!num) return '0';
        return new Intl.NumberFormat().format(num);
    };

    const formatCurrency = (num) => {
        if (!num) return '₱0.00';
        return '₱' + new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // Fetch all metrics
    const fetchMetrics = useCallback(async () => {
        try {
            const response = await fetch(`/admin/api/analytics/overview?period=${period}`);
            const data = await response.json();
            setMetrics(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }, [period]);

    // Fetch chart data
    const fetchChartData = useCallback(async () => {
        try {
            const [userGrowth, revenueTrend, jobTrends, qualityTrend] = await Promise.all([
                fetch(`/admin/api/analytics/user-growth-chart?period=${period}`).then(r => r.json()),
                fetch(`/admin/api/analytics/revenue-trend-chart?period=${period}`).then(r => r.json()),
                fetch(`/admin/api/analytics/job-trends-chart?period=${period}`).then(r => r.json()),
                fetch(`/admin/api/analytics/quality-trend-chart?period=${period}`).then(r => r.json())
            ]);

            setUserGrowthData(userGrowth);
            setRevenueTrendData(revenueTrend);
            setJobTrendsData(jobTrends);
            setQualityTrendData(qualityTrend);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    }, [period]);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchMetrics(), fetchChartData()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchMetrics, fetchChartData, period]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchMetrics();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, fetchMetrics]);

    if (isLoading || !metrics) {
        return (
            <AdminLayout>
                <Head title="Real-time Analytics" />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading analytics...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Chart configurations
    const userGrowthChartData = userGrowthData ? {
        labels: userGrowthData.labels,
        datasets: [
            {
                label: 'Gig Workers',
                data: userGrowthData.gig_workers,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Employers',
                data: userGrowthData.employers,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const revenueTrendChartData = revenueTrendData ? {
        labels: revenueTrendData.labels,
        datasets: [
            {
                label: 'Revenue',
                data: revenueTrendData.revenue,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Platform Fees',
                data: revenueTrendData.platform_fees,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const jobTrendsChartData = jobTrendsData ? {
        labels: jobTrendsData.labels,
        datasets: [
            {
                label: 'Jobs Posted',
                data: jobTrendsData.jobs_posted,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Contracts Created',
                data: jobTrendsData.contracts_created,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const qualityTrendChartData = qualityTrendData ? {
        labels: qualityTrendData.labels,
        datasets: [
            {
                label: 'Match Quality %',
                data: qualityTrendData.match_quality,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Avg Rating %',
                data: qualityTrendData.avg_rating,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Completion Rate %',
                data: qualityTrendData.completion_rate,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: { size: 11 }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { font: { size: 10 } }
            },
            x: {
                ticks: { font: { size: 10 } }
            }
        }
    };

    return (
        <AdminLayout>
            <Head title="Real-time Analytics Overview" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Real-time Analytics</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Period Selector */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>

                    {/* Auto-refresh Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Auto-refresh</span>
                    </label>

                    {/* Manual Refresh */}
                    <button
                        onClick={() => {
                            fetchMetrics();
                            fetchChartData();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Users */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-blue-600">Total Users</h3>
                        <div className="bg-blue-500 p-2 rounded-full">
                            <span className="material-symbols-outlined text-white text-xl">people</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{formatNumber(metrics.users.total)}</p>
                    <p className="text-sm text-blue-600 mt-2">+{metrics.users.new_today} today</p>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-green-600">Total Revenue</h3>
                        <div className="bg-green-500 p-2 rounded-full">
                            <span className="material-symbols-outlined text-white text-xl">payments</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(metrics.financial.total_revenue)}</p>
                    <p className="text-sm text-green-600 mt-2">{formatCurrency(metrics.financial.today_revenue)} today</p>
                </div>

                {/* Jobs & Contracts */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-purple-600">Active Contracts</h3>
                        <div className="bg-purple-500 p-2 rounded-full">
                            <span className="material-symbols-outlined text-white text-xl">description</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{formatNumber(metrics.jobs.active_contracts)}</p>
                    <p className="text-sm text-purple-600 mt-2">{metrics.jobs.completion_rate}% completion rate</p>
                </div>

                {/* Quality */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-yellow-600">Avg Rating</h3>
                        <div className="bg-yellow-500 p-2 rounded-full">
                            <span className="material-symbols-outlined text-white text-xl">star</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-yellow-900">{metrics.quality.avg_rating.toFixed(1)}/5.0</p>
                    <p className="text-sm text-yellow-600 mt-2">{metrics.quality.perfect_ratings_percentage}% perfect ratings</p>
                </div>
            </div>

            {/* Navigation to Detailed Pages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link
                    href="/admin/analytics"
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">User Analytics</h3>
                        <span className="material-symbols-outlined text-indigo-600">arrow_forward</span>
                    </div>
                    <p className="text-sm text-gray-600">View detailed user growth, distribution, and verification metrics</p>
                </Link>

                <Link
                    href="/admin/analytics/jobs-contracts"
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Jobs & Contracts</h3>
                        <span className="material-symbols-outlined text-purple-600">arrow_forward</span>
                    </div>
                    <p className="text-sm text-gray-600">Analyze job postings, contracts, and completion rates</p>
                </Link>

                <Link
                    href="/admin/analytics/financial"
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Financial Analytics</h3>
                        <span className="material-symbols-outlined text-green-600">arrow_forward</span>
                    </div>
                    <p className="text-sm text-gray-600">Track revenue, transactions, and platform earnings</p>
                </Link>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
                    <div className="h-64">
                        {userGrowthChartData && (
                            <Line data={userGrowthChartData} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                    <div className="h-64">
                        {revenueTrendChartData && (
                            <Line data={revenueTrendChartData} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Job Trends */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs & Contracts Trend</h3>
                    <div className="h-64">
                        {jobTrendsChartData && (
                            <Line data={jobTrendsChartData} options={chartOptions} />
                        )}
                    </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics Trend</h3>
                    <div className="h-64">
                        {qualityTrendChartData && (
                            <Line data={qualityTrendChartData} options={chartOptions} />
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gig Workers</span>
                            <span className="font-semibold">{formatNumber(metrics.users.gig_workers)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Employers</span>
                            <span className="font-semibold">{formatNumber(metrics.users.employers)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Verified</span>
                            <span className="font-semibold text-green-600">{formatNumber(metrics.users.verified)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pending</span>
                            <span className="font-semibold text-yellow-600">{formatNumber(metrics.users.pending)}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Metrics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Platform Fees</span>
                            <span className="font-semibold">{formatCurrency(metrics.financial.platform_fees)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">This Month</span>
                            <span className="font-semibold">{formatCurrency(metrics.financial.this_month_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Success Rate</span>
                            <span className="font-semibold text-green-600">{metrics.financial.success_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Transaction</span>
                            <span className="font-semibold">{formatCurrency(metrics.financial.avg_transaction)}</span>
                        </div>
                    </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Match Quality</span>
                            <span className="font-semibold">{metrics.quality.avg_match_quality.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Completion Rate</span>
                            <span className="font-semibold text-green-600">{metrics.quality.completion_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Dispute Rate</span>
                            <span className="font-semibold text-red-600">{metrics.quality.dispute_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Perfect Ratings</span>
                            <span className="font-semibold">{formatNumber(metrics.quality.perfect_ratings)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
