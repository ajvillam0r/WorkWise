import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function FraudCasesIndex({ auth, cases, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [severityFilter, setSeverityFilter] = useState(filters.severity || '');
    const [fraudTypeFilter, setFraudTypeFilter] = useState(filters.fraud_type || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/fraud/cases', {
            search: searchTerm,
            status: statusFilter,
            severity: severityFilter,
            fraud_type: fraudTypeFilter,
        }, { preserveState: true });
    };

    const handleFilterChange = (filterType, value) => {
        const filters = {
            search: searchTerm,
            status: statusFilter,
            severity: severityFilter,
            fraud_type: fraudTypeFilter,
            [filterType]: value,
        };

        router.get('/admin/fraud/cases', filters, { preserveState: true });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'investigating': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-red-100 text-red-800';
            case 'false_positive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fraud Detection Cases
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
            <Head title="Fraud Cases" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Filters */}
                            <form onSubmit={handleSearch} className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search cases..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                handleFilterChange('status', e.target.value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="investigating">Investigating</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="false_positive">False Positive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={severityFilter}
                                            onChange={(e) => {
                                                setSeverityFilter(e.target.value);
                                                handleFilterChange('severity', e.target.value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Severities</option>
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={fraudTypeFilter}
                                            onChange={(e) => {
                                                setFraudTypeFilter(e.target.value);
                                                handleFilterChange('fraud_type', e.target.value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Types</option>
                                            <option value="payment_fraud">Payment Fraud</option>
                                            <option value="identity_fraud">Identity Fraud</option>
                                            <option value="behavioral_anomaly">Behavioral Anomaly</option>
                                            <option value="suspicious_behavior">Suspicious Behavior</option>
                                        </select>
                                    </div>
                                    <div>
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Cases Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Case ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fraud Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Risk Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Severity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Detected
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cases.data.map((fraudCase) => (
                                            <tr key={fraudCase.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {fraudCase.case_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {fraudCase.user.first_name} {fraudCase.user.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {fraudCase.user.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {fraudCase.fraud_type.replace('_', ' ').toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {fraudCase.fraud_score}%
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                fraudCase.fraud_score >= 90 ? 'bg-red-500' :
                                                                fraudCase.fraud_score >= 70 ? 'bg-orange-500' :
                                                                fraudCase.fraud_score >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${fraudCase.fraud_score}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(fraudCase.severity)}`}>
                                                        {fraudCase.severity.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fraudCase.status)}`}>
                                                        {fraudCase.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(fraudCase.detected_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/admin/fraud/cases/${fraudCase.id}`}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {cases.links && (
                                <div className="mt-6">
                                    {cases.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-2 mx-1 rounded ${
                                                link.active
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}