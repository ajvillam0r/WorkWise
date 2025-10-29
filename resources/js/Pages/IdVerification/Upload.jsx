import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import IDUploadForm from '@/Components/IDUploadForm';

export default function Upload() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        ID Verification
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Upload your valid ID to verify your identity
                    </p>
                </div>
            }
        >
            <Head title="ID Verification" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8">
                            {/* Information Banner */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Why verify your ID?</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Build trust with employers</li>
                                                <li>Increase your chances of getting hired</li>
                                                <li>Unlock access to premium jobs</li>
                                                <li>Your information is kept secure and confidential</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Status */}
                            {user.id_verification_status && (
                                <div className={`rounded-lg p-4 mb-6 ${
                                    user.id_verification_status === 'verified' ? 'bg-green-50 border border-green-200' :
                                    user.id_verification_status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                                    'bg-red-50 border border-red-200'
                                }`}>
                                    <h3 className="text-sm font-medium mb-2">
                                        Current Status: <span className="capitalize">{user.id_verification_status}</span>
                                    </h3>
                                    {user.id_verification_notes && (
                                        <p className="text-sm">{user.id_verification_notes}</p>
                                    )}
                                </div>
                            )}

                            {/* ID Upload Form */}
                            <IDUploadForm
                                currentStatus={user.id_verification_status}
                                idFrontUrl={user.id_front_image}
                                idBackUrl={user.id_back_image}
                                idType={user.id_type}
                            />

                            {/* Help Section */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Acceptable Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Government-issued IDs:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Philippine Passport</li>
                                            <li>Driver's License</li>
                                            <li>SSS ID</li>
                                            <li>UMID</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Clear and readable image</li>
                                            <li>All corners visible</li>
                                            <li>No glare or shadows</li>
                                            <li>Valid and not expired</li>
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



