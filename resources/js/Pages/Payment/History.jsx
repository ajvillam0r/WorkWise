import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function PaymentHistory({ transactions = [], summary = { total_earned: 0, total_spent: 0, pending_escrow: 0, transaction_count: 0 } }) {
    const [filter, setFilter] = useState('all');

    const getTransactionIcon = (type, isIncoming) => {
        if (type === 'escrow') return '🔒';
        if (type === 'release') return isIncoming ? '💰' : '📤';
        if (type === 'refund') return '↩️';
        return '💳';
    };

    const getTransactionColor = (type, isIncoming) => {
        if (type === 'escrow') return 'text-blue-600';
        if (type === 'release') return isIncoming ? 'text-green-600' : 'text-gray-600';
        if (type === 'refund') return 'text-yellow-600';
        return 'text-gray-600';
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'all') return true;
        if (filter === 'incoming') return transaction.is_incoming;
        if (filter === 'outgoing') return !transaction.is_incoming;
        if (filter === 'escrow') return transaction.type === 'escrow';
        if (filter === 'completed') return transaction.status === 'completed';
        return true;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Payment History
                    </h2>
                    <div className="text-sm text-gray-600">
                        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </div>
                </div>
            }
        >
            <Head title="Payment History" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Total Earned</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            ₱{summary.total_earned.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">💳</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Total Spent</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₱{summary.total_spent.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">🔒</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">In Escrow</div>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            ₱{summary.pending_escrow.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Transactions</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {summary.transaction_count}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                        filter === 'all'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All Transactions
                                </button>
                                <button
                                    onClick={() => setFilter('incoming')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                        filter === 'incoming'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    💰 Incoming
                                </button>
                                <button
                                    onClick={() => setFilter('outgoing')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                        filter === 'outgoing'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    📤 Outgoing
                                </button>
                                <button
                                    onClick={() => setFilter('escrow')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                        filter === 'escrow'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    🔒 Escrow
                                </button>
                                <button
                                    onClick={() => setFilter('completed')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                        filter === 'completed'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    ✅ Completed
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-6">
                                Transaction History
                                {filter !== 'all' && (
                                    <span className="text-sm font-normal text-gray-600 ml-2">
                                        ({filteredTransactions.length} filtered)
                                    </span>
                                )}
                            </h3>

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💳</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No transactions found
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {filter === 'all' 
                                            ? "You haven't made any transactions yet."
                                            : `No ${filter} transactions found.`
                                        }
                                    </p>
                                    <Link
                                        href="/jobs"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Browse Jobs
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredTransactions.map((transaction) => (
                                        <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <span className="text-2xl">
                                                            {getTransactionIcon(transaction.type, transaction.is_incoming)}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {transaction.project_title}
                                                            </h4>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                                                                {transaction.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            {transaction.description}
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {transaction.is_incoming ? 'From' : 'To'}: {transaction.other_party} • {transaction.date}
                                                            {transaction.processed_at && (
                                                                <span> • Processed: {transaction.processed_at}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-semibold ${getTransactionColor(transaction.type, transaction.is_incoming)}`}>
                                                        {transaction.is_incoming ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                                                    </div>
                                                    {transaction.platform_fee > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            Fee: ₱{Number(transaction.platform_fee).toFixed(2)}
                                                        </div>
                                                    )}
                                                    {transaction.net_amount !== transaction.amount && (
                                                        <div className="text-xs text-gray-600">
                                                            Net: ₱{Number(transaction.net_amount).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Export & Reports</h3>
                            <div className="flex flex-wrap gap-3">
                                <button className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    📄 Export PDF
                                </button>
                                <button className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    📊 Export CSV
                                </button>
                                <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    📈 Tax Report
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">
                                Export your transaction history for accounting and tax purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
