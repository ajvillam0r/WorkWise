import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import AnalyticsLayout from './Layout';
import StatCard from '@/Components/Analytics/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

/**
 * Quality Dashboard
 * Displays quality metrics, ratings, and dispute analytics
 */
export default function Quality({ 
    period = 30,
    stats = {},
    qualityTrend = {},
    ratingDistribution = {},
    disputeResolution = {},
    categoryQuality = {}
}) {
    const formatNumber = (num) => {
        return Number(num).toLocaleString('en-US');
    };

    const getQualityColor = (value, target = 80) => {
        if (value >= target) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
        if (value >= target - 10) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
        return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
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
                max: 100,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    callback: function(value) {
                        return value + '%';
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
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                },
                ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                    callback: function(value) {
                        return value + '%';
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

    const qualityColor = getQualityColor(stats.avg_match_quality, stats.match_quality_target);

    return (
        <AnalyticsLayout 
            title="Quality Metrics"
            activeTab="quality"
            period={period}
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    label="Avg Match Quality"
                    value={`${stats.avg_match_quality || 0}%`}
                    subtext={`Target: ${stats.match_quality_target || 80}%`}
                    icon="grade"
                    color={stats.avg_match_quality >= (stats.match_quality_target || 80) ? 'green' : 'orange'}
                    trend={stats.avg_match_quality >= (stats.match_quality_target || 80) ? 'up' : stats.avg_match_quality >= (stats.match_quality_target - 10) ? 'neutral' : 'down'}
                />
                <StatCard
                    label="Avg Rating"
                    value={`${(stats.avg_rating || 0).toFixed(1)}/5.0`}
                    subtext={`${formatNumber(stats.perfect_ratings || 0)} perfect ratings`}
                    icon="star"
                    color="yellow"
                    trend={stats.avg_rating >= 4.5 ? 'up' : 'neutral'}
                />
                <StatCard
                    label="Completion Rate"
                    value={`${stats.completion_rate || 0}%`}
                    subtext="Successfully completed"
                    icon="check_circle"
                    color="green"
                    trend={stats.completion_rate > 85 ? 'up' : 'neutral'}
                />
                <StatCard
                    label="Dispute Rate"
                    value={`${stats.dispute_rate || 0}%`}
                    subtext={`${formatNumber(stats.pending_disputes || 0)} pending`}
                    icon="flag"
                    color="red"
                    trend={stats.dispute_rate < 3 ? 'up' : stats.dispute_rate < 5 ? 'neutral' : 'down'}
                />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    label="Cancellation Rate"
                    value={`${stats.cancellation_rate || 0}%`}
                    subtext="Cancelled contracts"
                    icon="close"
                    color="orange"
                />
                <StatCard
                    label="Perfect Ratings (5⭐)"
                    value={`${stats.perfect_ratings_percentage || 0}%`}
                    subtext={`${formatNumber(stats.perfect_ratings || 0)} reviews`}
                    icon="favorite"
                    color="red"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Quality Trend Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Match Quality Trend ({period} days)
                    </h3>
                    {qualityTrend.labels ? (
                        <Line data={qualityTrend} options={chartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        📊 Match quality percentage over time
                    </p>
                </div>

                {/* Rating Distribution Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Rating Distribution
                    </h3>
                    {ratingDistribution.labels ? (
                        <Bar data={ratingDistribution} options={barChartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        ⭐ Review rating breakdown
                    </p>
                </div>

                {/* Dispute Resolution Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Dispute Resolution Status
                    </h3>
                    {disputeResolution.labels ? (
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Doughnut data={disputeResolution} options={pieChartOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        ⚖️ Resolved vs pending disputes
                    </p>
                </div>

                {/* Category Quality Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Top Categories by Quality
                    </h3>
                    {categoryQuality.labels ? (
                        <Bar data={categoryQuality} options={barChartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        🏆 Highest quality job categories
                    </p>
                </div>
            </div>

            {/* Quality Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Quality Summary */}
                <div className={`${qualityColor.bg} rounded-lg p-6 border border-gray-200 dark:border-gray-600`}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <span className="material-symbols-outlined mr-2">trending_up</span>
                        Match Quality Analysis
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Quality</span>
                                <span className={`text-2xl font-bold ${qualityColor.text}`}>
                                    {stats.avg_match_quality || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${stats.avg_match_quality >= (stats.match_quality_target || 80) ? 'bg-green-600' : 'bg-amber-600'}`}
                                    style={{ width: `${Math.min(stats.avg_match_quality || 0, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-3 border-t border-gray-300 dark:border-gray-500">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Target</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {stats.match_quality_target || 80}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-gray-600 dark:text-gray-400">Variance</span>
                                <span className={`font-semibold ${stats.avg_match_quality >= (stats.match_quality_target || 80) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stats.avg_match_quality >= (stats.match_quality_target || 80) 
                                        ? `+${(stats.avg_match_quality - (stats.match_quality_target || 80)).toFixed(1)}%` 
                                        : `${(stats.avg_match_quality - (stats.match_quality_target || 80)).toFixed(1)}%`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating & Dispute Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <span className="material-symbols-outlined mr-2">assessment</span>
                        Quality Scorecard
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {(stats.avg_rating || 0).toFixed(1)}/5.0 ⭐
                                </p>
                            </div>
                            <span className="text-2xl">⭐</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {stats.completion_rate || 0}%
                                </p>
                            </div>
                            <span className="text-2xl">✓</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Dispute Rate</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {stats.dispute_rate || 0}%
                                </p>
                            </div>
                            <span className={`text-2xl ${stats.dispute_rate < 3 ? '✓' : '⚠'}`}></span>
                        </div>
                    </div>
                </div>
            </div>
        </AnalyticsLayout>
    );
}
