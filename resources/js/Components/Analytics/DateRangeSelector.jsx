import React, { useState } from 'react';
import { format, subDays } from 'date-fns';

/**
 * DateRangeSelector Component
 * Allows users to select predefined periods or custom date ranges
 * 
 * Props:
 * - period: number - Current period (7, 30, 90)
 * - onPeriodChange: function - Callback when period changes
 * - onCustomDateChange: function - Callback for custom dates
 */
export default function DateRangeSelector({ period = 30, onPeriodChange, onCustomDateChange }) {
    const [customMode, setCustomMode] = useState(false);
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const handlePeriodClick = (days) => {
        setCustomMode(false);
        onPeriodChange(days);
    };

    const handleCustomDates = () => {
        onCustomDateChange({ from: fromDate, to: toDate });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Preset Periods */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handlePeriodClick(7)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            period === 7 && !customMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => handlePeriodClick(30)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            period === 30 && !customMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Last 30 Days
                    </button>
                    <button
                        onClick={() => handlePeriodClick(90)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                            period === 90 && !customMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Last 90 Days
                    </button>
                </div>

                {/* Custom Date Range Toggle */}
                <button
                    onClick={() => setCustomMode(!customMode)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                        customMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    <span className="material-symbols-outlined inline text-sm mr-2">calendar_today</span>
                    Custom Range
                </button>
            </div>

            {/* Custom Date Range Inputs */}
            {customMode && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={handleCustomDates}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        >
                            Apply Range
                        </button>
                    </div>
                </div>
            )}

            {/* Info Text */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined inline text-sm mr-1">info</span>
                Data is updated in real-time. Charts will refresh automatically when you change the date range.
            </div>
        </div>
    );
}
