import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
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
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmColor === 'green' ? 'bg-green-100' : confirmColor === 'gray' ? 'bg-gray-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                                {confirmColor === 'green' ? (
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : confirmColor === 'gray' ? (
                                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
                                    : confirmColor === 'gray'
                                    ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
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

export default function BidsIndex({ bids }) {
    const { auth } = usePage().props;
    const [filter, setFilter] = useState('all');
    const [processing, setProcessing] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        bidId: null,
        action: null,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'green'
    });
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        message: ''
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'withdrawn':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isFreelancer = auth.user.user_type === 'freelancer';

    const handleBidAction = (bidId, action) => {
        let title, message, confirmText, confirmColor;

        switch (action) {
            case 'accept':
                title = 'Accept Proposal';
                message = 'Are you sure you want to accept this proposal? This will create a new project and deduct the bid amount from your escrow balance.';
                confirmText = 'Accept Proposal';
                confirmColor = 'green';
                break;
            case 'reject':
                title = 'Decline Proposal';
                message = 'Are you sure you want to decline this proposal? This action cannot be undone.';
                confirmText = 'Decline Proposal';
                confirmColor = 'red';
                break;
            case 'withdraw':
                title = 'Withdraw Bid';
                message = 'Are you sure you want to withdraw this bid? You will not be able to resubmit it later.';
                confirmText = 'Withdraw Bid';
                confirmColor = 'gray';
                break;
            default:
                return;
        }

        setConfirmModal({
            isOpen: true,
            bidId,
            action,
            title,
            message,
            confirmText,
            confirmColor
        });
    };

    const handleConfirmAction = () => {
        setProcessing(true);

        const { bidId, action } = confirmModal;
        let url, method, data;

        switch (action) {
            case 'accept':
                url = route('bids.update', bidId);
                method = 'patch';
                data = { status: 'accepted' };
                break;
            case 'reject':
                url = route('bids.update', bidId);
                method = 'patch';
                data = { status: 'rejected' };
                break;
            case 'withdraw':
                url = route('bids.destroy', bidId);
                method = 'delete';
                data = {};
                break;
            default:
                setProcessing(false);
                return;
        }

        router[method](url, data, {
            preserveScroll: false,
            onSuccess: (page) => {
                setProcessing(false);
                setConfirmModal({ ...confirmModal, isOpen: false });

                // Check if there's an error in the flash messages
                if (page.props?.flash?.error) {
                    console.error('Bid action failed:', page.props.flash.error);
                    return;
                }

                // Show success modal only if we have a success message
                if (page.props?.flash?.success) {
                    let successMessage = '';
                    switch (action) {
                        case 'accept':
                            successMessage = 'Proposal accepted successfully! Redirecting to contract signing...';
                            break;
                        case 'reject':
                            successMessage = 'Proposal declined successfully.';
                            break;
                        case 'withdraw':
                            successMessage = 'Bid withdrawn successfully.';
                            break;
                    }

                    setSuccessModal({
                        isOpen: true,
                        message: successMessage
                    });

                    // Handle redirect for accepted bids
                    if (action === 'accept' && page.props?.flash?.redirect) {
                        setTimeout(() => {
                            router.visit(page.props.flash.redirect);
                        }, 1500);
                    } else if (action === 'accept') {
                        setTimeout(() => {
                            // Refresh to show updated status
                            window.location.reload();
                        }, 1500);
                    } else {
                        setTimeout(() => {
                            router.reload({ only: ['bids'] });
                        }, 1500);
                    }
                } else {
                    console.error('No success message received');
                }
            },
            onError: (errors) => {
                console.error('Bid action failed:', errors);
                setProcessing(false);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };

    const handleCloseModal = () => {
        if (!processing) {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    {isFreelancer ? 'My Bids' : 'Bids on My Jobs'}
                </h2>
            }
        >
            <Head title={isFreelancer ? 'My Bids' : 'Bids on My Jobs'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {bids.data.length > 0 ? (
                        <div className="space-y-6">
                            {bids.data.map((bid) => (
                                <div key={bid.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    <Link 
                                                        href={route('jobs.show', bid.job.id)}
                                                        className="hover:text-blue-600"
                                                    >
                                                        {bid.job.title}
                                                    </Link>
                                                </h3>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    {isFreelancer ? (
                                                        <p>Posted by: {bid.job.employer.name}</p>
                                                    ) : (
                                                        <p>Bid by: {bid.freelancer.name}</p>
                                                    )}
                                                    <p>Submitted: {formatDate(bid.submitted_at)}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(bid.status)}`}>
                                                {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <span className="text-sm text-gray-500">Bid Amount:</span>
                                                <p className="font-medium">₱{bid.bid_amount}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Estimated Days:</span>
                                                <p className="font-medium">{bid.estimated_days} days</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Job Budget:</span>
                                                <p className="font-medium">{bid.job.budget_display}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-sm text-gray-500">Proposal:</span>
                                            <p className="text-gray-700 mt-1">{bid.proposal_message}</p>
                                        </div>

                                        {!isFreelancer && bid.status === 'pending' && (
                                            <div className="flex space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBidAction(bid.id, 'accept')}
                                                    disabled={processing}
                                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processing ? 'Processing...' : 'Accept Bid'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleBidAction(bid.id, 'reject')}
                                                    disabled={processing}
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processing ? 'Processing...' : 'Reject Bid'}
                                                </button>
                                            </div>
                                        )}

                                        {isFreelancer && bid.status === 'pending' && (
                                            <button
                                                type="button"
                                                onClick={() => handleBidAction(bid.id, 'withdraw')}
                                                disabled={processing}
                                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Processing...' : 'Withdraw Bid'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500 text-lg mb-4">
                                    {isFreelancer 
                                        ? "You haven't submitted any bids yet." 
                                        : "No bids have been submitted on your jobs yet."
                                    }
                                </p>
                                {isFreelancer && (
                                    <Link
                                        href={route('jobs.index')}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Browse Jobs
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {bids.links && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex space-x-1">
                                {bids.links.map((link, index) => (
                                    link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 text-sm rounded ${
                                            link.active
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={index}
                                            className="px-3 py-2 text-sm rounded bg-gray-100 text-gray-400 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
