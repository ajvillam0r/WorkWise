import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SuccessModal from '@/Components/SuccessModal';
import { formatDistanceToNow } from 'date-fns';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'green', isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmColor === 'green' ? 'bg-green-100' : confirmColor === 'blue' ? 'bg-blue-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                                {confirmColor === 'green' ? (
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : confirmColor === 'blue' ? (
                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                )}
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                confirmColor === 'green'
                                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                    : confirmColor === 'blue'
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : confirmText}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ProjectShow({ project, hasPayment, canReview, isClient }) {
    const { auth } = usePage().props;
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [showCompletionForm, setShowCompletionForm] = useState(false);
    const [completionError, setCompletionError] = useState(null);

    // Helper function to safely parse required_skills
    const parseSkills = (skills) => {
        if (!skills) return [];

        // If it's already an array, return it
        if (Array.isArray(skills)) return skills;

        // If it's a string, try to parse it as JSON
        if (typeof skills === 'string') {
            try {
                const parsed = JSON.parse(skills);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }

        return [];
    };
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        action: null,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'blue'
    });
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        message: ''
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        rating: 5,
        comment: '',
        criteria_ratings: {
            communication: 5,
            quality: 5,
            timeliness: 5
        }
    });

    const { data: revisionData, setData: setRevisionData, post: postRevision, processing: revisionProcessing } = useForm({
        revision_notes: ''
    });

    const { data: completionData, setData: setCompletionData, post: postCompletion, processing: completionProcessing, reset: resetCompletion } = useForm({
        completion_notes: ''
    });

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            disputed: 'bg-yellow-100 text-yellow-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const handleComplete = () => {
        setShowCompletionForm(true);
        setCompletionError(null);
        resetCompletion();
    };

    const handleApprove = () => {
        setConfirmModal({
            isOpen: true,
            action: 'approve',
            title: 'Approve Project Completion',
            message: 'Are you sure you want to approve this project as completed? This will automatically release the payment to the freelancer.',
            confirmText: 'Approve & Release Payment',
            confirmColor: 'blue'
        });
    };

    const handleReleasePayment = () => {
        setConfirmModal({
            isOpen: true,
            action: 'release',
            title: 'Release Payment',
            message: 'Are you sure you want to release the payment? This action cannot be undone and the funds will be transferred to the freelancer immediately.',
            confirmText: 'Release Payment',
            confirmColor: 'green'
        });
    };

    const handleConfirmAction = () => {
        if (confirmModal.action === 'approve') {
            post(`/projects/${project.id}/approve`, {
                onSuccess: () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setSuccessModal({
                        isOpen: true,
                        message: 'Project approved successfully! Payment has been automatically released to the freelancer.'
                    });
                },
                onError: () => setConfirmModal({ ...confirmModal, isOpen: false })
            });
        } else if (confirmModal.action === 'release') {
            post(`/projects/${project.id}/payment/release`, {
                onSuccess: () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setSuccessModal({
                        isOpen: true,
                        message: 'Payment released successfully! Funds have been transferred to the freelancer.'
                    });
                },
                onError: () => setConfirmModal({ ...confirmModal, isOpen: false })
            });
        }
    };

    const handleCloseModal = () => {
        if (!processing) {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const submitReview = (e) => {
        e.preventDefault();
        post(`/projects/${project.id}/review`, {
            onSuccess: () => {
                setShowReviewForm(false);
                reset();
            }
        });
    };

    const submitRevision = (e) => {
        e.preventDefault();
        postRevision(`/projects/${project.id}/request-revision`, {
            onSuccess: () => {
                setShowRevisionForm(false);
                setRevisionData('revision_notes', '');
            }
        });
    };

    const submitCompletion = (e) => {
        e.preventDefault();
        setCompletionError(null);

        postCompletion('/projects/' + project.id + '/complete', {
            data: {
                completion_notes: completionData.completion_notes
            },
            preserveScroll: true,
            onSuccess: () => {
                setShowCompletionForm(false);
                resetCompletion();
                setSuccessModal({
                    isOpen: true,
                    message: 'Project marked as complete! The client will be notified to review and approve your work.'
                });
                // Refresh the page after modal closes to show updated status
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            },
            onError: (errors) => {
                console.error('Completion error:', errors);
                if (errors.completion_notes) {
                    setCompletionError(errors.completion_notes);
                } else if (errors.error) {
                    setCompletionError(errors.error);
                } else {
                    setCompletionError('Failed to complete project. Please try again.');
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {project.job.title}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Project with {isClient ? project.freelancer.first_name : project.client.first_name} {isClient ? project.freelancer.last_name : project.client.last_name}
                        </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                </div>
            }
        >
            <Head title={`Project: ${project.job.title}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Project Overview */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700">{project.job.description}</p>
                                    </div>
                                    
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Required Skills</dt>
                                            <dd className="mt-1">
                                                <div className="flex flex-wrap gap-2">
                                                    {parseSkills(project.job.required_skills).map((skill, index) => (
                                                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                                            <dd className="mt-1 text-sm text-gray-900 capitalize">{project.job.experience_level}</dd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Project Actions */}
                            {project.status === 'active' && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Project Actions</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {!isClient && (
                                                <button
                                                    onClick={handleComplete}
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    ✅ Mark as Completed
                                                </button>
                                            )}
                                            
                                            {isClient && (
                                                <button
                                                    onClick={() => setShowRevisionForm(true)}
                                                    className="inline-flex items-center px-4 py-2 bg-yellow-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-700 focus:bg-yellow-700 active:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    🔄 Request Revision
                                                </button>
                                            )}

                                            <Link
                                                href={`/messages/${isClient ? project.freelancer.id : project.client.id}`}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                            >
                                                💬 Send Message
                                            </Link>
                                        </div>

                                        {/* Completion Form Modal */}
                                        {showCompletionForm && (
                                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                                                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                                    <h3 className="text-lg font-semibold mb-4">Complete Project</h3>
                                                    {completionError && (
                                                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                                                            {completionError}
                                                        </div>
                                                    )}
                                                    <form onSubmit={submitCompletion}>
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Completion Notes *
                                                            </label>
                                                            <textarea
                                                                value={completionData.completion_notes}
                                                                onChange={e => setCompletionData('completion_notes', e.target.value)}
                                                                rows={4}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Describe what you've completed and any final notes for the client..."
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowCompletionForm(false);
                                                                    setCompletionError(null);
                                                                    resetCompletion();
                                                                }}
                                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                disabled={completionProcessing}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={completionProcessing}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                                            >
                                                                {completionProcessing ? (
                                                                    <>
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Processing...
                                                                    </>
                                                                ) : 'Complete Project'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Completed Project Actions */}
                            {project.status === 'completed' && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Project Completed</h3>
                                        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <span className="text-green-400 text-xl">✅</span>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-green-800">
                                                        Project Completed Successfully
                                                    </h3>
                                                    <div className="mt-2 text-sm text-green-700">
                                                        <p>This project has been marked as completed.</p>
                                                        {project.completion_notes && (
                                                            <p className="mt-1"><strong>Notes:</strong> {project.completion_notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {isClient && !project.client_approved && (
                                                <button
                                                    onClick={handleApprove}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    ✓ Approve Completion
                                                </button>
                                            )}

                                            {isClient && project.client_approved && hasPayment && !project.payment_released && (
                                                <button
                                                    onClick={handleReleasePayment}
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    💰 Release Payment
                                                </button>
                                            )}

                                            {canReview && (
                                                <button
                                                    onClick={() => setShowReviewForm(true)}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                >
                                                    ⭐ Leave Review
                                                </button>
                                            )}

                                            <Link
                                                href="/payment/history"
                                                className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                            >
                                                💳 View Payments
                                            </Link>
                                        </div>

                                        {/* Status Timeline */}
                                        <div className="mt-6 border-t border-gray-200 pt-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Project Timeline</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center text-sm">
                                                    <div className="w-24 flex-shrink-0 text-gray-500">Completed:</div>
                                                    <div className="text-gray-900">{formatDistanceToNow(new Date(project.completed_at))} ago</div>
                                                </div>
                                                {project.client_approved && (
                                                    <div className="flex items-center text-sm">
                                                        <div className="w-24 flex-shrink-0 text-gray-500">Approved:</div>
                                                        <div className="text-gray-900">{formatDistanceToNow(new Date(project.approved_at))} ago</div>
                                                    </div>
                                                )}
                                                {project.payment_released && (
                                                    <div className="flex items-center text-sm">
                                                        <div className="w-24 flex-shrink-0 text-gray-500">Paid:</div>
                                                        <div className="text-gray-900">{formatDistanceToNow(new Date(project.payment_released_at))} ago</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reviews */}
                            {project.reviews && project.reviews.length > 0 && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                                        <div className="space-y-4">
                                            {project.reviews.map((review) => (
                                                <div key={review.id} className="border-l-4 border-blue-400 pl-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-medium">
                                                            {review.reviewer.first_name} {review.reviewer.last_name}
                                                        </div>
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                                    ★
                                                                </span>
                                                            ))}
                                                            <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                                                        </div>
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-gray-700">{review.comment}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Project Details */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Project Value</dt>
                                            <dd className="text-lg font-semibold text-green-600">
                                                ₱{project.agreed_amount.toLocaleString()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Duration</dt>
                                            <dd className="text-sm text-gray-900">{project.agreed_duration_days} days</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Started</dt>
                                            <dd className="text-sm text-gray-900">
                                                {formatDistanceToNow(new Date(project.started_at))} ago
                                            </dd>
                                        </div>
                                        {project.deadline && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {new Date(project.deadline).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        )}
                                        {project.completed_at && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {formatDistanceToNow(new Date(project.completed_at))} ago
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            {/* Payment Status */}
                            {hasPayment && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Escrow</span>
                                                <span className="text-sm font-medium text-green-600">✅ Secured</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Payment</span>
                                                <span className={`text-sm font-medium ${project.payment_released ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {project.payment_released ? '✅ Released' : '⏳ In Escrow'}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href="/payment/history"
                                            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View transaction details →
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <Link
                                            href={`/messages/${isClient ? project.freelancer.id : project.client.id}`}
                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                        >
                                            💬 Send Message
                                        </Link>
                                        <Link
                                            href="/payment/history"
                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                        >
                                            💳 Payment History
                                        </Link>
                                        <Link
                                            href={`/reports/create?user_id=${isClient ? project.freelancer.id : project.client.id}&project_id=${project.id}`}
                                            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            🚨 Report Issue
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave a Review</h3>
                            <form onSubmit={submitReview}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Overall Rating
                                    </label>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => setData('rating', rating)}
                                                className={`text-2xl ${rating <= data.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comment (Optional)
                                    </label>
                                    <textarea
                                        value={data.comment}
                                        onChange={(e) => setData('comment', e.target.value)}
                                        rows={4}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Share your experience..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewForm(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Revision Request Modal */}
            {showRevisionForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Revision</h3>
                            <form onSubmit={submitRevision}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Revision Notes
                                    </label>
                                    <textarea
                                        value={revisionData.revision_notes}
                                        onChange={(e) => setRevisionData('revision_notes', e.target.value)}
                                        rows={4}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Please describe what changes you'd like..."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRevisionForm(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={revisionProcessing}
                                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                    >
                                        {revisionProcessing ? 'Sending...' : 'Request Revision'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmColor={confirmModal.confirmColor}
                isLoading={processing}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ isOpen: false, message: '' })}
                message={successModal.message}
                duration={1000}
            />
        </AuthenticatedLayout>
    );
}
