import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    DocumentCheckIcon, 
    CameraIcon, 
    ShieldCheckIcon, 
    EyeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ArrowRightIcon,
    ClockIcon,
    XCircleIcon,
    LockClosedIcon,
    UserGroupIcon,
    StarIcon,
    DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

export default function Verify({ verification, flash }) {
    const { auth } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verificationSession, setVerificationSession] = useState(verification);
    const [hasCamera, setHasCamera] = useState(true);
    const [showCameraInstructions, setShowCameraInstructions] = useState(false);

    // Check for camera availability
    useEffect(() => {
        const checkCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop());
                    setHasCamera(true);
                } else {
                    setHasCamera(false);
                }
            } catch (error) {
                console.log('Camera not available:', error);
                setHasCamera(false);
            }
        };

        checkCamera();
    }, []);

    // Start verification process
    const startVerification = async () => {
        setIsLoading(true);
        setError(null);

        // Check camera availability before starting
        if (!hasCamera) {
            setShowCameraInstructions(true);
            setIsLoading(false);
            return;
        }

        try {
            console.log('=== AUTHENTICATION DEBUG ===');
            console.log('User auth data:', auth);
            console.log('User object:', auth?.user);
            console.log('User ID:', auth?.user?.id);
            console.log('User email:', auth?.user?.email);
            console.log('User type:', auth?.user?.user_type);
            
            // Check if user is authenticated
            if (!auth || !auth.user) {
                console.error('User is not authenticated!');
                setError('You must be logged in to verify your identity. Please log in and try again.');
                setIsLoading(false);
                return;
            }
            
            console.log('=== CSRF & API CALL DEBUG ===');
            console.log('Starting verification for user:', auth.user);
            
            // First, test if we can reach the user endpoint
            console.log('Testing user authentication endpoint...');
            try {
                const userResponse = await window.axios.get('/api/user');
                console.log('User endpoint response:', userResponse.data);
            } catch (userErr) {
                console.error('User endpoint failed:', userErr);
                setError('Authentication failed. Please log out and log back in.');
                setIsLoading(false);
                return;
            }
            
            // First, get CSRF cookie from Laravel backend
            console.log('Fetching CSRF cookie...');
            await window.axios.get('/sanctum/csrf-cookie');
            console.log('CSRF cookie obtained');
            
            // Use global axios instance with proper authentication
            console.log('Making API call to create verification session...');
            const response = await window.axios.post('/api/identity/verification/create', {
                type: 'document',
                options: {
                    document: {
                        allowed_types: ['driving_license', 'passport', 'id_card'],
                        require_id_number: true,
                        require_live_capture: true,
                        require_matching_selfie: true
                    }
                }
            });

            const data = response.data;
            console.log('Verification response:', data);
            
            if (data.success && (data.verification_url || data.verification_session?.url)) {
                const verificationUrl = data.verification_url || data.verification_session.url;
                console.log('Redirecting to:', verificationUrl);
                // Redirect to Stripe Identity verification
                window.location.href = verificationUrl;
            } else {
                setError(data.message || 'Failed to start verification process');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Verification error:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            
            if (err.response?.status === 401) {
                setError('Authentication failed. Please log out and log back in to continue.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            setIsLoading(false);
        }
    };

    // Camera Instructions Modal Component
    const CameraInstructionsModal = () => (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                        Camera Required for Verification
                    </h3>
                    
                    <div className="space-y-4 text-sm text-gray-600">
                        <p>
                            Identity verification requires a camera for document scanning and selfie capture. 
                            We detected that your current device doesn't have camera access.
                        </p>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-start">
                                <DevicePhoneMobileIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-blue-900 mb-2">Alternative Options:</h4>
                                    <ul className="space-y-1 text-blue-800">
                                        <li>• Use a mobile device with camera capabilities</li>
                                        <li>• Enable camera permissions in your browser</li>
                                        <li>• Try a different device with a working camera</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Mobile Verification Steps:</h4>
                            <ol className="space-y-1 text-gray-700 text-sm">
                                <li>1. Open WorkWise on your mobile device</li>
                                <li>2. Navigate to Identity Verification</li>
                                <li>3. Complete the verification process</li>
                                <li>4. Return to this device once verified</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={() => setShowCameraInstructions(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowCameraInstructions(false);
                                startVerification();
                            }}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Try Anyway
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Verification features
    const verificationFeatures = [
        {
            icon: DocumentCheckIcon,
            title: 'Government ID Verification',
            description: 'Scan your government-issued ID (passport, driver\'s license, or national ID card)',
            features: [
                'Document authenticity verification',
                'Data extraction and validation',
                'Security feature detection'
            ]
        },
        {
            icon: CameraIcon,
            title: 'Selfie & Face Matching',
            description: 'Take a selfie to verify your identity matches your ID document',
            features: [
                'Facial recognition technology',
                'Biometric matching',
                'Photo quality verification'
            ]
        },
        {
            icon: EyeIcon,
            title: 'Liveness Detection',
            description: 'Advanced technology to ensure you\'re a real person, not a photo or video',
            features: [
                'Real-time liveness checks',
                'Anti-spoofing protection',
                'Motion detection'
            ]
        },
        {
            icon: ShieldCheckIcon,
            title: 'Fraud Detection',
            description: 'Multi-layered security to detect and prevent fraudulent attempts',
            features: [
                'AI-powered fraud detection',
                'Risk assessment algorithms',
                'Behavioral analysis'
            ]
        }
    ];

    // Security benefits
    const securityBenefits = [
        'Enhanced account security',
        'Access to premium features',
        'Higher trust rating',
        'Increased earning potential',
        'Priority customer support'
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Identity Verification
                </h2>
            }
        >
            <Head title="Identity Verification" />

            {/* Camera Instructions Modal */}
            {showCameraInstructions && <CameraInstructionsModal />}

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                            <div className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        {flash.success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {flash.error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6 sm:space-y-8">
                        {/* Header Section */}
                        <div className="text-center px-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 mb-4">
                                <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                                Verify Your Identity
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                                Complete our secure identity verification process to unlock all platform features 
                                and build trust with other users.
                            </p>
                        </div>

                        {/* Camera Status Indicator */}
                        {!hasCamera && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Camera Not Detected
                                        </h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            We couldn't detect a camera on your device. You'll need camera access for identity verification.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Status */}
                        {verificationSession && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center">
                                    <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
                                    <div className="ml-3">
                                        <h3 className="text-base sm:text-lg font-semibold text-yellow-800">
                                            Verification in Progress
                                        </h3>
                                        <p className="text-sm text-yellow-700">
                                            You have an ongoing verification session. 
                                            <Link 
                                                href="/identity/status" 
                                                className="font-medium underline hover:no-underline ml-1"
                                            >
                                                Check status
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Features */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                                What We'll Verify
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {verificationFeatures.map((feature, index) => {
                                    const FeatureIcon = feature.icon;
                                    return (
                                        <div key={index} className="flex">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100">
                                                    <FeatureIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="ml-3 sm:ml-4">
                                                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {feature.description}
                                                </p>
                                                <ul className="text-xs text-gray-500 space-y-1">
                                                    {feature.features.map((item, idx) => (
                                                        <li key={idx} className="flex items-center">
                                                            <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Security Benefits */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-green-200">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                                Benefits of Verification
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {securityBenefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center">
                                        <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {benefit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Privacy & Security Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                            <div className="flex">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Privacy & Security
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p className="mb-2">
                                            Your privacy and security are our top priorities:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>All data is encrypted and securely stored</li>
                                            <li>We use Stripe Identity, a trusted verification provider</li>
                                            <li>Your documents are processed securely and deleted after verification</li>
                                            <li>We comply with GDPR and other privacy regulations</li>
                                            <li>You can request data deletion at any time</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Ready to Get Verified?
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    The verification process typically takes 2-5 minutes to complete.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                    <button
                                        onClick={startVerification}
                                        disabled={isLoading}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Starting Verification...
                                            </>
                                        ) : (
                                            <>
                                                <DocumentCheckIcon className="h-5 w-5 mr-2" />
                                                Start Verification
                                                <ArrowRightIcon className="h-5 w-5 ml-2" />
                                            </>
                                        )}
                                    </button>

                                    {verificationSession && (
                                        <Link
                                            href="/identity/status"
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
                                        >
                                            <ClockIcon className="h-5 w-5 mr-2" />
                                            Check Status
                                        </Link>
                                    )}

                                    <Link
                                        href="/dashboard"
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
                                    >
                                        Maybe Later
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                What You'll Need
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Accepted Documents:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Government-issued passport</li>
                                        <li>• Driver's license</li>
                                        <li>• National ID card</li>
                                        <li>• State-issued ID card</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Document must be valid and not expired</li>
                                        <li>• Clear, high-quality photos</li>
                                        <li>• Good lighting conditions</li>
                                        <li>• Camera access for selfie verification</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Mobile-Specific Instructions */}
                        <div className="sm:hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Mobile Verification Tips
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="space-y-1">
                                            <li>• Hold your device steady during scanning</li>
                                            <li>• Ensure good lighting for clear photos</li>
                                            <li>• Use landscape mode for document scanning</li>
                                            <li>• Keep your ID flat and fully visible</li>
                                        </ul>
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