import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function FraudAlertShow({ auth, alert }) {
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [showResolveModal, setShowResolveModal] = useState(false);

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
            case 'active': return 'bg-red-100 text-red-800';
            case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'false_positive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleResolve = (e) => {
        e.preventDefault();
        if (!resolutionNotes.trim()) return;
        router.patch(`/admin/fraud/alerts/${alert.id}/resolve`, {
            resolution_notes: resolutionNotes,
        }, {
            preserveState: false,
            onSuccess: () => setShowResolveModal(false),
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fraud Alert: {alert.alert_id}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href="/admin/fraud/alerts"
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Alerts
                        </Link>
                        {alert.status === 'active' && (
                            <>
                                <button
                                    onClick={() => router.patch(`/admin/fraud/alerts/${alert.id}/acknowledge`, {}, { preserveState: false })}
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Acknowledge
                                </button>
                                <button
                                    onClick={() => setShowResolveModal(true)}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Resolve
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Mark this alert as a false positive?')) {
                                            router.patch(`/admin/fraud/alerts/${alert.id}/false-positive`, {}, { preserveState: false });
                                        }
                                    }}
                                    className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                                >
                                    False Positive
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Fraud Alert ${alert.alert_id}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Alert details</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Alert ID</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-mono">{alert.alert_id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{alert.alert_type?.replace(/_/g, ' ') || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Risk score</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{alert.risk_score}%</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Severity</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity?.toUpperCase() || '—'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                                                {alert.status?.replace(/_/g, ' ').toUpperCase() || '—'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Triggered at</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {alert.alert_message && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Message</h3>
                                    <p className="text-sm text-gray-700">{alert.alert_message}</p>
                                </div>
                            )}

                            {alert.user && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">User</h3>
                                    <p className="text-sm text-gray-900">
                                        {alert.user.first_name} {alert.user.last_name} — {alert.user.email}
                                    </p>
                                    <Link
                                        href={`/admin/users/${alert.user.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-900"
                                    >
                                        View user profile →
                                    </Link>
                                </div>
                            )}

                            {alert.fraud_case && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Linked case</h3>
                                    <Link
                                        href={`/admin/fraud/cases/${alert.fraud_case.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-900"
                                    >
                                        {alert.fraud_case.case_id} →
                                    </Link>
                                </div>
                            )}

                            {alert.assigned_admin && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Assigned admin</h3>
                                    <p className="text-sm text-gray-900">
                                        {alert.assigned_admin.first_name} {alert.assigned_admin.last_name}
                                    </p>
                                </div>
                            )}

                            {(alert.alert_data && Object.keys(alert.alert_data).length > 0) && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Alert data</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(alert.alert_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {(alert.context_data && Object.keys(alert.context_data).length > 0) && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Context</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(alert.context_data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {alert.resolution_notes && Array.isArray(alert.resolution_notes) && alert.resolution_notes.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Resolution notes</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(alert.resolution_notes, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showResolveModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Resolve alert</h3>
                            <form onSubmit={handleResolve}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Resolution notes</label>
                                    <textarea
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        rows={3}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter resolution notes..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResolveModal(false)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!resolutionNotes.trim()}
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        Resolve
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
