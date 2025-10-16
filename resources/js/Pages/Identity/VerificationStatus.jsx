import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ExclamationTriangleIcon,
    DocumentCheckIcon,
    CameraIcon,
    ShieldCheckIcon,
    EyeIcon,
    ArrowPathIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export default function VerificationStatus({ verification, flash }) {
    const { auth } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);
    const [statusData, setStatusData] = useState(verification);

    // Status configuration
    const statusConfig = {
        pending: {
            icon: ClockIcon,
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-600',
            title: 'Verification Pending',
            description: 'Your identity verification is being processed.'
        },
        processing: {
            icon: ArrowPathIcon,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-600',
            title: 'Processing Verification',
            description: 'We are currently reviewing your submitted documents.'
        },
        verified: {
            icon: CheckCircleIcon,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800',
            iconColor: 'text-green-600',
            title: 'Identity Verified',
            description: 'Your identity has been successfully verified.'
        },
        requires_input: {
            icon: ExclamationTriangleIcon,
            color: 'orange',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-800',
            iconColor: 'text-orange-600',
            title: 'Additional Information Required',
            description: 'Please provide additional information to complete verification.'
        },
        canceled: {
            icon: XCircleIcon,
            color: 'red',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-600',
            title: 'Verification Canceled',
            description: 'The verification process was canceled.'
        }
    };

    const currentStatus = statusConfig[statusData?.status] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;

    // Check verification status
    const checkStatus = async () => {
        if (!statusData?.id) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(`/api/identity/verification/status?verification_id=${statusData.id}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setStatusData(data.verification);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-refresh for pending/processing statuses
    useEffect(() => {
        if (statusData?.status === 'pending' || statusData?.status === 'processing') {
            const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
            return () => clearInterval(interval);
        }
    }, [statusData?.status]);

    // Verification checks display
    const renderVerificationChecks = () => {
        if (!statusData?.verification_data) return null;

        const checks = [
            {
                key: 'document_verification',
                label: 'Government ID Verification',
                icon: DocumentCheckIcon,
                passed: statusData.verification_data.document?.status === 'verified'
            },
            {
                key: 'selfie_verification', 
                label: 'Selfie Verification',
                icon: CameraIcon,
                passed: statusData.verification_data.selfie?.status === 'verified'
            },
            {
                key: 'liveness_check',
                label: 'Liveness Detection',
                icon: EyeIcon,
                passed: statusData.liveness_check_passed
            },
            {
                key: 'fraud_detection',
                label: 'Fraud Detection',
                icon: ShieldCheckIcon,
                passed: statusData.fraud_detection_results?.risk_level === 'low'
            }
        ];

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Checks</h3>
                <div className="space-y-4">
                    {checks.map((check) => {
                        const CheckIcon = check.icon;
                        return (
                            <div key={check.key} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <CheckIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">
                                        {check.label}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    {check.passed ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <ClockIcon className="h-5 w-5 text-yellow-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Identity Verification Status
                    </h2>
                    <button
                        onClick={checkStatus}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </button>
                </div>
            }
        >
            <Head title="Identity Verification Status" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        {flash.success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {flash.error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Main Status Card */}
                        <div className={`${currentStatus.bgColor} ${currentStatus.borderColor} border rounded-lg p-6`}>
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 ${currentStatus.iconColor}`}>
                                    <StatusIcon className="h-8 w-8" />
                                </div>
                                <div className="ml-4">
                                    <h3 className={`text-lg font-semibold ${currentStatus.textColor}`}>
                                        {currentStatus.title}
                                    </h3>
                                    <p className={`text-sm ${currentStatus.textColor} opacity-80`}>
                                        {currentStatus.description}
                                    </p>
                                    {statusData?.created_at && (
                                        <p className={`text-xs ${currentStatus.textColor} opacity-60 mt-1`}>
                                            Started {formatDistanceToNow(new Date(statusData.created_at))} ago
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Additional status information */}
                            {statusData?.failure_reason && (
                                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-md">
                                    <p className="text-sm font-medium text-red-800">Reason:</p>
                                    <p className="text-sm text-red-700">{statusData.failure_reason}</p>
                                </div>
                            )}

                            {statusData?.expires_at && statusData.status === 'pending' && (
                                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-md">
                                    <p className="text-sm font-medium text-yellow-800">
                                        Expires {formatDistanceToNow(new Date(statusData.expires_at))} from now
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Verification Checks */}
                        {renderVerificationChecks()}

                        {/* Action Buttons */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {statusData?.status === 'requires_input' && (
                                    <Link
                                        href="/identity/verify"
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <DocumentCheckIcon className="h-4 w-4 mr-2" />
                                        Complete Verification
                                    </Link>
                                )}

                                {(statusData?.status === 'canceled' || !statusData) && (
                                    <Link
                                        href="/identity/verify"
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <DocumentCheckIcon className="h-4 w-4 mr-2" />
                                        Start Verification
                                    </Link>
                                )}

                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>

                        {/* Information Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        About Identity Verification
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            Our identity verification process includes:
                                        </p>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Government-issued ID document scanning</li>
                                            <li>Facial recognition and selfie matching</li>
                                            <li>Liveness detection to prevent fraud</li>
                                            <li>Advanced fraud detection algorithms</li>
                                        </ul>
                                        <p className="mt-2">
                                            This helps ensure the safety and security of all users on our platform.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}