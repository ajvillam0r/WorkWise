import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function FraudDashboard({ auth, stats, recentCases, recentAlerts, topRiskUsers }) {
    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fraud Detection Dashboard
                    </h2>
                </div>
            }
        >
            <Head title="Fraud Detection Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Active Cases</div>
                                        <div className="text-2xl font-semibold text-gray-900">{stats.active_cases || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Active Alerts</div>
                                        <div className="text-2xl font-semibold text-gray-900">{stats.active_alerts || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Resolved Cases</div>
                                        <div className="text-2xl font-semibold text-gray-900">{stats.resolved_cases || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Avg Risk Score</div>
                                        <div className="text-2xl font-semibold text-gray-900">
                                            {stats.avg_risk_score ? stats.avg_risk_score.toFixed(1) : '0.0'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Fraud Cases */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Fraud Cases</h3>
                                    <a href="/admin/fraud/cases" className="text-sm text-blue-600 hover:text-blue-800">
                                        View All
                                    </a>
                                </div>
                                <div className="space-y-3">
                                    {(recentCases || []).map((fraudCase) => (
                                        <div key={fraudCase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                                    fraudCase.severity === 'critical' ? 'bg-red-500' :
                                                    fraudCase.severity === 'high' ? 'bg-orange-500' :
                                                    fraudCase.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {fraudCase.case_id}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {fraudCase.user?.first_name} {fraudCase.user?.last_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {fraudCase.fraud_score}%
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded ${
                                                    fraudCase.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    fraudCase.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {fraudCase.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
                                    <a href="/admin/fraud/alerts" className="text-sm text-blue-600 hover:text-blue-800">
                                        View All
                                    </a>
                                </div>
                                <div className="space-y-3">
                                    {(recentAlerts || []).map((alert) => (
                                        <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                                    alert.severity === 'critical' ? 'bg-red-500' :
                                                    alert.severity === 'high' ? 'bg-orange-500' :
                                                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {alert.user?.first_name} {alert.user?.last_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {alert.risk_score}%
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded ${
                                                    alert.status === 'active' ? 'bg-red-100 text-red-800' :
                                                    alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {alert.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Risk Users */}
                    <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Top Risk Users</h3>
                                <a href="/admin/users" className="text-sm text-blue-600 hover:text-blue-800">
                                    View All Users
                                </a>
                            </div>
                            <div className="space-y-3">
                                {(topRiskUsers || []).map((user, index) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.user_type}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user.created_at || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}