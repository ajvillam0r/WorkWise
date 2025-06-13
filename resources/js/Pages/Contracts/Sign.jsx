import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';

export default function Sign({ auth, contract, userRole, user }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        full_name: `${user.first_name} ${user.last_name}`,
        browser_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        axios.post(route('contracts.processSignature', contract.id), data)
            .then((response) => {
                setShowSuccessModal(true);
                setTimeout(() => {
                    const redirectUrl = response.data?.redirect_url || route('contracts.show', contract.id);
                    window.location.href = redirectUrl;
                }, 2000);
            })
            .catch((error) => {
                console.error('Contract signing error:', error);
                setIsSubmitting(false);
                // Handle error display here if needed
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Contract Signature</h2>}
        >
            <Head title="Sign Contract" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Contract Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-green-50 border-b border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-green-800">WorkWise Contract</h1>
                                    <p className="text-green-600">Contract ID: {contract.contract_id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Date: {formatDate(contract.created_at)}</p>
                                    <p className="text-sm text-gray-600">Status: {contract.status.replace('_', ' ').toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Summary</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Project Details</h4>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Title:</strong> {contract.job.title}</p>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Total Payment:</strong> {formatCurrency(contract.total_payment)}</p>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Contract Type:</strong> {contract.contract_type}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Timeline</h4>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Start Date:</strong> {formatDate(contract.project_start_date)}</p>
                                    <p className="text-sm text-gray-600 mb-1"><strong>End Date:</strong> {formatDate(contract.project_end_date)}</p>
                                    <p className="text-sm text-gray-600 mb-1"><strong>Duration:</strong> {contract.bid.estimated_days} days</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-2">Parties</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="font-medium text-gray-700">Client</p>
                                        <p className="text-sm text-gray-600">{contract.client.first_name} {contract.client.last_name}</p>
                                        <p className="text-sm text-gray-600">{contract.client.email}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="font-medium text-gray-700">Freelancer</p>
                                        <p className="text-sm text-gray-600">{contract.freelancer.first_name} {contract.freelancer.last_name}</p>
                                        <p className="text-sm text-gray-600">{contract.freelancer.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-2">Scope of Work</h4>
                                <div className="bg-gray-50 p-4 rounded">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{contract.scope_of_work}</pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-blue-800">
                                            Ready to Sign as {userRole === 'client' ? 'Client' : 'Freelancer'}
                                        </h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            By clicking "Confirm and Sign," you agree to the terms of this contract.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Type your full name
                                    </label>
                                    <input
                                        type="text"
                                        id="full_name"
                                        value={data.full_name}
                                        onChange={(e) => setData('full_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        required
                                        disabled={processing || isSubmitting}
                                    />
                                    {errors.full_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                                    )}
                                </div>

                                {/* Live Preview */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Signature Preview
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                                        <div 
                                            className="text-3xl text-gray-700"
                                            style={{ fontFamily: 'Dancing Script, cursive' }}
                                        >
                                            {data.full_name || 'Your signature will appear here'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        disabled={processing || isSubmitting}
                                    >
                                        Back
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        disabled={processing || isSubmitting || !data.full_name.trim()}
                                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing || isSubmitting ? 'Signing...' : 'Confirm and Sign'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Contract Signed Successfully!</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Your signature has been recorded. Redirecting...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
