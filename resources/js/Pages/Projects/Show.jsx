import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectShow({ project, hasPayment, canReview, isClient }) {
    const { auth } = usePage().props;
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showRevisionForm, setShowRevisionForm] = useState(false);

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
        if (confirm('Are you sure you want to mark this project as completed?')) {
            post(`/projects/${project.id}/complete`);
        }
    };

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this completed project?')) {
            post(`/projects/${project.id}/approve`);
        }
    };

    const handleReleasePayment = () => {
        if (confirm('Are you sure you want to release the payment? This action cannot be undone.')) {
            post(`/projects/${project.id}/payment/release`);
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
                                                    {project.job.required_skills.map((skill, index) => (
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
                                            {isClient && hasPayment && !project.payment_released && (
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
                                                ${project.agreed_amount.toLocaleString()}
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
        </AuthenticatedLayout>
    );
}
