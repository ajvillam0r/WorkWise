import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ verifications = { data: [], links: [] }, stats = {}, filters = {} }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.employers.verifications.index'), {
            search: search,
            status: status,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(route('admin.employers.verifications.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleApprove = async (userId) => {
        if (!confirm('Are you sure you want to approve this employer?')) return;
        setIsProcessing(true);
        router.post(route('admin.employers.verifications.approve', userId), {}, {
            preserveScroll: true,
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        setIsProcessing(true);
        router.post(route('admin.employers.verifications.reject', selectedUser.id), { notes: rejectReason }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedUser(null);
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    const openRejectModal = (user) => {
        setSelectedUser(user);
        setShowRejectModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
                {(status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Employer Verifications" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Employer Verifications</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Review and verify employer business documents and profiles
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500 mb-2">Pending Review</div>
                            <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500 mb-2">Verified</div>
                            <div className="text-3xl font-bold text-green-600">{stats?.verified || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500 mb-2">Rejected</div>
                            <div className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm font-medium text-gray-500 mb-2">Total Employers</div>
                            <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6 mb-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
                        </div>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, company, or email..."
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border px-3 py-2"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                                >
                                    Clear Filters
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documents
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {verifications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No Employer verifications found
                                        </td>
                                    </tr>
                                ) : (
                                    verifications.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {user.profile_picture_url ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={user.profile_picture_url}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-500 font-medium">
                                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.company_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col gap-1">
                                                    {user.business_registration_document && (
                                                        <a href={user.business_registration_document} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            View Business Reg.
                                                        </a>
                                                    )}
                                                    {user.tax_id && (
                                                        <span className="text-gray-700">Tax ID: {user.tax_id}</span>
                                                    )}
                                                    {!user.business_registration_document && !user.tax_id && (
                                                        <span className="text-gray-400">No documents</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(user.profile_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {user.profile_status === 'pending' && (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            disabled={isProcessing}
                                                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(user)}
                                                            disabled={isProcessing}
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {user.profile_status !== 'pending' && (
                                                    <span className="text-gray-400">Reviewed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {verifications?.links && verifications.links.length > 3 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{verifications.from}</span> to{' '}
                                            <span className="font-medium">{verifications.to}</span> of{' '}
                                            <span className="font-medium">{verifications.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {verifications.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${link.active
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        } ${index === 0 ? 'rounded-l-md' : ''} ${index === verifications.links.length - 1 ? 'rounded-r-md' : ''
                                                        } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    preserveState
                                                    preserveScroll
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Reject Employer
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection (Max 500 chars)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value.slice(0, 500))}
                                placeholder="Enter reason for rejection..."
                                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="4"
                            />
                            <div className="text-xs text-gray-500 mt-1">{rejectReason.length}/500</div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isProcessing || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
                            >
                                {isProcessing ? 'Processing...' : 'Reject Employer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
