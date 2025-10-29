import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Chart from 'chart.js/auto';

export default function AnalyticsOverview({ auth, analytics }) {
    useEffect(() => {
        // User Growth Over Time Chart
        const userGrowthCtx = document.getElementById('userGrowthOverTime')?.getContext('2d');
        if (userGrowthCtx) {
            new Chart(userGrowthCtx, {
                type: 'line',
                data: {
                    labels: analytics.monthly_growth?.labels || [],
                    datasets: [
                        {
                            label: 'Gig Workers',
                            data: analytics.monthly_growth?.gig_workers || [],
                            borderColor: 'rgb(79, 70, 229)',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Employers',
                            data: analytics.monthly_growth?.employers || [],
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: analytics.revenue?.labels || [],
                    datasets: [{
                        label: 'Platform Revenue',
                        data: analytics.revenue?.amounts || [],
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // User Type Distribution
        const userTypeCtx = document.getElementById('userTypeDistribution')?.getContext('2d');
        if (userTypeCtx) {
            new Chart(userTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Gig Workers', 'Employers', 'Admins'],
                    datasets: [{
                        data: [
                            analytics.user_distribution?.gig_workers || 0,
                            analytics.user_distribution?.employers || 0,
                            analytics.user_distribution?.admins || 0
                        ],
                        backgroundColor: [
                            'rgb(79, 70, 229)',
                            'rgb(16, 185, 129)',
                            'rgb(239, 68, 68)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }, [analytics]);

    return (
        <AdminLayout>
            <Head title="Analytics Overview" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Analytics Overview
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Comprehensive platform analytics and insights
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.location.href = route('admin.analytics.export', { format: 'pdf' })}
                            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700"
                        >
                            <span className="material-symbols-outlined mr-2">picture_as_pdf</span>
                            Export PDF
                        </button>
                        <button
                            onClick={() => window.location.href = route('admin.analytics.export', { format: 'csv' })}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                        >
                            <span className="material-symbols-outlined mr-2">download</span>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-3xl text-blue-500">people</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Total Users
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                {analytics.total_users || 0}
                                            </div>
                                            {analytics.user_growth_percent && (
                                                <div className={`ml-2 flex items-baseline text-sm font-semibold ${analytics.user_growth_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {analytics.user_growth_percent > 0 ? '+' : ''}{analytics.user_growth_percent}%
                                                </div>
                                            )}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-3xl text-green-500">trending_up</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Total Revenue
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                ₱{analytics.total_revenue ? Number(analytics.total_revenue).toLocaleString() : '0'}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-3xl text-purple-500">cases</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Active Projects
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                {analytics.active_projects || 0}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-3xl text-yellow-500">payment</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Avg. Transaction
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                ₱{analytics.avg_transaction ? Number(analytics.avg_transaction).toLocaleString() : '0'}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Growth Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                                User Growth Over Time
                            </h3>
                            <div className="h-80">
                                <canvas id="userGrowthOverTime"></canvas>
                            </div>
                        </div>
                    </div>

                    {/* User Type Distribution */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                                User Distribution
                            </h3>
                            <div className="h-80">
                                <canvas id="userTypeDistribution"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                            Monthly Revenue
                        </h3>
                        <div className="h-80">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/admin/analytics/users"
                        className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">User Analytics</h3>
                                <p className="text-sm opacity-90">Detailed user metrics</p>
                            </div>
                            <span className="material-symbols-outlined text-4xl opacity-75">person_search</span>
                        </div>
                    </Link>

                    <Link
                        href="/admin/analytics/financial"
                        className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Financial Analytics</h3>
                                <p className="text-sm opacity-90">Revenue & transactions</p>
                            </div>
                            <span className="material-symbols-outlined text-4xl opacity-75">account_balance</span>
                        </div>
                    </Link>

                    <Link
                        href="/admin/analytics/projects"
                        className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Project Analytics</h3>
                                <p className="text-sm opacity-90">Project statistics</p>
                            </div>
                            <span className="material-symbols-outlined text-4xl opacity-75">analytics</span>
                        </div>
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}


