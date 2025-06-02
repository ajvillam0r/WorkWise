import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function JobShow({ auth, job, canBid }) {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Job Details
                    </h2>
                    <Link
                        href={route('jobs.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Jobs
                    </Link>
                </div>
            }
        >
            <Head title={job.title} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Job Details */}
                        <div className="lg:col-span-2">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                                {job.title}
                                            </h1>
                                            <p className="text-gray-600">
                                                Posted by {job.employer.name}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm rounded-full ${
                                            job.status === 'open' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">Description</h3>
                                        <div className="prose max-w-none">
                                            <p className="text-gray-700 whitespace-pre-line">
                                                {job.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.required_skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bid Form */}
                                    {canBid && (
                                        <div className="border-t pt-6">
                                            {!showBidForm ? (
                                                <button
                                                    onClick={() => setShowBidForm(true)}
                                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                                                >
                                                    Submit a Bid
                                                </button>
                                            ) : (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-4">Submit Your Bid</h3>
                                                    <form onSubmit={handleSubmitBid} className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Bid Amount ($)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={data.bid_amount}
                                                                onChange={(e) => setData('bid_amount', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                required
                                                            />
                                                            {errors.bid_amount && (
                                                                <p className="text-red-500 text-sm mt-1">{errors.bid_amount}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Estimated Days
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={data.estimated_days}
                                                                onChange={(e) => setData('estimated_days', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                required
                                                            />
                                                            {errors.estimated_days && (
                                                                <p className="text-red-500 text-sm mt-1">{errors.estimated_days}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Proposal Message (minimum 50 characters)
                                                            </label>
                                                            <textarea
                                                                rows={4}
                                                                value={data.proposal_message}
                                                                onChange={(e) => setData('proposal_message', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Explain why you're the best fit for this job..."
                                                                required
                                                            />
                                                            {errors.proposal_message && (
                                                                <p className="text-red-500 text-sm mt-1">{errors.proposal_message}</p>
                                                            )}
                                                        </div>

                                                        <div className="flex space-x-3">
                                                            <button
                                                                type="submit"
                                                                disabled={processing}
                                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                                            >
                                                                {processing ? 'Submitting...' : 'Submit Bid'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowBidForm(false)}
                                                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Job Info */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Job Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm text-gray-500">Budget:</span>
                                            <p className="font-medium">{job.budget_display}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Experience Level:</span>
                                            <p className="font-medium capitalize">{job.experience_level}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Duration:</span>
                                            <p className="font-medium">
                                                {job.estimated_duration_days} days
                                            </p>
                                        </div>
                                        {job.deadline && (
                                            <div>
                                                <span className="text-sm text-gray-500">Deadline:</span>
                                                <p className="font-medium">{formatDate(job.deadline)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm text-gray-500">Location:</span>
                                            <p className="font-medium">
                                                {job.is_remote ? 'Remote' : job.location || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Bids:</span>
                                            <p className="font-medium">{job.bids.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employer Info */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">About the Employer</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium">{job.employer.name}</p>
                                            {job.employer.company_name && (
                                                <p className="text-sm text-gray-600">{job.employer.company_name}</p>
                                            )}
                                        </div>
                                        {job.employer.location && (
                                            <div>
                                                <span className="text-sm text-gray-500">Location:</span>
                                                <p className="text-sm">{job.employer.location}</p>
                                            </div>
                                        )}
                                        {job.employer.bio && (
                                            <div>
                                                <span className="text-sm text-gray-500">About:</span>
                                                <p className="text-sm">{job.employer.bio}</p>
                                            </div>
                                        )}
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
