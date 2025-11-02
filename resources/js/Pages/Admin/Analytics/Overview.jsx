import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import AnalyticsLayout from './Layout';
import StatCard from '@/Components/Analytics/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

/**
 * Overview Dashboard
 * Displays user analytics including growth, distribution, and verification metrics
 */
export default function Overview({ 
    period = 30,
    stats = {},
    userGrowth = {},
    userDistribution = {},
    verificationStatus = {}
}) {
    // Format large numbers with commas
    const formatNumber = (num) => {
        return Number(num).toLocaleString('en-US');
    };

    // Chart options
    const lineChartOptions = {
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
            title="User Analytics"
            activeTab="overview"
            period={period}
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Users"
                    value={formatNumber(stats.total_users || 0)}
                    subtext={`New this month: ${formatNumber(stats.new_users_this_month || 0)}`}
                    icon="people"
                    color="blue"
                />
                <StatCard
                    label="Gig Workers"
                    value={formatNumber(stats.gig_workers || 0)}
                    subtext={`${stats.gig_worker_percentage || 0}% of total`}
                    icon="work"
                    color="orange"
                />
                <StatCard
                    label="Employers"
                    value={formatNumber(stats.employers || 0)}
                    subtext={`${stats.employer_percentage || 0}% of total`}
                    icon="business"
                    color="green"
                />
                <StatCard
                    label="Email Verified"
                    value={formatNumber(stats.email_verified || 0)}
                    subtext={`${stats.email_verified_percentage || 0}% verified`}
                    icon="mark_email_read"
                    color="indigo"
                />
                <StatCard
                    label="ID Verified"
                    value={formatNumber(stats.id_verified || 0)}
                    subtext={`${stats.id_verified_percentage || 0}% verified`}
                    icon="verified_user"
                    color="purple"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        User Growth Trend
                    </h3>
                    {userGrowth.labels ? (
                        <Line data={userGrowth} options={lineChartOptions} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                </div>

                {/* User Distribution Chart */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        User Type Distribution
                    </h3>
                    {userDistribution.labels ? (
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Pie data={userDistribution} options={pieChartOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            Loading chart...
                        </div>
                    )}
                </div>

                {/* Verification Status Chart */}
                {verificationStatus.labels && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Verification Status Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email Verification</p>
                                    <Doughnut 
                                        data={{
                                            labels: verificationStatus.labels.slice(0, 2),
                                            datasets: [verificationStatus.datasets[0]]
                                        }} 
                                        options={pieChartOptions} 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">ID Verification</p>
                                    <Doughnut 
                                        data={{
                                            labels: verificationStatus.labels.slice(2),
                                            datasets: [verificationStatus.datasets[1]]
                                        }} 
                                        options={pieChartOptions} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnalyticsLayout>
    );
}


