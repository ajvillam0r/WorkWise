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
import { Line, Doughnut, Bar } from 'react-chartjs-2';

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

export default function RealtimeDashboard({ auth }) {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [userGrowthData, setUserGrowthData] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [platformHealth, setPlatformHealth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch real-time statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/admin/api/realtime-stats');
            const data = await response.json();
            setStats(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    // Fetch real-time activities
    const fetchActivities = useCallback(async () => {
        try {
            const response = await fetch('/admin/api/realtime-activities?limit=15');
            const data = await response.json();
            setActivities(data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    }, []);

    // Fetch user growth data
    const fetchUserGrowth = useCallback(async (period = '7days') => {
        try {
            const response = await fetch(`/admin/api/user-growth?period=${period}`);
            const data = await response.json();
            setUserGrowthData(data);
        } catch (error) {
            console.error('Error fetching user growth:', error);
        }
    }, []);

    // Fetch revenue analytics
    const fetchRevenue = useCallback(async () => {
        try {
            const response = await fetch('/admin/api/revenue-analytics?period=30days');
            const data = await response.json();
            setRevenueData(data);
        } catch (error) {
            console.error('Error fetching revenue:', error);
        }
    }, []);

    // Fetch platform health
    const fetchPlatformHealth = useCallback(async () => {
        try {
            const response = await fetch('/admin/api/platform-health');
            const data = await response.json();
            setPlatformHealth(data);
        } catch (error) {
            console.error('Error fetching platform health:', error);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchStats(),
                fetchActivities(),
                fetchUserGrowth(),
                fetchRevenue(),
                fetchPlatformHealth()
            ]);
            setIsLoading(false);
        };
        loadAllData();
    }, [fetchStats, fetchActivities, fetchUserGrowth, fetchRevenue, fetchPlatformHealth]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchStats();
            fetchActivities();
            fetchPlatformHealth();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats, fetchActivities, fetchPlatformHealth]);

    const formatNumber = (num) => {
        if (!num) return '0';
        return new Intl.NumberFormat().format(num);
    };

    const formatCurrency = (num) => {
        if (!num) return '₱0.00';
        return '₱' + new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (isLoading || !stats) {
        return (
            <AdminLayout>
                <Head title="Real-time Dashboard" />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading real-time data...</p>
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

    const userDistributionData = {
        labels: ['Gig Workers', 'Employers'],
        datasets: [{
            data: [stats.users.gig_workers, stats.users.employers],
            backgroundColor: ['rgb(79, 70, 229)', 'rgb(16, 185, 129)'],
            borderWidth: 0
        }]
    };

    const verificationStatusData = {
        labels: ['Verified', 'Pending', 'Suspended'],
        datasets: [{
            data: [stats.users.verified, stats.users.pending, stats.users.suspended],
            backgroundColor: ['rgb(16, 185, 129)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)'],
            borderWidth: 0
        }]
    };

    const revenueChartData = revenueData ? {
        labels: revenueData.labels,
        datasets: [{
            label: 'Platform Revenue',
            data: revenueData.revenue,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
        }]
    } : null;

    return (
        <AdminLayout>
            <Head title="Real-time Admin Dashboard" />

            {/* Header with Auto-refresh Toggle */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Real-time Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
                    </label>
                    <button
                        onClick={() => {
                            fetchStats();
                            fetchActivities();
                            fetchPlatformHealth();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Refresh Now</span>
                    </button>
                </div>
            </div>

            {/* Platform Health Alert */}
            {platformHealth && platformHealth.overall_status !== 'healthy' && (
                <div className={`mb-6 p-4 rounded-lg ${
                    platformHealth.overall_status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                }`}>
                    <div className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-2xl">
                            {platformHealth.overall_status === 'warning' ? 'warning' : 'error'}
                        </span>
                        <div>
                            <h3 className="font-semibold">Platform Health Alert</h3>
                            <p className="text-sm">Some metrics require attention. Check the health section below.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.users.total)}</p>
                            <p className="text-sm text-green-600 mt-1">+{stats.users.new_today} today</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <span className="material-symbols-outlined text-blue-600 text-2xl">people</span>
                        </div>
                    </div>
                </div>

                {/* Platform Revenue */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.transactions.platform_earnings)}</p>
                            <p className="text-sm text-gray-500 mt-1">Total earnings</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <span className="material-symbols-outlined text-green-600 text-2xl">payments</span>
                        </div>
                    </div>
                </div>

                {/* Active Projects */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Projects</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.projects.active)}</p>
                            <p className="text-sm text-gray-500 mt-1">of {formatNumber(stats.projects.total)} total</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <span className="material-symbols-outlined text-purple-600 text-2xl">work</span>
                        </div>
                    </div>
                </div>

                {/* Pending Reports */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.reports.pending)}</p>
                            <p className="text-sm text-red-600 mt-1">Needs attention</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <span className="material-symbols-outlined text-red-600 text-2xl">flag</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Today</span>
                            <span className="font-semibold text-gray-900">{formatNumber(stats.users.new_today)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">This Week</span>
                            <span className="font-semibold text-gray-900">{formatNumber(stats.users.new_this_week)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">This Month</span>
                            <span className="font-semibold text-gray-900">{formatNumber(stats.users.new_this_month)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Verified</span>
                            <span className="font-semibold text-green-600">{formatNumber(stats.users.verified)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pending</span>
                            <span className="font-semibold text-yellow-600">{formatNumber(stats.users.pending)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Suspended</span>
                            <span className="font-semibold text-red-600">{formatNumber(stats.users.suspended)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">ID Verification</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pending Review</span>
                            <span className="font-semibold text-orange-600">{formatNumber(stats.id_verification.pending)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Verified</span>
                            <span className="font-semibold text-green-600">{formatNumber(stats.id_verification.verified)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Rejected</span>
                            <span className="font-semibold text-red-600">{formatNumber(stats.id_verification.rejected)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
                    <div className="h-64">
                        {userGrowthChartData && (
                            <Line
                                data={userGrowthChartData}
                                options={{
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
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics (30 Days)</h3>
                    <div className="h-64">
                        {revenueChartData && (
                            <Bar
                                data={revenueChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false }
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
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Type Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-full max-w-xs">
                            <Doughnut
                                data={userDistributionData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    plugins: {
                                        legend: { 
                                            position: 'bottom',
                                            labels: {
                                                boxWidth: 12,
                                                padding: 8,
                                                font: { size: 11 }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-full max-w-xs">
                            <Doughnut
                                data={verificationStatusData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    plugins: {
                                        legend: { 
                                            position: 'bottom',
                                            labels: {
                                                boxWidth: 12,
                                                padding: 8,
                                                font: { size: 11 }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Health */}
            {platformHealth && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Database</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(platformHealth.metrics.database.status)}`}>
                                    {platformHealth.metrics.database.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Response: {platformHealth.metrics.database.response_time}ms</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">User Activity</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(platformHealth.metrics.user_activity.status)}`}>
                                    {platformHealth.metrics.user_activity.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Active today: {platformHealth.metrics.user_activity.active_users_today}</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Transactions</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(platformHealth.metrics.transaction_health.status)}`}>
                                    {platformHealth.metrics.transaction_health.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Success rate: {platformHealth.metrics.transaction_health.success_rate}%</p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Report Queue</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(platformHealth.metrics.report_queue.status)}`}>
                                    {platformHealth.metrics.report_queue.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Pending: {platformHealth.metrics.report_queue.pending_count}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time Activity Feed */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity Feed</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-${activity.color}-100`}>
                                <span className={`material-symbols-outlined text-${activity.color}-600 text-sm`}>
                                    {activity.icon}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                <p className="text-xs text-gray-500">{activity.subtitle}</p>
                                <p className="text-xs text-gray-400 mt-1">{activity.time_ago}</p>
                            </div>
                            {activity.link && (
                                <Link
                                    href={activity.link}
                                    className="flex-shrink-0 text-indigo-600 hover:text-indigo-700 text-sm"
                                >
                                    View →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
