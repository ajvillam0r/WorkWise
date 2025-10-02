import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

export default function FraudAnalyticsIndex({ auth, analytics }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fraud Detection Analytics
                    </h2>
                    <Link
                        href="/admin/fraud/dashboard"
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Fraud Analytics" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Financial Impact */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Impact</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Impact</span>
                                        <span className="text-lg font-semibold text-red-600">
                                            {formatCurrency(analytics.financial_impact.total_impact)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Average Impact</span>
                                        <span className="text-lg font-semibold text-orange-600">
                                            {formatCurrency(analytics.financial_impact.avg_impact)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Recovered Amount</span>
                                        <span className="text-lg font-semibold text-green-600">
                                            {formatCurrency(analytics.financial_impact.recovered_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Cases</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {analytics.financial_impact.total_cases}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fraud Trends */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Fraud Trends (Last 30 Days)</h3>
                                <div className="space-y-3">
                                    {analytics.fraud_trends.slice(-7).map((trend, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-sm text-gray-600 w-16">
                                                    {formatDate(trend.date)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-red-500 h-2 rounded-full"
                                                            style={{ width: `${Math.min(100, (trend.cases / 10) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {trend.cases} cases
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Fraud Types */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Fraud Types</h3>
                                <div className="space-y-3">
                                    {analytics.top_fraud_types.map((type, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-800">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {type.fraud_type.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {type.count} cases
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rule Effectiveness */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Effectiveness</h3>
                                <div className="space-y-3">
                                    {analytics.rule_effectiveness.map((rule, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-green-800">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {rule.rule_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {rule.severity} • Risk: {rule.risk_score}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {rule.trigger_count} triggers
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analytics.geographic_distribution.map((location, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {location.country}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {location.city}, {location.region}
                                                </div>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {location.cases}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Temporal Patterns */}
                    <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Temporal Patterns (Last 7 Days)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">By Hour</h4>
                                    <div className="space-y-2">
                                        {Array.from({ length: 24 }, (_, hour) => {
                                            const hourData = analytics.temporal_patterns.find(p => p.hour === hour);
                                            const cases = hourData ? hourData.cases : 0;
                                            const maxCases = Math.max(...analytics.temporal_patterns.map(p => p.cases));
                                            const percentage = maxCases > 0 ? (cases / maxCases) * 100 : 0;

                                            return (
                                                <div key={hour} className="flex items-center space-x-3">
                                                    <div className="w-8 text-xs text-gray-500">
                                                        {hour.toString().padStart(2, '0')}:00
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-500 h-2 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 text-xs text-gray-900">
                                                        {cases}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">By Day</h4>
                                    <div className="space-y-2">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                                            const dayData = analytics.temporal_patterns.find(p => p.day_name === day);
                                            const cases = dayData ? dayData.cases : 0;
                                            const maxCases = Math.max(...analytics.temporal_patterns.map(p => p.cases));
                                            const percentage = maxCases > 0 ? (cases / maxCases) * 100 : 0;

                                            return (
                                                <div key={index} className="flex items-center space-x-3">
                                                    <div className="w-16 text-xs text-gray-500">
                                                        {day.slice(0, 3)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-500 h-2 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 text-xs text-gray-900">
                                                        {cases}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}