import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function FreelancerWallet({ 
    totalEarnings, 
    pendingEarnings, 
    availableBalance, 
    completedProjects, 
    pendingPayments, 
    transactions, 
    currency 
}) {
    const { flash } = usePage().props;
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        bank_account: ''
    });

    const handleWithdrawal = (e) => {
        e.preventDefault();
        post('/gig-worker/wallet/withdraw', {
            onSuccess: () => {
                reset();
                setShowWithdrawalModal(false);
            }
        });
    };

    const formatAmount = (value) => {
        const number = Number(value ?? 0);
        return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            active: 'bg-blue-100 text-blue-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight"> My Earnings</h2>}
        >
            <Head title="My Earnings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            {flash.success}
                        </div>
                    )}

                    {/* Earnings Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Earnings */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100 mr-4">
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {currency.symbol}{formatAmount(totalEarnings)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Payments */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-yellow-100 mr-4">
                                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {currency.symbol}{formatAmount(pendingEarnings)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Available Balance */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Available Balance</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {currency.symbol}{formatAmount(availableBalance)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    disabled={availableBalance <= 0}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments Section */}
                    {pendingPayments.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-8">
                            <div className="p-6">
                                <h3 className="text-lg font-medium mb-4">⏳ Pending Payments (Escrowed or Awaiting Release)</h3>
                                <div className="space-y-4">
                                    {pendingPayments.map((project) => (
                                        <div key={project.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{project.job.title}</h4>
                                                    <p className="text-sm text-gray-600">Employer: {project.employer.first_name} {project.employer.last_name}</p>
                                                    {project.status === 'completed' ? (
                                                        <p className="text-sm text-gray-500">Completed {formatDistanceToNow(new Date(project.completed_at))} ago</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Started {formatDistanceToNow(new Date(project.started_at))} ago</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-yellow-600">
                                                        {currency.symbol}{formatAmount(project.net_amount)}
                                                    </p>
                                                    {project.status === 'completed' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Awaiting Release
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            In Progress (Escrowed)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Payments */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">💸 Recent Payments Received</h3>
                            {transactions.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Project
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Employer
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.data.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.project?.job?.title || 'Project #' + transaction.project_id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {transaction.payer?.first_name} {transaction.payer?.last_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                        {currency.symbol}{formatAmount(transaction.net_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(transaction.processed_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payments yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Complete projects to start earning money!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Withdrawal Modal */}
                    {showWithdrawalModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                <h3 className="text-lg font-medium mb-4">Withdraw Funds</h3>
                                <form onSubmit={handleWithdrawal}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount to Withdraw
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={availableBalance}
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bank Account
                                        </label>
                                        <input
                                            type="text"
                                            value={data.bank_account}
                                            onChange={(e) => setData('bank_account', e.target.value)}
                                            placeholder="Account ending in ****1234"
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        {errors.bank_account && <p className="mt-1 text-sm text-red-600">{errors.bank_account}</p>}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowWithdrawalModal(false)}
                                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {processing ? 'Processing...' : 'Withdraw'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
