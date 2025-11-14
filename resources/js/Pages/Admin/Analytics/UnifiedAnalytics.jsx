import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

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

export default function UnifiedAnalytics({ auth }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [metrics, setMetrics] = useState(null);
    const [chartData, setChartData] = useState({});
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

            setChartData({
                userGrowth,
                revenueTrend,
                jobTrends,
                qualityTrend
            });
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
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchMetrics]);

    if (isLoading || !metrics) {
        return (
            <AdminLayout>
                <Head title="Analytics" />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading analytics...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const tabs = [
        { id: 'overview', name: 'User Analytics', icon: 'people' },
        { id: 'jobs', name: 'Jobs & Contracts', icon: 'work' },
        { id: 'financial', name: 'Financial', icon: 'payments' },
        { id: 'quality', name: 'Quality Metrics', icon: 'star' }
    ];

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

    // Chart data configurations
    const userGrowthChartData = chartData.userGrowth ? {
        labels: chartData.userGrowth.labels,
        datasets: [
            {
                label: 'Gig Workers',
                data: chartData.userGrowth.gig_workers,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Employers',
                data: chartData.userGrowth.employers,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const userDistributionData = {
        labels: ['Gig Workers', 'Employers'],
        datasets: [{
            data: [metrics.users.gig_workers, metrics.users.employers],
            backgroundColor: ['rgb(79, 70, 229)', 'rgb(16, 185, 129)'],
            borderWidth: 0
        }]
    };

    const revenueTrendChartData = chartData.revenueTrend ? {
        labels: chartData.revenueTrend.labels,
        datasets: [
            {
                label: 'Revenue',
                data: chartData.revenueTrend.revenue,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Platform Fees',
                data: chartData.revenueTrend.platform_fees,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const jobTrendsChartData = chartData.jobTrends ? {
        labels: chartData.jobTrends.labels,
        datasets: [
            {
                label: 'Jobs Posted',
                data: chartData.jobTrends.jobs_posted,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Contracts Created',
                data: chartData.jobTrends.contracts_created,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const contractStatusData = {
        labels: ['Active', 'Completed'],
        datasets: [{
            data: [metrics.jobs.active_contracts, metrics.jobs.completed_contracts],
            backgroundColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
            borderWidth: 0
        }]
    };

    const qualityTrendChartData = chartData.qualityTrend ? {
        labels: chartData.qualityTrend.labels,
        datasets: [
            {
                label: 'Match Quality %',
                data: chartData.qualityTrend.match_quality,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Completion Rate %',
                data: chartData.qualityTrend.completion_rate,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    return (
        <AdminLayout>
            <Head title="Analytics Dashboard" />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>

                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Auto-refresh</span>
                        </label>

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

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* User Analytics Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-indigo-600">Gig Workers</h3>
                                    <div className="bg-indigo-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">work</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-indigo-900">{formatNumber(metrics.users.gig_workers)}</p>
                                <p className="text-sm text-indigo-600 mt-2">{((metrics.users.gig_workers / metrics.users.total) * 100).toFixed(1)}% of total</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-green-600">Employers</h3>
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">business</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-900">{formatNumber(metrics.users.employers)}</p>
                                <p className="text-sm text-green-600 mt-2">{((metrics.users.employers / metrics.users.total) * 100).toFixed(1)}% of total</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-purple-600">Verified Users</h3>
                                    <div className="bg-purple-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">verified</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{formatNumber(metrics.users.verified)}</p>
                                <p className="text-sm text-purple-600 mt-2">{((metrics.users.verified / metrics.users.total) * 100).toFixed(1)}% verified</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
                                <div className="h-64">
                                    {userGrowthChartData && <Line data={userGrowthChartData} options={chartOptions} />}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Type Distribution</h3>
                                <div className="h-64 flex items-center justify-center">
                                    <div className="w-full max-w-xs">
                                        <Doughnut data={userDistributionData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Jobs & Contracts Tab */}
                {activeTab === 'jobs' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-orange-600">Total Jobs</h3>
                                    <div className="bg-orange-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">work</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-orange-900">{formatNumber(metrics.jobs.total_jobs)}</p>
                                <p className="text-sm text-orange-600 mt-2">{metrics.jobs.active_jobs} active</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-purple-600">Total Contracts</h3>
                                    <div className="bg-purple-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">description</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{formatNumber(metrics.jobs.total_contracts)}</p>
                                <p className="text-sm text-purple-600 mt-2">{metrics.jobs.active_contracts} active</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-green-600">Completion Rate</h3>
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-900">{metrics.jobs.completion_rate}%</p>
                                <p className="text-sm text-green-600 mt-2">{formatNumber(metrics.jobs.completed_contracts)} completed</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-blue-600">Avg Contract Value</h3>
                                    <div className="bg-blue-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">attach_money</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{formatCurrency(metrics.jobs.avg_contract_value)}</p>
                                <p className="text-sm text-blue-600 mt-2">Average per contract</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs & Contracts Trend</h3>
                                <div className="h-64">
                                    {jobTrendsChartData && <Line data={jobTrendsChartData} options={chartOptions} />}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Status</h3>
                                <div className="h-64 flex items-center justify-center">
                                    <div className="w-full max-w-xs">
                                        <Doughnut data={contractStatusData} options={{ ...chartOptions, maintainAspectRatio: true }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Financial Tab */}
                {activeTab === 'financial' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-green-600">Total Revenue</h3>
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">trending_up</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-900">{formatCurrency(metrics.financial.total_revenue)}</p>
                                <p className="text-sm text-green-600 mt-2">{formatCurrency(metrics.financial.today_revenue)} today</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-blue-600">Platform Fees</h3>
                                    <div className="bg-blue-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">percent</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{formatCurrency(metrics.financial.platform_fees)}</p>
                                <p className="text-sm text-blue-600 mt-2">Total earnings</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-purple-600">Success Rate</h3>
                                    <div className="bg-purple-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">verified</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{metrics.financial.success_rate}%</p>
                                <p className="text-sm text-purple-600 mt-2">Transaction success</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-orange-600">Avg Transaction</h3>
                                    <div className="bg-orange-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">receipt</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-orange-900">{formatCurrency(metrics.financial.avg_transaction)}</p>
                                <p className="text-sm text-orange-600 mt-2">Average value</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                                <div className="h-80">
                                    {revenueTrendChartData && <Line data={revenueTrendChartData} options={chartOptions} />}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Quality Metrics Tab */}
                {activeTab === 'quality' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-purple-600">Match Quality</h3>
                                    <div className="bg-purple-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">grade</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{metrics.quality.avg_match_quality.toFixed(1)}%</p>
                                <p className="text-sm text-purple-600 mt-2">Average quality</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-yellow-600">Avg Rating</h3>
                                    <div className="bg-yellow-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">star</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-yellow-900">{metrics.quality.avg_rating.toFixed(1)}/5.0</p>
                                <p className="text-sm text-yellow-600 mt-2">{metrics.quality.perfect_ratings_percentage}% perfect</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-green-600">Completion Rate</h3>
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-900">{metrics.quality.completion_rate}%</p>
                                <p className="text-sm text-green-600 mt-2">Successfully completed</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-red-600">Dispute Rate</h3>
                                    <div className="bg-red-500 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-white text-xl">flag</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-red-900">{metrics.quality.dispute_rate}%</p>
                                <p className="text-sm text-red-600 mt-2">{metrics.quality.pending_disputes} pending</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics Trend</h3>
                                <div className="h-80">
                                    {qualityTrendChartData && <Line data={qualityTrendChartData} options={chartOptions} />}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
