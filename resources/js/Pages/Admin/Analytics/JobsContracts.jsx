import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import AnalyticsLayout from './Layout';
import StatCard from '@/Components/Analytics/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

/**
 * JobsContracts Dashboard
 * Displays job postings and contract analytics
 */
export default function JobsContracts({ 
    period = 30,
    stats = {},
    jobTrends = {},
    contractStatus = {},
    topCategories = {}
}) {
    const formatNumber = (num) => {
        return Number(num).toLocaleString('en-US');
    };

    const formatCurrency = (amount) => {
        return '₱' + Number(amount || 0).toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                }
            }
        }
    };

    const barChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatNumber(context.parsed.x);
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                }
            },
            y: {
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
                },
                grid: {
                    display: false,
                }
            }
        }
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
                    padding: 15,
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                        return `${context.label}: ${formatNumber(context.parsed.y)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <AnalyticsLayout 
            title="Jobs & Contracts Analytics"
            activeTab="jobs-contracts"
            period={period}
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                    label="Total Jobs"
                    value={formatNumber(stats.total_jobs || 0)}
                    subtext={`Active: ${formatNumber(stats.active_jobs || 0)} (${stats.active_percentage || 0}%)`}
                    icon="work"
                    color="blue"
                />
                <StatCard
                    label="Total Contracts"
                    value={formatNumber(stats.total_contracts || 0)}
                    subtext={`Completed: ${formatNumber(stats.completed_contracts || 0)}`}
                    icon="description"
                    color="orange"
                />
                <StatCard
                    label="Avg Contract Value"
                    value={formatCurrency(stats.avg_contract_value)}
                    subtext="Average per contract"
                    icon="attach_money"
                    color="green"
                />
                <StatCard
                    label="Total Value"
                    value={formatCurrency(stats.total_contract_value)}
                    subtext="All completed contracts"
                    icon="trending_up"
                    color="purple"
                />
                <StatCard
                    label="Completion Rate"
                    value={`${stats.completion_rate || 0}%`}
                    subtext={`${formatNumber(stats.completed_contracts || 0)} of ${formatNumber(stats.total_contracts || 0)}`}
                    icon="check_circle"
                    color="indigo"
                    trend={stats.completion_rate > 85 ? 'up' : stats.completion_rate < 75 ? 'down' : 'neutral'}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Job Trends Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Job Postings Trend
                    </h3>
                    {jobTrends.labels ? (
                        <Line data={jobTrends} options={chartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        📊 Shows daily job postings over the last {period} days
                    </p>
                </div>

                {/* Contract Status Distribution */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Contract Status Distribution
                    </h3>
                    {contractStatus.labels ? (
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Pie data={contractStatus} options={pieChartOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        📋 Distribution of contracts by current status
                    </p>
                </div>

                {/* Top Job Categories */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Top 10 Job Categories
                    </h3>
                    {topCategories.labels ? (
                        <div style={{ height: '400px' }}>
                            <Bar 
                                data={topCategories}
                                options={barChartOptions}
                            />
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        🏆 Most popular job categories by volume
                    </p>
                </div>
            </div>

            {/* Contract Insights Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <span className="material-symbols-outlined mr-2">insights</span>
                    Contract Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Contracts</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatNumber(stats.total_contracts - stats.completed_contracts || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Currently in progress</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.completion_rate || 0}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Target: 85% 
                            <span className={`ml-2 ${stats.completion_rate >= 85 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stats.completion_rate >= 85 ? '✓' : '⚠'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Job Value</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(stats.avg_contract_value || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Average contract amount</p>
                    </div>
                </div>
            </div>
        </AnalyticsLayout>
    );
}
