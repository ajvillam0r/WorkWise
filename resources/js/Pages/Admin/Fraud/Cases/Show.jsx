import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function FraudCaseShow({ auth, fraudCase, relatedCases, watchlistEntry, userJobs }) {
    const [status, setStatus] = useState(fraudCase.status);
    const [severity, setSeverity] = useState(fraudCase.severity);
    const [investigationNotes, setInvestigationNotes] = useState('');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showWatchlistReasonModal, setShowWatchlistReasonModal] = useState(false);
    const [watchlistReason, setWatchlistReason] = useState('');

    const handleAddToWatchlist = (e) => {
        e.preventDefault();
        router.post('/admin/fraud/watchlist', {
            user_id: fraudCase.user.id,
            reason: watchlistReason,
        }, {
            preserveState: false,
            onSuccess: () => {
                setShowWatchlistReasonModal(false);
                setWatchlistReason('');
            },
        });
    };

    const handleStatusUpdate = (e) => {
        e.preventDefault();

        router.patch(`/admin/fraud/cases/${fraudCase.id}/status`, {
            status: status,
            severity: severity,
            investigation_notes: investigationNotes,
        }, {
            preserveState: true,
            onSuccess: () => {
                setShowUpdateModal(false);
                setInvestigationNotes('');
            }
        });
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
                        Fraud Case: {fraudCase.case_id}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href="/admin/fraud/cases"
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Cases
                        </Link>
                        <button
                            onClick={() => setShowUpdateModal(true)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Update Status
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Fraud Case ${fraudCase.case_id}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Case Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Case Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Case ID</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.case_id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fraud Type</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.fraud_type.replace('_', ' ').toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.fraud_score}%</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Financial Impact</label>
                                            <p className="mt-1 text-sm text-gray-900">₱{fraudCase.financial_impact}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Severity</label>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(fraudCase.severity)}`}>
                                                {fraudCase.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fraudCase.status)}`}>
                                                {fraudCase.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Detected At</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {new Date(fraudCase.detected_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {fraudCase.resolved_at ? new Date(fraudCase.resolved_at).toLocaleString() : 'Not resolved'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {fraudCase.user.first_name} {fraudCase.user.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.user.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">User Type</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.user.user_type}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Created</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {new Date(fraudCase.user.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Account status</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {fraudCase.user.profile_status === 'rejected' ? (
                                                    <span className="text-red-600 font-medium">Suspended</span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">Active</span>
                                                )}
                                            </p>
                                            <div className="mt-2 flex gap-2">
                                                {fraudCase.user.profile_status === 'rejected' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Activate this user? They will be able to use the platform again.')) {
                                                                router.patch(`/admin/users/${fraudCase.user.id}/activate`, {}, { preserveState: false });
                                                            }
                                                        }}
                                                        className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded"
                                                    >
                                                        Activate user
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Suspend this user? They will not be able to use the platform until activated.')) {
                                                                router.patch(`/admin/users/${fraudCase.user.id}/suspend`, {}, { preserveState: false });
                                                            }
                                                        }}
                                                        className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded"
                                                    >
                                                        Suspend user
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">ID verification (KYC)</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                Status: {fraudCase.user.id_verification_status || 'not submitted'}
                                                {fraudCase.user.id_verification_required_by_admin && (
                                                    <span className="ml-2 text-amber-600 font-medium">(KYC required by admin)</span>
                                                )}
                                            </p>
                                            <div className="mt-2 flex gap-2">
                                                {fraudCase.user.id_verification_required_by_admin ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Clear KYC requirement? User will be able to use the platform without verifying ID.')) {
                                                                router.post(`/admin/fraud/users/${fraudCase.user.id}/clear-kyc-requirement`, {}, { preserveState: false });
                                                            }
                                                        }}
                                                        className="bg-gray-500 hover:bg-gray-700 text-white text-sm font-bold py-2 px-4 rounded"
                                                    >
                                                        Clear KYC requirement
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Require ID verification? User will be blocked from all actions until they upload a valid government ID.')) {
                                                                router.post(`/admin/fraud/users/${fraudCase.user.id}/require-kyc`, {}, { preserveState: false });
                                                            }
                                                        }}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded"
                                                    >
                                                        Require KYC (block until verified)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        <Link
                                            href={`/admin/users/${fraudCase.user.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Full User Profile →
                                        </Link>
                                        <Link
                                            href={`/admin/fraud/audit-logs?user_id=${fraudCase.user.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View audit timeline for this user →
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Case File / Technical context – IP, device, browser (bot vs real person) */}
                            {(fraudCase.ip_address || fraudCase.user_agent || fraudCase.device_fingerprint || fraudCase.location_data) && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Case File / Technical Context</h3>
                                        <p className="text-sm text-gray-600 mb-4">IP, device fingerprint, and browser info to help assess bot vs real person.</p>
                                        <div className="space-y-4">
                                            {fraudCase.ip_address && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-mono">{fraudCase.ip_address}</p>
                                                </div>
                                            )}
                                            {fraudCase.user_agent && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">User Agent / Browser</label>
                                                    {typeof fraudCase.user_agent === 'string' ? (
                                                        <p className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto break-all">{fraudCase.user_agent}</p>
                                                    ) : (
                                                        <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                                            {JSON.stringify(fraudCase.user_agent, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            )}
                                            {fraudCase.device_fingerprint && Object.keys(fraudCase.device_fingerprint).length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Device Fingerprint</label>
                                                    <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                                        {JSON.stringify(fraudCase.device_fingerprint, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {fraudCase.location_data && Object.keys(fraudCase.location_data).length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Location Data</label>
                                                    <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                                        {JSON.stringify(fraudCase.location_data, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Evidence Data */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Evidence & Analysis</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <p className="mt-1 text-sm text-gray-900">{fraudCase.description}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Evidence Data</label>
                                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                                {JSON.stringify(fraudCase.evidence_data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Investigation Notes */}
                            {fraudCase.investigation_notes && Array.isArray(fraudCase.investigation_notes) && fraudCase.investigation_notes.length > 0 && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Investigation Notes</h3>
                                        <div className="space-y-3">
                                            {fraudCase.investigation_notes.map((note, index) => (
                                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                                    <p className="text-sm text-gray-900">{note.note}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        By {note.admin_name} on {new Date(note.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Assigned Admin */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assigned Admin</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {fraudCase.assigned_admin ?
                                                `${fraudCase.assigned_admin.first_name} ${fraudCase.assigned_admin.last_name}` :
                                                'Not assigned'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Watchlist */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Watchlist</h3>
                                    {watchlistEntry ? (
                                        <div>
                                            <p className="text-sm text-amber-700 font-medium">On watchlist</p>
                                            {watchlistEntry.reason && (
                                                <p className="text-sm text-gray-600 mt-1">{watchlistEntry.reason}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Added {watchlistEntry.created_at ? new Date(watchlistEntry.created_at).toLocaleString() : ''}
                                            </p>
                                            <div className="mt-3">
                                                <Link
                                                    href="/admin/fraud/watchlist"
                                                    className="text-sm text-blue-600 hover:text-blue-900"
                                                >
                                                    View all watchlist →
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm('Remove this user from the watchlist?')) {
                                                            router.delete(`/admin/fraud/watchlist/${fraudCase.user.id}`, { preserveState: false });
                                                        }
                                                    }}
                                                    className="ml-4 text-sm text-red-600 hover:text-red-900"
                                                >
                                                    Remove from watchlist
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">Keep this user under monitoring.</p>
                                            <button
                                                type="button"
                                                onClick={() => setShowWatchlistReasonModal(true)}
                                                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded"
                                            >
                                                Add to watchlist
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User's jobs (employer) – Hide / Delete */}
                            {userJobs && userJobs.length > 0 && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">User&apos;s jobs</h3>
                                        <p className="text-sm text-gray-600 mb-3">Hide from public listing or delete (admin).</p>
                                        <div className="space-y-3">
                                            {userJobs.map((job) => (
                                                <div key={job.id} className="border rounded p-3 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                                        <div className="text-xs text-gray-500">Status: {job.status} {job.hidden_by_admin && '(Hidden)'}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {job.hidden_by_admin ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.patch(`/admin/fraud/jobs/${job.id}/unhide`, {}, { preserveState: false })}
                                                                className="text-sm text-green-600 hover:text-green-900"
                                                            >
                                                                Unhide
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.patch(`/admin/fraud/jobs/${job.id}/hide`, {}, { preserveState: false })}
                                                                className="text-sm text-amber-600 hover:text-amber-900"
                                                            >
                                                                Hide
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirm('Permanently delete this job? This cannot be undone.')) {
                                                                    router.delete(`/admin/fraud/jobs/${job.id}`, { preserveState: false });
                                                                }
                                                            }}
                                                            className="text-sm text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Related Cases</h3>
                                    <div className="space-y-3">
                                        {relatedCases.map((relatedCase) => (
                                            <div key={relatedCase.id} className="border rounded p-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {relatedCase.case_id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {relatedCase.fraud_type.replace('_', ' ')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(relatedCase.detected_at).toLocaleDateString()}
                                                </div>
                                                <Link
                                                    href={`/admin/fraud/cases/${relatedCase.id}`}
                                                    className="text-xs text-blue-600 hover:text-blue-900"
                                                >
                                                    View Case
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Associated Alerts</h3>
                                    <div className="space-y-3">
                                        {fraudCase.alerts.map((alert) => (
                                            <div key={alert.id} className="border rounded p-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {alert.alert_type.replace('_', ' ')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Risk: {alert.risk_score}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(alert.triggered_at).toLocaleDateString()}
                                                </div>
                                                <Link
                                                    href={`/admin/fraud/alerts/${alert.id}`}
                                                    className="text-xs text-blue-600 hover:text-blue-900"
                                                >
                                                    View Alert
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Status Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Case Status</h3>
                            <form onSubmit={handleStatusUpdate}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="investigating">Investigating</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="false_positive">False Positive</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                                    <select
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Investigation Notes</label>
                                    <textarea
                                        value={investigationNotes}
                                        onChange={(e) => setInvestigationNotes(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Add investigation notes..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add to Watchlist Modal */}
            {showWatchlistReasonModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add to Watchlist</h3>
                            <form onSubmit={handleAddToWatchlist}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
                                    <textarea
                                        value={watchlistReason}
                                        onChange={(e) => setWatchlistReason(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Multiple fraud cases, under investigation..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowWatchlistReasonModal(false); setWatchlistReason(''); }}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Add to watchlist
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