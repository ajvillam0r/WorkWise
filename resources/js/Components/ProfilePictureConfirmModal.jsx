import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function ProfilePictureConfirmModal({ 
    show, 
    currentImage, 
    newImage, 
    onConfirm, 
    onCancel,
    isUploading = false
}) {
    const getInitials = (name = 'User') => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onCancel}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold text-gray-900"
                                    >
                                        Replace Profile Picture?
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onCancel}
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Image Comparison */}
                                <div className="mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        {/* Current Image */}
                                        <div className="flex flex-col items-center">
                                            <p className="text-sm font-medium text-gray-700 mb-3">Current Photo</p>
                                            <div className="relative">
                                                {currentImage ? (
                                                    <img
                                                        src={currentImage}
                                                        alt="Current profile"
                                                        className="h-32 w-32 rounded-full object-cover ring-4 ring-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-gray-200">
                                                        {getInitials('User')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex justify-center">
                                            <svg 
                                                className="h-8 w-8 text-blue-500 hidden md:block" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                            <svg 
                                                className="h-8 w-8 text-blue-500 md:hidden rotate-90" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>

                                        {/* New Image */}
                                        <div className="flex flex-col items-center">
                                            <p className="text-sm font-medium text-gray-700 mb-3">New Photo</p>
                                            <div className="relative">
                                                {newImage ? (
                                                    <img
                                                        src={newImage}
                                                        alt="New profile"
                                                        className="h-32 w-32 rounded-full object-cover ring-4 ring-blue-500 shadow-lg"
                                                    />
                                                ) : (
                                                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-blue-500">
                                                        ?
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Message */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-center text-gray-700 font-medium">
                                        Do you want to replace your current profile photo with this image?
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onCancel}
                                        disabled={isUploading}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        No, Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
                                        onClick={onConfirm}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Yes, Replace
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

