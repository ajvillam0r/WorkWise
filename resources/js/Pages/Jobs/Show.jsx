import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function JobShow({ job, canBid }) {
    const { auth } = usePage().props;
    const [showBidForm, setShowBidForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
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

    const isClient = auth.user.user_type === 'client';
    const isJobOwner = isClient && job.employer_id === auth.user.id;

    const getBudgetDisplay = () => {
        if (job.budget_type === 'fixed') {
            return `₱${job.budget_min} - ₱${job.budget_max}`;
        }
        return `₱${job.budget_min} - ₱${job.budget_max}/hr`;
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
                                        {job.required_skills && job.required_skills.map((skill, index) => (
                                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Proposals Section */}
                            {job.bids && job.bids.length > 0 && (isJobOwner || !isClient) && (
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
                                                            {getUserAvatar(bid.freelancer)}
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">
                                                                    {bid.freelancer.first_name} {bid.freelancer.last_name}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {bid.freelancer.professional_title || 'Freelancer'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-semibold text-green-600">
                                                                ₱{bid.bid_amount}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {bid.estimated_days} days
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 mb-3">
                                                        {bid.proposal_message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500">
                                                            Submitted {formatDistanceToNow(new Date(bid.created_at))} ago
                                                        </span>
                                                        {isJobOwner && bid.status === 'pending' && (
                                                            <div className="flex space-x-2">
                                                                <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                                                                    Accept
                                                                </button>
                                                                <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                                                    Decline
                                                                </button>
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
                            {canBid && !isClient && (
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
                                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
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

                            {/* Client Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">About the Client</h3>
                                    <div className="flex items-center space-x-3 mb-4">
                                        {getUserAvatar(job.employer)}
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {job.employer.first_name} {job.employer.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {job.employer.professional_title || 'Client'}
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
                                    {!isClient && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Link
                                                href={`/messages/${job.employer.id}`}
                                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                💬 Contact Client
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Similar Jobs */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Similar Opportunities</h3>
                                <div className="space-y-3">
                                    <Link href="/jobs" className="block text-sm text-blue-800 hover:text-blue-900">
                                        → Browse more {job.required_skills && job.required_skills[0]} jobs
                                    </Link>
                                    <Link href="/recommendations" className="block text-sm text-blue-800 hover:text-blue-900">
                                        → Get AI-powered job recommendations
                                    </Link>
                                    <Link href="/projects" className="block text-sm text-blue-800 hover:text-blue-900">
                                        → View your active projects
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
