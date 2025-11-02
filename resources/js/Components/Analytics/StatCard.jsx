import React from 'react';

/**
 * StatCard Component
 * Displays a single statistic with label, value, and optional trend
 * 
 * Props:
 * - label: string - Statistic label
 * - value: string/number - Main value to display
 * - subtext: string - Optional secondary text (percentage, trend, etc)
 * - icon: string - Optional Material Symbol icon name
 * - trend: 'up' | 'down' | 'neutral' - Optional trend indicator
 * - color: string - Tailwind color class (e.g., 'blue', 'green', 'orange')
 */
export default function StatCard({ label, value, subtext, icon, trend, color = 'blue' }) {
    const colorMap = {
        blue: 'bg-blue-50 border-blue-200 text-blue-900',
        green: 'bg-green-50 border-green-200 text-green-900',
        orange: 'bg-orange-50 border-orange-200 text-orange-900',
        purple: 'bg-purple-50 border-purple-200 text-purple-900',
        red: 'bg-red-50 border-red-200 text-red-900',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    };

    const iconColorMap = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        orange: 'text-orange-600',
        purple: 'text-purple-600',
        red: 'text-red-600',
        indigo: 'text-indigo-600',
    };

    const bgClass = colorMap[color] || colorMap.blue;
    const iconClass = iconColorMap[color] || iconColorMap.blue;

    return (
        <div className={`${bgClass} border rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {label}
                    </p>
                    <p className="text-3xl font-bold mt-2 dark:text-white">
                        {value}
                    </p>
                    {subtext && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {subtext}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`${iconClass} dark:text-gray-400`}>
                        <span className="material-symbols-outlined text-3xl">
                            {icon}
                        </span>
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-xs font-semibold">
                    {trend === 'up' && (
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            Trending Up
                        </span>
                    )}
                    {trend === 'down' && (
                        <span className="text-red-600 dark:text-red-400 flex items-center">
                            <span className="material-symbols-outlined text-sm">trending_down</span>
                            Trending Down
                        </span>
                    )}
                    {trend === 'neutral' && (
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                            <span className="material-symbols-outlined text-sm">trending_flat</span>
                            Stable
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
