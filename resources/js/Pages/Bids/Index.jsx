import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function BidsIndex({ bids }) {
    const { auth } = usePage().props;
    const [filter, setFilter] = useState('all');
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
                                                <form method="POST" action={route('bids.update', bid.id)} className="inline">
                                                    <input type="hidden" name="_method" value="PATCH" />
                                                    <input type="hidden" name="status" value="accepted" />
                                                    <button
                                                        type="submit"
                                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                                        onClick={(e) => {
                                                            if (!confirm('Are you sure you want to accept this bid?')) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    >
                                                        Accept Bid
                                                    </button>
                                                </form>
                                                <form method="POST" action={route('bids.update', bid.id)} className="inline">
                                                    <input type="hidden" name="_method" value="PATCH" />
                                                    <input type="hidden" name="status" value="rejected" />
                                                    <button
                                                        type="submit"
                                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                                        onClick={(e) => {
                                                            if (!confirm('Are you sure you want to reject this bid?')) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    >
                                                        Reject Bid
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {isFreelancer && bid.status === 'pending' && (
                                            <form method="POST" action={route('bids.destroy', bid.id)} className="inline">
                                                <input type="hidden" name="_method" value="DELETE" />
                                                <button
                                                    type="submit"
                                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                                    onClick={(e) => {
                                                        if (!confirm('Are you sure you want to withdraw this bid?')) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    Withdraw Bid
                                                </button>
                                            </form>
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
        </AuthenticatedLayout>
    );
}
