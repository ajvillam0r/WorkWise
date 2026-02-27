import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function CreateContract({ gigWorker, price, jobs, user }) {
    const { data, setData, post, processing, errors } = useForm({
        gig_worker_id: gigWorker ? gigWorker.id : '',
        job_id: jobs.length === 1 ? jobs[0].id : '',
        agreed_amount: price || '',
        estimated_days: '7',
        scope_of_work: `Direct hire agreement with ${gigWorker ? gigWorker.first_name + ' ' + gigWorker.last_name : 'gig worker'}.\n\nPlease provide detailed requirements here.`
    });

    const selectedJob = jobs.find(j => j.id.toString() === data.job_id.toString());
    const isBalanceSufficient = user.escrow_balance >= Number(data.agreed_amount);

    const submit = (e) => {
        e.preventDefault();
        const amount = Number(data.agreed_amount) || 0;
        const balance = Number(user?.escrow_balance) ?? 0;
        if (amount > 0 && balance < amount) {
            router.visit(route('employer.wallet.index'));
            return;
        }
        post(route('contracts.store'));
    };

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Create Direct Contract</h2>}
        >
            <Head title="Create Direct Contract" />

            <div className="py-12 bg-gray-50 min-h-screen">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">

                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            Direct Hire Contract
                        </h2>
                        <Link href={route('messages.index')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Messages
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <form onSubmit={submit} className="divide-y divide-gray-100">

                            {/* Worker Info section */}
                            {gigWorker && (
                                <div className="p-6 bg-blue-50/50">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">You are hiring</h3>
                                    <div className="flex items-center gap-4">
                                        {gigWorker.profile_photo ? (
                                            <img src={`/storage/${gigWorker.profile_photo}`} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl border-2 border-white shadow-sm">
                                                {gigWorker.first_name[0]}{gigWorker.last_name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900">{gigWorker.first_name} {gigWorker.last_name}</h4>
                                            <p className="text-sm text-gray-600 font-medium">{gigWorker.professional_title}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 space-y-6">

                                {errors.error_type === 'insufficient_escrow' && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                        <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <h4 className="text-sm font-bold text-red-800">Insufficient Escrow Balance</h4>
                                            <p className="text-sm text-red-700 mt-1">
                                                You need ₱{Number(errors.required_amount).toLocaleString()} to create this contract, but your current balance is ₱{Number(user.escrow_balance).toLocaleString()}.
                                            </p>
                                            <div className="mt-3">
                                                <Link href={route('employer.wallet.index')} className="text-sm font-medium text-red-900 underline hover:text-red-700">
                                                    Deposit Funds to Wallet
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Job Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Job Listing</label>
                                    <select
                                        value={data.job_id}
                                        onChange={e => setData('job_id', e.target.value)}
                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">-- Choose one of your open jobs --</option>
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                {job.title} (Budget: ₱{job.budget_min} - ₱{job.budget_max})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.job_id && <p className="text-red-500 text-xs mt-1">{errors.job_id}</p>}
                                    {jobs.length === 0 && (
                                        <p className="text-amber-600 text-sm mt-2">
                                            You don't have any open jobs. Please create a job listing first so you can hire a gig worker for it.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Final Price */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Final Negotiated Price (₱)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">₱</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.agreed_amount}
                                                onChange={e => setData('agreed_amount', e.target.value)}
                                                className="w-full pl-8 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-medium"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        {errors.agreed_amount && <p className="text-red-500 text-xs mt-1">{errors.agreed_amount}</p>}
                                        {!isBalanceSufficient && data.agreed_amount > 0 && (
                                            <p className="text-red-500 text-xs mt-1">Insufficient balance. Your unallocated balance is ₱{Number(user.escrow_balance).toLocaleString()}</p>
                                        )}
                                    </div>

                                    {/* Estimated Duration */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Duration (Days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.estimated_days}
                                            onChange={e => setData('estimated_days', e.target.value)}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.estimated_days && <p className="text-red-500 text-xs mt-1">{errors.estimated_days}</p>}
                                    </div>
                                </div>

                                {/* Scope of Work */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Scope of Work & Requirements</label>
                                    <p className="text-xs text-gray-500 mb-2">This will be embedded into the contract. Be as detailed as possible to ensure mutual understanding.</p>
                                    <textarea
                                        rows={6}
                                        value={data.scope_of_work}
                                        onChange={e => setData('scope_of_work', e.target.value)}
                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="Describe the specific deliverables, milestones, and requirements..."
                                        required
                                    />
                                    {errors.scope_of_work && <p className="text-red-500 text-xs mt-1">{errors.scope_of_work}</p>}
                                </div>

                            </div>

                            <div className="p-6 bg-gray-50 flex items-center justify-between">
                                <p className="text-sm text-gray-500 max-w-sm">
                                    Clicking create will lock the agreed amount in Escrow and generate a contract for your signature.
                                </p>
                                <button
                                    type="submit"
                                    disabled={processing || jobs.length === 0 || !isBalanceSufficient}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {processing && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    Fund Escrow & Create Contract
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
