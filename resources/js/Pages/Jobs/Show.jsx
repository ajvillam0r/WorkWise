import React, { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SuccessModal from '@/Components/SuccessModal';
import MessagesModal from '@/Components/MessagesModal';
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
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmColor === 'green' ? 'bg-green-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                                {confirmColor === 'green' ? (
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

export default function JobShow({ job, canBid }) {
    const { auth } = usePage().props;
    const [showBidForm, setShowBidForm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showMessagesModal, setShowMessagesModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

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
        bidId: null,
        status: null,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'green'
    });
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        message: ''
    });
    
    const { data, setData, post, errors, reset } = useForm({
        job_id: job.id,
        bid_amount: '',
        proposal_message: '',
        estimated_days: '',
    });

    const handleSubmitBid = (e) => {
        e.preventDefault();
        post(route('bids.store'), {
            onSuccess: () => {
                reset();
                setShowBidForm(false);
            },
        });
    };

    const handleBidAction = (bidId, status) => {
        const isAccepting = status === 'accepted';
        setConfirmModal({
            isOpen: true,
            bidId,
            status,
            title: isAccepting ? 'Accept Proposal' : 'Decline Proposal',
            message: isAccepting
                ? 'Are you sure you want to accept this proposal? This will create a new project and deduct the bid amount from your escrow balance.'
                : 'Are you sure you want to decline this proposal? This action cannot be undone.',
            confirmText: isAccepting ? 'Accept Proposal' : 'Decline Proposal',
            confirmColor: isAccepting ? 'green' : 'red'
        });
    };

    const handleConfirmBidAction = () => {
        setProcessing(true);
        setError(null);

        console.log('Sending bid update request:', {
            bidId: confirmModal.bidId,
            status: confirmModal.status,
            route: route('bids.update', confirmModal.bidId)
        });

        router.patch(
            route('bids.update', confirmModal.bidId),
            { status: confirmModal.status },
            {
                preserveScroll: false,
                onSuccess: (page) => {
                    setProcessing(false);
                    setError(null);
                    setConfirmModal({ ...confirmModal, isOpen: false });

                    // Check if there's an error in the flash messages
                    if (page.props?.flash?.error) {
                        setError(page.props.flash.error);
                        return;
                    }

                    // Show success modal only if we have a success message
                    if (page.props?.flash?.success) {
                        const isAccepting = confirmModal.status === 'accepted';
                        const successMessage = isAccepting
                            ? 'Proposal accepted successfully! Redirecting to contract signing...'
                            : 'Proposal declined successfully.';

                        setSuccessModal({
                            isOpen: true,
                            message: successMessage
                        });

                        // For accepted bids, redirect to contract signing
                        if (isAccepting && page.props?.flash?.redirect) {
                            setTimeout(() => {
                                router.visit(page.props.flash.redirect);
                            }, 1500);
                        }
                    }
                },
                onError: (errors) => {
                    console.error('Bid update failed:', errors);
                    setProcessing(false);
                    setError(errors.error || errors.message || 'Failed to update bid status. Please try again.');
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        );
    };

    const handleCloseModal = () => {
        if (!processing) {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleContactEmployer = (userId) => {
        setSelectedUserId(userId);
        setShowMessagesModal(true);
    };

    const isEmployer = auth.user.user_type === 'employer';
    const isJobOwner = isEmployer && job.employer_id === auth.user.id;

    const formatAmount = (value) => {
        const number = Number(value ?? 0);
        return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getBudgetDisplay = () => {
        if (job.budget_type === 'fixed') {
            return `₱${formatAmount(job.budget_min)} - ₱${formatAmount(job.budget_max)}`;
        }
        return `₱${formatAmount(job.budget_min)} - ₱${formatAmount(job.budget_max)}/hr`;
    };

    const getExperienceBadge = (level) => {
        const badges = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-blue-100 text-blue-800',
            expert: 'bg-purple-100 text-purple-800'
        };
        return badges[level] || 'bg-gray-100 text-gray-800';
    };

    const getStatusBadge = (status) => {
        const badges = {
            open: 'bg-green-100 text-green-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getUserAvatar = (user) => {
        // Check if user exists and has required properties
        if (!user || !user.first_name || !user.last_name) {
            return (
                <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center text-white text-lg font-semibold">
                    ?
                </div>
            );
        }

        if (user.profile_photo) {
            return (
                <img
                    src={`/storage/${user.profile_photo}`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-12 w-12 rounded-full object-cover"
                />
            );
        }
        
        const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
        ];
        const colorIndex = user.id % colors.length;
        
        return (
            <div className={`h-12 w-12 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-lg font-semibold`}>
                {initials}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {job.title}
                        </h2>
                        <div className="flex items-center space-x-4 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                                {job.status === 'open' ? 'Open for Proposals' : job.status.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-600">
                                Posted {formatDistanceToNow(new Date(job.created_at))} ago
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            ← Back to Jobs
                        </Link>
                        {isJobOwner && (
                            <Link
                                href={`/jobs/${job.id}/edit`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                Edit Job
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={job.title} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Job Description */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Job Description</h3>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {job.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {parseSkills(job?.required_skills || []).map((skill, index) => (
                                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Proposals Section */}
                            {job.bids && Array.isArray(job.bids) && job.bids.length > 0 && (isJobOwner || !isEmployer) && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            Proposals ({job.bids.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {job.bids.map((bid) => (
                                                <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            {getUserAvatar(bid.gig_worker)}
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">
                                                                    {bid.gig_worker ? 
                                                                        `${bid.gig_worker.first_name} ${bid.gig_worker.last_name}` : 
                                                                        'Unknown User'
                                                                    }
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {bid.gig_worker?.professional_title || 'Gig Worker'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-semibold text-green-600">
                                                                ₱{formatAmount(bid.bid_amount)}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {bid.estimated_days} days
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 mb-3 break-all">
                                                        {bid.proposal_message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">
                                                            Submitted {formatDistanceToNow(new Date(bid.created_at))} ago
                                                        </span>
                                                        {isJobOwner && bid.status === 'pending' && (
                                                            <div>
                                                                {error && (
                                                                    <div className="mb-2 text-sm text-red-600">
                                                                        {error}
                                                                    </div>
                                                                )}
                                                                <div className="flex space-x-2">
                                                                    <button 
                                                                        onClick={() => handleBidAction(bid.id, 'accepted')}
                                                                        disabled={processing}
                                                                        className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                                                    >
                                                                        {processing ? (
                                                                            <span className="flex items-center">
                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                Processing...
                                                                            </span>
                                                                        ) : 'Accept'}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleBidAction(bid.id, 'rejected')}
                                                                        disabled={processing}
                                                                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                                                    >
                                                                        {processing ? (
                                                                            <span className="flex items-center">
                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                Processing...
                                                                            </span>
                                                                        ) : 'Decline'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Proposal Form */}
                            {canBid && !isEmployer && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        {!showBidForm ? (
                                            <div className="text-center">
                                                <h3 className="text-lg font-semibold mb-2">Interested in this job?</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Submit a proposal to get started
                                                </p>
                                                <button
                                                    onClick={() => setShowBidForm(true)}
                                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Submit a Proposal
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Submit Your Proposal</h3>
                                                <form onSubmit={handleSubmitBid} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Your Bid Amount *
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                                                <input
                                                                    type="number"
                                                                    value={data.bid_amount}
                                                                    onChange={(e) => setData('bid_amount', e.target.value)}
                                                                    className="w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="0.00"
                                                                    min="0"
                                                                    step="0.01"
                                                                    required
                                                                />
                                                            </div>
                                                            {errors.bid_amount && <p className="mt-1 text-sm text-red-600">{errors.bid_amount}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Delivery Time (Days) *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={data.estimated_days}
                                                                onChange={(e) => setData('estimated_days', e.target.value)}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="e.g., 7"
                                                                min="1"
                                                                required
                                                            />
                                                            {errors.estimated_days && <p className="mt-1 text-sm text-red-600">{errors.estimated_days}</p>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Cover Letter *
                                                        </label>
                                                        <textarea
                                                            value={data.proposal_message}
                                                            onChange={(e) => setData('proposal_message', e.target.value)}
                                                            rows={6}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Explain why you're the best fit for this job. Include relevant experience, your approach, and any questions you have..."
                                                            required
                                                        />
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Minimum 50 characters. Be specific about your experience and approach.
                                                        </p>
                                                        {errors.proposal_message && <p className="mt-1 text-sm text-red-600">{errors.proposal_message}</p>}
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowBidForm(false)}
                                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={processing}
                                                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {processing ? (
                                                                <div className="flex items-center">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                    Submitting...
                                                                </div>
                                                            ) : (
                                                                'Submit Proposal'
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Job Details */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Job Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Budget</dt>
                                            <dd className="mt-1 text-lg font-semibold text-green-600">
                                                {getBudgetDisplay()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Project Duration</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {job.estimated_duration_days} days
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                                            <dd className="mt-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceBadge(job.experience_level)}`}>
                                                    {job.experience_level}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Location</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {job.is_remote ? '🌐 Remote Work' : `📍 ${job.location || 'Lapu-Lapu City'}`}
                                            </dd>
                                        </div>
                                        {job.deadline && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {new Date(job.deadline).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Proposals</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {job.bids ? job.bids.length : 0} received
                                            </dd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employer Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">About the Employer</h3>
                                    <div className="flex items-center space-x-3 mb-4">
                                        {getUserAvatar(job.employer)}
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {job.employer.first_name} {job.employer.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {job.employer.professional_title || 'Employer'}
                                            </p>
                                        </div>
                                    </div>
                                    {job.employer.bio && (
                                        <p className="text-sm text-gray-700 mb-4">
                                            {job.employer.bio}
                                        </p>
                                    )}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Member since</span>
                                            <span className="text-gray-900">
                                                {new Date(job.employer.created_at).getFullYear()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Location</span>
                                            <span className="text-gray-900">
                                                {job.employer.barangay ? `${job.employer.barangay}, ` : ''}Lapu-Lapu City
                                            </span>
                                        </div>
                                    </div>
                                    {!isEmployer && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleContactEmployer(job.employer.id)}
                                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                  Contact Employer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Similar Jobs
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Similar Opportunities</h3>
                                <div className="space-y-3">
                                    <Link href="/jobs" className="block text-sm text-blue-800 hover:text-blue-900">
                                        → Browse more {job?.required_skills && Array.isArray(job.required_skills) && job.required_skills.length > 0 ? job.required_skills[0] : 'similar'} jobs
                                    </Link>
                                    <Link href={route('ai.recommendations')} className="block text-sm text-blue-800 hover:text-blue-900">
                                        → Get AI-powered job recommendations
                                    </Link>
                                    <Link href="/projects" className="block text-sm text-blue-800 hover:text-blue-900">
                                        → View your active projects
                                    </Link>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmBidAction}
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

            {/* Messages Modal */}
            <MessagesModal
                isOpen={showMessagesModal}
                onClose={() => setShowMessagesModal(false)}
                initialUserId={selectedUserId}
            />
        </AuthenticatedLayout>
    );
}
