import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DateRangeSelector from '@/Components/Analytics/DateRangeSelector';
import DashboardTabs from '@/Components/Analytics/DashboardTabs';

/**
 * Analytics Layout Component
 * Provides shared layout for all analytics dashboards
 * 
 * Props:
 * - title: string - Page title
 * - activeTab: string - Current active tab
 * - period: number - Current period
 * - children: React nodes - Dashboard content
 * - canExport: bool - Whether to show export button
 */
export default function AnalyticsLayout({ 
    title, 
    activeTab = 'overview', 
    period = 30, 
    children,
    canExport = true 
}) {
    const [isExporting, setIsExporting] = useState(false);

    const handlePeriodChange = (newPeriod) => {
        // Reload page with new period
        router.get(window.location.pathname, { period: newPeriod }, {
            preserveScroll: true,
        });
    };

    const handleCustomDateChange = (dates) => {
        // Could implement custom date range API call here
        console.log('Custom date range:', dates);
    };

    const handleExport = async (format = 'csv') => {
        setIsExporting(true);
        try {
            const response = await fetch(`/admin/analytics/export?format=${format}&dashboard=${activeTab}&period=${period}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title={title} />

            <div className="py-6 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Analytics Dashboard
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Track platform metrics and performance
                            </p>
                        </div>
                        {canExport && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('csv')}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    {isExporting ? 'Exporting...' : 'Export CSV'}
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">code</span>
                                    {isExporting ? 'Exporting...' : 'Export JSON'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date Range Selector */}
                <DateRangeSelector 
                    period={period}
                    onPeriodChange={handlePeriodChange}
                    onCustomDateChange={handleCustomDateChange}
                />

                {/* Dashboard Tabs */}
                <DashboardTabs 
                    activeTab={activeTab}
                    period={period}
                />

                {/* Dashboard Content */}
                <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-md p-6">
                    {children}
                </div>
            </div>
        </AdminLayout>
    );
}
