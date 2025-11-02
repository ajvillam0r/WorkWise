import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import AnalyticsLayout from './Layout';
import StatCard from '@/Components/Analytics/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

/**
 * Financial Dashboard
 * Displays revenue and transaction analytics
 */
export default function Financial({ 
    period = 30,
    stats = {},
    revenueTrend = {},
    topEarners = {},
    monthlyRevenue = {}
}) {
    const formatCurrency = (amount) => {
        return '₱' + Number(amount || 0).toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        });
    };

    const formatNumber = (num) => {
        return Number(num).toLocaleString('en-US');
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
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed.y);
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    callback: function(value) {
                        return '₱' + value.toLocaleString();
                    }
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
                        return formatCurrency(context.parsed.x);
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
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    callback: function(value) {
                        return '₱' + (value / 1000).toFixed(0) + 'K';
                    }
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

    const columnChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    callback: function(value) {
                        return '₱' + (value / 1000).toFixed(0) + 'K';
                    }
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

    return (
        <AnalyticsLayout 
            title="Financial Analytics"
            activeTab="financial"
            period={period}
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats.total_revenue)}
                    subtext={`This month: ${formatCurrency(stats.this_month_revenue)}`}
                    icon="trending_up"
                    color="green"
                />
                <StatCard
                    label="Platform Fees"
                    value={formatCurrency(stats.platform_fees)}
                    subtext={`${stats.platform_fee_percentage || 0}% of revenue`}
                    icon="percent"
                    color="blue"
                />
                <StatCard
                    label="Processed Volume"
                    value={formatCurrency(stats.processed_volume)}
                    subtext="Total transaction volume"
                    icon="account_balance_wallet"
                    color="orange"
                />
                <StatCard
                    label="Avg Transaction"
                    value={formatCurrency(stats.avg_transaction)}
                    subtext={`Success Rate: ${stats.success_rate || 0}%`}
                    icon="receipt_long"
                    color="purple"
                />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    label="Total Payouts"
                    value={formatCurrency(stats.total_payouts)}
                    subtext="Paid to gig workers"
                    icon="payment"
                    color="indigo"
                />
                <StatCard
                    label="Transaction Success"
                    value={`${stats.success_rate || 0}%`}
                    subtext="Successfully completed"
                    icon="verified"
                    color="green"
                    trend={stats.success_rate >= 98 ? 'up' : 'neutral'}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Trend Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Revenue Trend ({period} days)
                    </h3>
                    {revenueTrend.labels ? (
                        <Line data={revenueTrend} options={chartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        📈 Daily revenue collection trend
                    </p>
                </div>

                {/* Top Earners Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Top 10 Earning Gig Workers
                    </h3>
                    {topEarners.labels ? (
                        <div style={{ height: '280px' }}>
                            <Bar 
                                data={topEarners}
                                options={barChartOptions}
                            />
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        🏆 Highest earning gig workers by total earnings
                    </p>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Monthly Revenue (Last 12 Months)
                    </h3>
                    {monthlyRevenue.labels ? (
                        <div style={{ height: '350px' }}>
                            <Bar 
                                data={monthlyRevenue}
                                options={columnChartOptions}
                            />
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        📊 Year-over-year revenue performance
                    </p>
                </div>
            </div>

            {/* Financial Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <span className="material-symbols-outlined mr-2">trending_up</span>
                        Revenue Analysis
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(stats.total_revenue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(stats.this_month_revenue)}
                            </span>
                        </div>
                        <div className="border-t border-green-200 dark:border-green-700 pt-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Average</span>
                            <span className="font-bold text-green-700 dark:text-green-300">
                                {formatCurrency((stats.total_revenue || 0) / (period || 30))}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <span className="material-symbols-outlined mr-2">receipt</span>
                        Platform Metrics
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(stats.platform_fees)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fee Percentage</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {stats.platform_fee_percentage || 0}%
                            </span>
                        </div>
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                            <span className={`font-bold ${stats.success_rate >= 95 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-600 dark:text-amber-400'}`}>
                                {stats.success_rate || 0}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <span className="material-symbols-outlined mr-2">paid</span>
                        Payout Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {formatCurrency(stats.total_payouts)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Processed Volume</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {formatCurrency(stats.processed_volume)}
                            </span>
                        </div>
                        <div className="border-t border-purple-200 dark:border-purple-700 pt-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Transaction</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                                {formatCurrency(stats.avg_transaction)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AnalyticsLayout>
    );
}
