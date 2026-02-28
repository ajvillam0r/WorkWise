import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function TransactionReports({ revenue, escrow, filters }) {
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount ?? 0);
    };

    const applyFilters = () => {
        router.get('/admin/reports/transactions', {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true });
    };

    const exportUrl = (basePath, format) => {
        const params = new URLSearchParams({ format });
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        return `${basePath}?${params.toString()}`;
    };

    return (
        <AdminLayout>
            <Head title="Admin - Transaction Reports" />

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Mandatory Transaction Reports
                    </h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Platform Revenue & Take-Rate and Escrow Liability
                    </p>
                </div>
                <Link
                    href="/admin/payments"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <span className="material-symbols-outlined">payments</span>
                    View Payments
                </Link>
            </div>

            {/* Date filters */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Filter by date range (optional)</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label htmlFor="date_from" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">From</label>
                        <input
                            id="date_from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="date_to" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">To</label>
                        <input
                            id="date_to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {/* Report 1: Platform Revenue & Take-Rate */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Platform Revenue & Take-Rate
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Total platform fee collected vs total volume — essential for business health
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={exportUrl('/admin/reports/transactions/revenue-export', 'csv')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Export CSV
                            </a>
                            <a
                                href={exportUrl('/admin/reports/transactions/revenue-export', 'pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                            >
                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                Export PDF
                            </a>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Platform Revenue</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(revenue?.platform_revenue)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Transaction Volume</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(revenue?.total_volume)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Take Rate</p>
                            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {revenue?.total_volume > 0
                                    ? `${Number(revenue.take_rate_percent).toFixed(2)}%`
                                    : '0%'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report 2: Escrow Liability */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Escrow Liability Report
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Client funds currently locked: Escrow Total − (Released + Refunded)
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={exportUrl('/admin/reports/transactions/escrow-liability-export', 'csv')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Export CSV
                            </a>
                            <a
                                href={exportUrl('/admin/reports/transactions/escrow-liability-export', 'pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                            >
                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                Export PDF
                            </a>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Escrow Total</p>
                            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(escrow?.escrow_total)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Released Total</p>
                            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(escrow?.released_total)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Refunded Total</p>
                            <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(escrow?.refunded_total)}
                            </p>
                        </div>
                        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-900/20">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Escrow Liability (Locked)</p>
                            <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {formatCurrency(escrow?.escrow_liability)}
                            </p>
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                Client money currently in the system
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Mandatory Reports</h3>
                        <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                            These reports are required for admin oversight: Platform Revenue & Take-Rate for business health, and Escrow Liability to know exactly how much client money is currently held.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
