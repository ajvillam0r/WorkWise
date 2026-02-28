import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function AuditLogShow({ auth, log }) {
    const handleVerifyIntegrity = () => {
        router.post(`/admin/fraud/audit-logs/${log.id}/verify`, {}, {
            preserveState: true,
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Audit Log: {log.log_id}
                    </h2>
                    <div className="flex space-x-2">
                        <Link
                            href={log.user_id ? `/admin/fraud/audit-logs?user_id=${log.user_id}` : '/admin/fraud/audit-logs'}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Back to Logs
                        </Link>
                        <button
                            type="button"
                            onClick={handleVerifyIntegrity}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Verify integrity
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Audit Log ${log.log_id}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Log details</h3>
                                <dl className="grid grid-cols-1 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Log ID</dt>
                                        <dd className="mt-1 text-sm font-mono text-gray-900">{log.log_id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Logged at</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {log.logged_at ? new Date(log.logged_at).toLocaleString() : '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Table</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{log.table_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Action</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{log.action}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Record ID</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{log.record_id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">User type</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{log.user_type || '—'}</dd>
                                    </div>
                                    {log.user && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">User</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {log.user.first_name} {log.user.last_name} ({log.user.email})
                                            </dd>
                                            <dd className="mt-1">
                                                <Link
                                                    href={`/admin/users/${log.user.id}`}
                                                    className="text-blue-600 hover:text-blue-900 text-sm"
                                                >
                                                    View user profile →
                                                </Link>
                                            </dd>
                                        </div>
                                    )}
                                    {log.ip_address && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">IP address</dt>
                                            <dd className="mt-1 text-sm font-mono text-gray-900">{log.ip_address}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {(log.old_values && Object.keys(log.old_values).length > 0) && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Old values</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {(log.new_values && Object.keys(log.new_values).length > 0) && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">New values</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {(log.metadata && Object.keys(log.metadata).length > 0) && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Metadata</h3>
                                    <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Integrity</h3>
                                <dl className="grid grid-cols-1 gap-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Hash signature</dt>
                                        <dd className="mt-1 text-xs font-mono text-gray-700 break-all">{log.hash_signature || '—'}</dd>
                                    </div>
                                    {log.previous_hash && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Previous hash</dt>
                                            <dd className="mt-1 text-xs font-mono text-gray-700 break-all">{log.previous_hash}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
