import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ auth, contracts, userRole }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_gig_worker_signature': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Gig Worker' },
            'pending_employer_signature': { color: 'bg-blue-100 text-blue-800', text: 'Pending Employer' },
            'fully_signed': { color: 'bg-green-100 text-green-800', text: 'Fully Signed' },
            'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getActionButton = (contract) => {
        const hasUserSigned = contract.signatures?.some(sig => sig.user_id === auth.user.id);
        const clientSignature = contract.signatures?.find(sig => sig.role === 'client');
        const isGigWorker = userRole === 'gig_worker';
        const isEmployer = userRole === 'employer';

        // Contract is fully signed - show download PDF
        if (contract.status === 'fully_signed') {
            return (
                <a
                    href={route('contracts.downloadPdf', contract.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Download PDF
                </a>
            );
        }

        // Contract is cancelled
        if (contract.status === 'cancelled') {
            return (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500">
                    Cancelled
                </span>
            );
        }

        // User has already signed
        if (hasUserSigned) {
            return (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600">
                    Signed
                </span>
            );
        }

        // Employer can sign if pending employer signature
        if (isEmployer && contract.status === 'pending_employer_signature') {
            return (
                <Link
                    href={route('contracts.sign', contract.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Sign Contract
                </Link>
            );
        }

        // Gig Worker can only sign after employer has signed
        if (isGigWorker && contract.status === 'pending_gig_worker_signature' && employerSignature) {
            return (
                <Link
                    href={route('contracts.sign', contract.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Sign Contract
                </Link>
            );
        }

        // Gig Worker waiting for employer to sign first
        if (isGigWorker && !employerSignature) {
            return (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-600">
                    Waiting for employer
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500">
                No action needed
            </span>
        );
    };

    const getOtherParty = (contract) => {
        if (userRole === 'employer') {
            return `${contract.gig_worker.first_name} ${contract.gig_worker.last_name}`;
        } else {
            return `${contract.employer.first_name} ${contract.employer.last_name}`;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Contracts</h2>}
        >
            <Head title="Contracts" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-green-50 border-b border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-green-800">My Contracts</h1>
                                    <p className="text-green-600">Manage your contract agreements</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Contracts: {contracts.data.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contracts List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {contracts.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You don't have any contracts yet. Contracts are created when bids are accepted.
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            href={route('jobs.index')}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            {userRole === 'employer' ? 'Post a Job' : 'Browse Jobs'}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contract
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {userRole === 'employer' ? 'Gig Worker' : 'Employer'}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Project
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {contracts.data.map((contract) => (
                                                <tr key={contract.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {contract.contract_id}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {contract.contract_type}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {getOtherParty(contract)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {contract.job.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatDate(contract.project_start_date)} - {formatDate(contract.project_end_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatCurrency(contract.total_payment)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(contract.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(contract.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            {getActionButton(contract)}
                                                            <Link
                                                                href={route('contracts.show', contract.id)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {contracts.links && contracts.data.length > 0 && (
                                <div className="mt-6">
                                    <nav className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            {contracts.prev_page_url && (
                                                <Link
                                                    href={contracts.prev_page_url}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {contracts.next_page_url && (
                                                <Link
                                                    href={contracts.next_page_url}
                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{contracts.from}</span> to{' '}
                                                    <span className="font-medium">{contracts.to}</span> of{' '}
                                                    <span className="font-medium">{contracts.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    {contracts.links.map((link, index) => (
                                                        <Link
                                                            key={index}
                                                            href={link.url || '#'}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                link.active
                                                                    ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            } ${
                                                                index === 0 ? 'rounded-l-md' : ''
                                                            } ${
                                                                index === contracts.links.length - 1 ? 'rounded-r-md' : ''
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </nav>
                                            </div>
                                        </div>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
