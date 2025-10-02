import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminPayments({ transactions, stats }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    return (
        <AdminLayout>
            <Head title="Admin - Payments" />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Payment Management</h1>
                    <p className="text-slate-600 dark:text-slate-400">Monitor and manage all platform transactions</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        href="/admin/payments/export"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Export
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                        <span className="material-symbols-outlined text-green-500">attach_money</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.total_revenue)}</p>
                    <p className="mt-1 text-sm text-green-500">Platform earnings</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Total Volume</p>
                        <span className="material-symbols-outlined text-blue-500">payments</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.total_volume)}</p>
                    <p className="mt-1 text-sm text-blue-500">All transactions</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Successful</p>
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.successful_transactions || '0'}</p>
                    <p className="mt-1 text-sm text-emerald-500">Completed payments</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Avg. Fee</p>
                        <span className="material-symbols-outlined text-purple-500">percent</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.average_fee_percentage ? `${stats.average_fee_percentage.toFixed(1)}%` : '0%'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Platform fee</p>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Transactions</h2>
                </div>
                <div className="p-6">
                    {transactions && transactions.length > 0 ? (
                        <div className="space-y-4">
                            {transactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                                <span className="material-symbols-outlined text-green-500">payment</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    From: {transaction.payer?.first_name} {transaction.payer?.last_name} •
                                                    To: {transaction.payee?.first_name} {transaction.payee?.last_name}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                                    Project: {transaction.project?.job?.title || 'Unknown Project'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                        }`}>
                                            {transaction.status}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Fee: {formatCurrency(transaction.platform_fee)}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {transaction.created_at}
                                        </span>
                                        <Link
                                            href={`/admin/transactions/${transaction.id}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-400">credit_card_off</span>
                                <p className="mt-2 text-slate-500 dark:text-slate-400">No transactions found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}