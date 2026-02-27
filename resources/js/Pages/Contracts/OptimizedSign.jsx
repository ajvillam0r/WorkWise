import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DocumentCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    UserIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function OptimizedSign({ auth, contract, userRole, user, waitingForEmployer, employerName }) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showContractCreatedToast, setShowContractCreatedToast] = useState(!!flashSuccess);
    const [showWaitingModal, setShowWaitingModal] = useState(waitingForEmployer || false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [hasReadContract, setHasReadContract] = useState(false);
    const [signatureStep, setSignatureStep] = useState(1); // 1: Review, 2: Confirm, 3: Sign
    
    const { data, setData, processing, errors } = useForm({
        full_name: `${user.first_name} ${user.last_name}`,
        browser_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            screen: {
                width: window.screen.width,
                height: window.screen.height
            }
        }
    });

    // Auto-detect when user has scrolled through contract
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            if (scrolled > maxScroll * 0.7) { // 70% scrolled
                setHasReadContract(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-hide "Contract created" toast after 4 seconds
    useEffect(() => {
        if (!showContractCreatedToast) return;
        const t = setTimeout(() => setShowContractCreatedToast(false), 4000);
        return () => clearTimeout(t);
    }, [showContractCreatedToast]);

    const handleNextStep = () => {
        if (signatureStep < 3) {
            setSignatureStep(signatureStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (signatureStep > 1) {
            setSignatureStep(signatureStep - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!agreedToTerms) {
            setErrorMessage('Please agree to the contract terms before signing.');
            setShowErrorModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(route('contracts.processSignature', contract.id), data);
            
            setShowSuccessModal(true);
            setTimeout(() => {
                const redirectUrl = response.data?.redirect_url || route('contracts.show', contract.id);
                router.visit(redirectUrl);
            }, 2500);

        } catch (error) {
            console.error('Contract signing error:', error);

            // Check if this is a "waiting for employer" error
            if (error.response?.data?.waiting_for_employer || error.response?.data?.message?.includes('employer signs first')) {
                setShowWaitingModal(true);
                setIsSubmitting(false);
                return;
            }

            // Handle other errors with better messaging
            let errorMsg = 'Failed to sign contract. Please try again.';

            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.status === 500) {
                errorMsg = 'Server error occurred. Please try again or contact support.';
            } else if (error.response?.status === 403) {
                errorMsg = 'You are not authorized to sign this contract.';
            }

            setErrorMessage(errorMsg);
            setShowErrorModal(true);
            setIsSubmitting(false);
        }
    };

    const ContractSummary = () => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentCheckIcon className="w-5 h-5 mr-2 text-blue-600" />
                Contract Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Project:</span>
                    <span className="ml-2 font-medium">{contract.job?.title}</span>
                </div>
                <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium text-green-600">₱{contract.total_payment?.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <span className="ml-2 font-medium">{new Date(contract.project_start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">End Date:</span>
                    <span className="ml-2 font-medium">{new Date(contract.project_end_date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        step <= signatureStep 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-gray-300 text-gray-400'
                    }`}>
                        {step < signatureStep ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <span className="text-sm font-medium">{step}</span>
                        )}
                    </div>
                    {step < 3 && (
                        <div className={`w-16 h-0.5 mx-2 ${
                            step < signatureStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const StepLabels = () => (
        <div className="flex justify-between mb-8 text-sm">
            <span className={signatureStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                Review Contract
            </span>
            <span className={signatureStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                Confirm Details
            </span>
            <span className={signatureStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                Digital Signature
            </span>
        </div>
    );

    if (showWaitingModal) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Contract Signing - Waiting" />
                <div className="py-12">
                    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-8 text-center">
                                <ClockIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Waiting for Employer Signature
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    {employerName || 'The employer'} needs to sign the contract first before you can proceed.
                                    You'll receive a notification once they've completed their signature.
                                </p>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => router.visit(route('contracts.show', contract.id))}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        View Contract Details
                                    </button>
                                    <button
                                        onClick={() => router.visit(route('contracts.index'))}
                                        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Back to Contracts
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Sign Contract - ${contract.contract_id}`} />

            {showContractCreatedToast && flashSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">{flashSuccess}</p>
                    </div>
                </div>
            )}

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Digital Contract Signature
                                </h1>
                                <p className="text-gray-600">
                                    Contract ID: <span className="font-medium">{contract.contract_id}</span>
                                </p>
                            </div>

                            <StepIndicator />
                            <StepLabels />

                            {signatureStep === 1 && (
                                <div className="space-y-6">
                                    <ContractSummary />
                                    
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold mb-4">Contract Terms & Conditions</h3>
                                        <div className="prose max-w-none text-sm text-gray-700 space-y-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Scope of Work:</h4>
                                                <p className="whitespace-pre-line">{contract.scope_of_work}</p>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-gray-900">Your Responsibilities:</h4>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {(userRole === 'employer' ? contract.employer_responsibilities : contract.gig_worker_responsibilities)?.map((responsibility, index) => (
                                                        <li key={index}>{responsibility}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-gray-900">Communication:</h4>
                                                <p>Method: {contract.preferred_communication}</p>
                                                <p>Frequency: {contract.communication_frequency}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="readContract"
                                            checked={hasReadContract}
                                            onChange={(e) => setHasReadContract(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="readContract" className="text-sm text-gray-700">
                                            I have read and understood the contract terms
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleNextStep}
                                            disabled={!hasReadContract}
                                            className={`px-6 py-2 rounded-lg transition-colors ${
                                                hasReadContract
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            Continue to Confirmation
                                        </button>
                                    </div>
                                </div>
                            )}

                            {signatureStep === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-4">
                                            Confirm Contract Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Contract ID:</span>
                                                <span className="font-medium">{contract.contract_id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Project:</span>
                                                <span className="font-medium">{contract.job?.title}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Amount:</span>
                                                <span className="font-medium text-green-600">₱{contract.total_payment?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Duration:</span>
                                                <span className="font-medium">
                                                    {new Date(contract.project_start_date).toLocaleDateString()} - {new Date(contract.project_end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Signing as:</span>
                                                <span className="font-medium capitalize">{userRole.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="agreeTerms"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                                            I agree to the terms and conditions of this contract
                                        </label>
                                    </div>

                                    <div className="flex justify-between">
                                        <button
                                            onClick={handlePrevStep}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Back to Review
                                        </button>
                                        <button
                                            onClick={handleNextStep}
                                            disabled={!agreedToTerms}
                                            className={`px-6 py-2 rounded-lg transition-colors ${
                                                agreedToTerms
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            Proceed to Signature
                                        </button>
                                    </div>
                                </div>
                            )}

                            {signatureStep === 3 && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                            <UserIcon className="w-5 h-5 mr-2" />
                                            Digital Signature
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Legal Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="full_name"
                                                    value={data.full_name}
                                                    onChange={(e) => setData('full_name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                                {errors.full_name && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p>By typing your name above, you are providing your digital signature.</p>
                                                <p>Timestamp: {new Date().toLocaleString()}</p>
                                                <p>IP Address will be recorded for security purposes.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between">
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Back to Confirmation
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !data.full_name.trim()}
                                            className={`px-8 py-2 rounded-lg transition-colors flex items-center ${
                                                isSubmitting || !data.full_name.trim()
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Signing Contract...
                                                </>
                                            ) : (
                                                <>
                                                    <DocumentCheckIcon className="w-5 h-5 mr-2" />
                                                    Sign Contract
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Contract Signed Successfully!
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Your digital signature has been recorded. Redirecting you now...
                            </p>
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Signature Failed
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {errorMessage}
                            </p>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
