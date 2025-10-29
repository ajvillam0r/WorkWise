import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function IDUploadForm({ 
    currentStatus = null, 
    idFrontUrl = null, 
    idBackUrl = null,
    idType = null 
}) {
    const [previewFront, setPreviewFront] = useState(idFrontUrl);
    const [previewBack, setPreviewBack] = useState(idBackUrl);

    const { data, setData, post, processing, errors, progress } = useForm({
        id_type: idType || '',
        id_front_image: null,
        id_back_image: null,
    });

    const handleFileChange = (field, file) => {
        setData(field, file);

        // Create preview
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'id_front_image') {
                    setPreviewFront(reader.result);
                } else if (field === 'id_back_image') {
                    setPreviewBack(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/api/id-verification/upload', {
            forceFormData: true,
            onSuccess: () => {
                // Handle success - could be a page refresh or notification
            },
        });
    };

    const getStatusBadge = () => {
        if (!currentStatus) return null;

        const statusConfig = {
            pending: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                label: 'Pending Review',
                icon: '⏳',
            },
            verified: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                label: 'Verified',
                icon: '✓',
            },
            rejected: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                label: 'Rejected - Resubmit Required',
                icon: '❌',
            },
        };

        const config = statusConfig[currentStatus] || statusConfig.pending;

        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} mb-4`}>
                <span className="mr-2">{config.icon}</span>
                {config.label}
            </div>
        );
    };

    const idTypes = [
        { value: 'national_id', label: 'National ID (PhilID)' },
        { value: 'drivers_license', label: 'Driver\'s License' },
        { value: 'passport', label: 'Passport' },
        { value: 'sss_id', label: 'SSS ID' },
        { value: 'philhealth_id', label: 'PhilHealth ID' },
        { value: 'umid', label: 'UMID' },
        { value: 'voters_id', label: 'Voter\'s ID' },
        { value: 'prc_id', label: 'PRC ID' },
    ];

    return (
        <div>
            {getStatusBadge()}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ID Type Selection */}
                <div>
                    <label htmlFor="id_type" className="block text-sm font-medium text-gray-700 mb-2">
                        ID Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="id_type"
                        value={data.id_type}
                        onChange={(e) => setData('id_type', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={processing}
                        required
                    >
                        <option value="">Select ID Type</option>
                        {idTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.id_type && (
                        <p className="mt-2 text-sm text-red-600">{errors.id_type}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front ID Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Front Side <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                            {previewFront ? (
                                <div className="relative">
                                    <img 
                                        src={previewFront} 
                                        alt="ID Front" 
                                        className="max-h-48 mx-auto rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewFront(null);
                                            setData('id_front_image', null);
                                        }}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-600">Click to upload front</span>
                                        <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('id_front_image', e.target.files[0])}
                                        className="hidden"
                                        disabled={processing}
                                    />
                                </label>
                            )}
                        </div>
                        {errors.id_front_image && (
                            <p className="mt-2 text-sm text-red-600">{errors.id_front_image}</p>
                        )}
                    </div>

                    {/* Back ID Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Back Side <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                            {previewBack ? (
                                <div className="relative">
                                    <img 
                                        src={previewBack} 
                                        alt="ID Back" 
                                        className="max-h-48 mx-auto rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewBack(null);
                                            setData('id_back_image', null);
                                        }}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-gray-600">Click to upload back</span>
                                        <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('id_back_image', e.target.files[0])}
                                        className="hidden"
                                        disabled={processing}
                                    />
                                </label>
                            )}
                        </div>
                        {errors.id_back_image && (
                            <p className="mt-2 text-sm text-red-600">{errors.id_back_image}</p>
                        )}
                    </div>
                </div>

                {/* Upload Progress */}
                {progress && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Ensure your ID is clear and all details are readable
                    </p>
                    <button
                        type="submit"
                        disabled={processing || !data.id_type || !data.id_front_image || !data.id_back_image}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {processing ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            'Submit for Verification'
                        )}
                    </button>
                </div>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for ID Verification:</h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Make sure your ID is not expired</li>
                    <li>Ensure all text is clearly visible</li>
                    <li>Avoid glare or shadows</li>
                    <li>Use a high-resolution image</li>
                    <li>Do not cover any part of the ID</li>
                </ul>
            </div>
        </div>
    );
}




