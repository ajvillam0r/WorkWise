import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * DashboardTabs Component
 * Navigation tabs for switching between analytics dashboards
 * 
 * Props:
 * - activeTab: string - Current active tab
 * - period: number - Current period for display
 */
export default function DashboardTabs({ activeTab = 'overview', period = 30 }) {
    const tabs = [
        {
            id: 'overview',
            label: 'User Analytics',
            icon: 'person',
            route: 'analytics.overview',
            description: 'User growth & verification metrics'
        },
        {
            id: 'jobs-contracts',
            label: 'Jobs & Contracts',
            icon: 'work',
            route: 'analytics.jobsContracts',
            description: 'Job postings & contract metrics'
        },
        {
            id: 'financial',
            label: 'Financial',
            icon: 'attach_money',
            route: 'analytics.financial',
            description: 'Revenue & transaction metrics'
        },
        {
            id: 'quality',
            label: 'Quality Metrics',
            icon: 'grade',
            route: 'analytics.quality',
            description: 'Quality & rating metrics'
        },
    ];

    return (
        <div>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
                <nav className="flex space-x-1 px-4 overflow-x-auto" aria-label="Analytics tabs">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={route(tab.route, { period })}
                            className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined inline text-lg mr-2">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Tab Description */}
            <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tabs.find(t => t.id === activeTab)?.description}
                </p>
            </div>
        </div>
    );
}
