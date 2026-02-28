import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function AuditLogsIndex({ auth, logs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [tableName, setTableName] = useState(filters.table_name || '');
    const [action, setAction] = useState(filters.action || '');
    const [userType, setUserType] = useState(filters.user_type || '');
    const userId = filters.user_id || '';

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/admin/fraud/audit-logs', {
            search: search || undefined,
            table_name: tableName || undefined,
            action: action || undefined,
            user_type: userType || undefined,
            user_id: userId || undefined,
        }, { preserveState: true });
    };

    const clearUserFilter = () => {
        router.get('/admin/fraud/audit-logs', {
            search: search || undefined,
            table_name: tableName || undefined,
            action: action || undefined,
            user_type: userType || undefined,
        }, { preserveState: true });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Immutable Audit Logs
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
            <Head title="Audit Logs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {userId && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-blue-800">
                                Showing audit timeline for user ID: <strong>{userId}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={clearUserFilter}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear user filter
                            </button>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleFilter} className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search (record ID or user name/email)"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Table name"
                                            value={tableName}
                                            onChange={(e) => setTableName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={action}
                                            onChange={(e) => setAction(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All actions</option>
                                            <option value="CREATE">Create</option>
                                            <option value="UPDATE">Update</option>
                                            <option value="DELETE">Delete</option>
                                            <option value="REQUEST">Request</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={userType}
                                            onChange={(e) => setUserType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All user types</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="system">System</option>
                                        </select>
                                    </div>
                                    <div>
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Filter
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Log ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(logs.data || []).map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                    {log.log_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.logged_at ? new Date(log.logged_at).toLocaleString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log.table_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log.action}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.record_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.user ? (
                                                        <div className="text-sm">
                                                            <div className="text-gray-900">{log.user.first_name} {log.user.last_name}</div>
                                                            <div className="text-gray-500">{log.user.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.user_type || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/admin/fraud/audit-logs/${log.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {(!logs.data || logs.data.length === 0) && (
                                <p className="mt-4 text-sm text-gray-500">No audit log entries match the current filters.</p>
                            )}

                            {logs.links && logs.links.length > 0 && (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {logs.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-2 rounded text-sm ${
                                                link.active
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
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
