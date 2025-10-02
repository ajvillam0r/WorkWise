import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ auth, contract, userRole, canSign, nextSigner, hasUserSigned }) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_gig_worker_signature': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Gig Worker Signature' },
            'pending_employer_signature': { color: 'bg-blue-100 text-blue-800', text: 'Pending Employer Signature' },
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

    const handleCancelContract = () => {
        if (!cancellationReason.trim()) return;

        setIsProcessing(true);
        router.post(route('contracts.cancel', contract.id), {
            cancellation_reason: cancellationReason
        }, {
            onSuccess: () => {
                setShowCancelModal(false);
                setCancellationReason('');
            },
            onFinish: () => {
                setIsProcessing(false);
            }
        });
    };

    const employerSignature = contract.signatures?.find(sig => sig.role === 'employer');
    const gigWorkerSignature = contract.signatures?.find(sig => sig.role === 'gig_worker');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Contract Details</h2>}
        >
            <Head title={`Contract ${contract.contract_id}`} />

            <div className="py-12">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    {/* Contract Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-green-50 border-b border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-green-800">WorkWise Contract</h1>
                                    <p className="text-green-600 text-lg">Contract ID: {contract.contract_id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 mb-2">Date: {formatDate(contract.created_at)}</p>
                                    {getStatusBadge(contract.status)}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex space-x-4">
                                    {canSign && (
                                        <Link
                                            href={route('contracts.sign', contract.id)}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                        >
                                            Sign Contract
                                        </Link>
                                    )}

                                    {/* Show message for gig workers waiting for employer signature */}
                                    {userRole === 'gig_worker' && !employerSignature && contract.status !== 'fully_signed' && contract.status !== 'cancelled' && (
                                        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-md">
                                            <span className="text-sm text-yellow-800">
                                                Waiting for employer to sign first
                                            </span>
                                        </div>
                                    )}
                                    
                                    {contract.status === 'fully_signed' && (
                                        <a
                                            href={route('contracts.downloadPdf', contract.id)}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                        >
                                            Download PDF
                                        </a>
                                    )}

                                    <Link
                                        href={route('projects.show', contract.project.id)}
                                        className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        View Project
                                    </Link>
                                </div>

                                {userRole === 'employer' && contract.status !== 'fully_signed' && contract.status !== 'cancelled' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Cancel Contract
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Contract Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Parties Involved */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties Involved</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-700 mb-3">EMPLOYER</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Name:</span> {contract.employer?.first_name} {contract.employer?.last_name}</div>
                                                <div><span className="font-medium">Email:</span> {contract.employer?.email}</div>
                                                <div><span className="font-medium">Phone:</span> {contract.employer?.phone || 'Not provided'}</div>
                                                <div><span className="font-medium">Location:</span> {contract.employer?.location || contract.employer?.barangay || 'Not provided'}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-700 mb-3">GIG WORKER</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Name:</span> {contract.gigWorker?.first_name} {contract.gigWorker?.last_name}</div>
                                                <div><span className="font-medium">Email:</span> {contract.gigWorker?.email}</div>
                                                <div><span className="font-medium">Phone:</span> {contract.gigWorker?.phone || 'Not provided'}</div>
                                                <div><span className="font-medium">Location:</span> {contract.gigWorker?.location || contract.gigWorker?.barangay || 'Not provided'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm text-gray-600">
                                        The contract will commence on {formatDate(contract.project_start_date)}, 
                                        and will continue until terminated in accordance with the terms of this Agreement.
                                    </p>
                                </div>
                            </div>

                            {/* Scope of Work */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scope of Work</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{contract.scope_of_work}</pre>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Terms & Deadlines */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms & Deadlines</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-3">Payment Terms</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Contract Type:</span> {contract.contract_type}</div>
                                                <div><span className="font-medium">Total Payment:</span> {formatCurrency(contract.total_payment)}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-3">Deadlines</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Project Start Date:</span> {formatDate(contract.project_start_date)}</div>
                                                <div><span className="font-medium">Project End Date:</span> {formatDate(contract.project_end_date)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Responsibilities */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-3">Employer Responsibilities</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                {contract.employer_responsibilities?.map((responsibility, index) => (
                                                    <li key={index}>{responsibility}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-3">Gig Worker Responsibilities</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                {contract.gig_worker_responsibilities?.map((responsibility, index) => (
                                                    <li key={index}>{responsibility}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Signature Status */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Signature Status</h3>
                                    
                                    <div className="space-y-4">
                                        {/* Employer signs first */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">1. Employer</span>
                                            {employerSignature ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Signed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        {/* Gig Worker signs second */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">2. Gig Worker</span>
                                            {gigWorkerSignature ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Signed
                                                </span>
                                            ) : employerSignature ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                    Waiting for employer
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {contract.status === 'fully_signed' && (
                                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800 font-medium">
                                                Contract fully signed on {formatDateTime(contract.fully_signed_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Communication */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Preferred Method:</span> {contract.preferred_communication}</div>
                                        <div><span className="font-medium">Frequency:</span> {contract.communication_frequency}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Contract Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Contract</h3>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    Please provide a reason for cancelling this contract:
                                </p>
                                <textarea
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    rows="3"
                                    placeholder="Enter cancellation reason..."
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCancelContract}
                                    disabled={isProcessing || !cancellationReason.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
