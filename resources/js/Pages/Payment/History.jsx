import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

export default function PaymentHistory({ transactions }) {
    const { auth } = usePage().props;
    const isClient = auth.user.user_type === 'client';

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            const date = parseISO(dateString);
            return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : 'Invalid date';
        } catch (error) {
            return 'Invalid date';
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Payment History</h2>}
        >
            <Head title="Payment History" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Summary Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4">Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isClient ? (
                                    <>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Escrow Balance</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{auth.user.escrow_balance?.toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Total Spent</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{transactions?.reduce((sum, t) => sum + (t.type === 'payment' ? t.amount : 0), 0).toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Active Escrow</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{transactions?.reduce((sum, t) => sum + (t.type === 'escrow' && t.status === 'pending' ? t.amount : 0), 0).toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Total Earned</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{transactions?.reduce((sum, t) => sum + (t.type === 'release' ? t.amount : 0), 0).toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Pending Releases</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{transactions?.reduce((sum, t) => sum + (t.type === 'escrow' && t.status === 'pending' ? t.amount : 0), 0).toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="text-sm text-gray-500">Platform Fees</div>
                                            <div className="text-2xl font-semibold text-gray-900">
                                                ₱{transactions?.reduce((sum, t) => sum + (t.platform_fee || 0), 0).toLocaleString() ?? '0.00'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Transaction History</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Project
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transactions?.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(transaction.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        transaction.type === 'escrow' ? 'bg-blue-100 text-blue-800' :
                                                        transaction.type === 'release' ? 'bg-green-100 text-green-800' :
                                                        transaction.type === 'refund' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₱{transaction.amount?.toLocaleString() ?? '0.00'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {transaction.project?.title || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
