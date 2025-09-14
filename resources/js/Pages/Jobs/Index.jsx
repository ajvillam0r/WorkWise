import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function JobsIndex({ jobs, filters = {} }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [budgetRange, setBudgetRange] = useState(filters.budget_range || 'all');
    const [experienceLevel, setExperienceLevel] = useState(filters.experience_level || 'all');

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
        jobId: null,
        action: null,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'red'
    });

    const isClient = auth.user.user_type === 'client';
    const [processing, setProcessing] = useState(false);

    const handleSearch = () => {
        router.get('/jobs', {
            search,
            category: selectedCategory !== 'all' ? selectedCategory : '',
            budget_range: budgetRange !== 'all' ? budgetRange : '',
            experience_level: experienceLevel !== 'all' ? experienceLevel : '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setBudgetRange('all');
        setExperienceLevel('all');
        router.get('/jobs');
    };

    const getBudgetDisplay = (job) => {
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
            cancelled: 'bg-red-100 text-red-800',
            closed: 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const handleDeleteJob = (jobId) => {
        setConfirmModal({
            isOpen: true,
            jobId: jobId,
            action: 'delete',
            title: 'Delete Job',
            message: 'Are you sure you want to delete this job? This action cannot be undone and all proposals will be lost.',
            confirmText: 'Delete Job',
            confirmColor: 'red'
        });
    };

    const handleCloseJob = (jobId) => {
        setConfirmModal({
            isOpen: true,
            jobId: jobId,
            action: 'close',
            title: 'Close Job',
            message: 'Are you sure you want to close this job? This will prevent new proposals from being submitted.',
            confirmText: 'Close Job',
            confirmColor: 'yellow'
        });
    };

    const confirmAction = () => {
        setProcessing(true);
        if (confirmModal.action === 'delete') {
            router.delete(route('jobs.destroy', confirmModal.jobId), {
                onSuccess: () => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    setProcessing(false);
                    router.reload();
                },
                onError: () => {
                    setProcessing(false);
                }
            });
        } else if (confirmModal.action === 'close') {
            router.patch(route('jobs.update', confirmModal.jobId),
                { status: 'closed' },
                {
                    onSuccess: () => {
                        setConfirmModal({ ...confirmModal, isOpen: false });
                        setProcessing(false);
                        router.reload();
                    },
                    onError: () => {
                        setProcessing(false);
                    }
                }
            );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {isClient ? 'My Posted Jobs' : 'Browse Jobs'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {isClient 
                                ? 'Manage your job postings and review proposals'
                                : 'Find your next freelance opportunity'
                            }
                        </p>
                    </div>
                    {isClient && (
                        <Link
                            href={route('jobs.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            + Post New Job
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={isClient ? 'My Jobs' : 'Browse Jobs'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    {!isClient && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search jobs by title, skills, or description..."
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={budgetRange}
                                            onChange={(e) => setBudgetRange(e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Budgets</option>
                                            <option value="0-25000">₱0 - ₱25,000</option>
                                            <option value="25000-50000">₱25,000 - ₱50,000</option>
                                            <option value="50000-250000">₱50,000 - ₱250,000</option>
                                            <option value="250000+">₱250,000+</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={experienceLevel}
                                            onChange={(e) => setExperienceLevel(e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Levels</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleSearch}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        🔍 Search Jobs
                                    </button>
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Clear Filters
                                    </button>
                                    <Link
                                        href={route('ai.recommendations')}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        🤖 AI Recommendations
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jobs List */}
                    {jobs.data && jobs.data.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">💼</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {isClient ? 'No jobs posted yet' : 'No jobs found'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {isClient 
                                        ? "Start by posting your first job to find talented freelancers."
                                        : "Try adjusting your search criteria or check back later for new opportunities."
                                    }
                                </p>
                                {isClient && (
                                    <Link
                                        href={route('jobs.create')}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Post Your First Job
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {jobs.data && jobs.data.map((job) => (
                                <div key={job.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        <Link 
                                                            href={`/jobs/${job.id}`}
                                                            className="hover:text-blue-600 transition-colors"
                                                        >
                                                            {job.title}
                                                        </Link>
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                                                        {job.status === 'open' ? 'Open' : job.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                <p className="text-gray-700 mb-4 line-clamp-3">
                                                    {job.description}
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Budget</div>
                                                        <div className="font-semibold text-green-600">
                                                            {getBudgetDisplay(job)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Duration</div>
                                                        <div className="font-semibold">
                                                            {job.estimated_duration_days} days
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Experience</div>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceBadge(job.experience_level)}`}>
                                                            {job.experience_level}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Location</div>
                                                        <div className="font-semibold">
                                                            {job.is_remote ? '🌐 Remote' : `📍 ${job.location || 'Lapu-Lapu City'}`}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="text-sm text-gray-500 mb-2">Required Skills</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {parseSkills(job.required_skills).map((skill, index) => (
                                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>
                                                            Posted by: 
                                                            <span className="font-medium ml-1">
                                                                {job.employer ? `${job.employer.first_name} ${job.employer.last_name}` : 'Client'}
                                                            </span>
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
                                                        {job.bids_count !== undefined && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{job.bids_count} proposal{job.bids_count !== 1 ? 's' : ''}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {isClient ? (
                                                            <>
                                                                <Link
                                                                    href={`/jobs/${job.id}/edit`}
                                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                                >
                                                                    Edit
                                                                </Link>
                                                                {job.status === 'open' && (
                                                                    <button
                                                                        onClick={() => handleCloseJob(job.id)}
                                                                        className="text-sm text-yellow-600 hover:text-yellow-800"
                                                                    >
                                                                        Close
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteJob(job.id)}
                                                                    className="text-sm text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                                <Link
                                                                    href={`/jobs/${job.id}`}
                                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    View Proposals ({job.bids_count || 0})
                                                                </Link>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link
                                                                    href={`/jobs/${job.id}`}
                                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                                >
                                                                    View Details
                                                                </Link>
                                                                {job.status === 'open' && (
                                                                    <Link
                                                                        href={`/jobs/${job.id}`}
                                                                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                    >
                                                                        Submit Proposal
                                                                    </Link>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {jobs.links && jobs.links.length > 3 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {jobs.prev_page_url && (
                                            <Link
                                                href={jobs.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {jobs.next_page_url && (
                                            <Link
                                                href={jobs.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{jobs.from}</span> to{' '}
                                                <span className="font-medium">{jobs.to}</span> of{' '}
                                                <span className="font-medium">{jobs.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                {jobs.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                            index === jobs.links.length - 1 ? 'rounded-r-md' : ''
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Stats for Freelancers */}
                    {!isClient && jobs.data && jobs.data.length > 0 && (
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">Market Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                                <div>
                                    <div className="font-medium">Total Jobs Available</div>
                                    <div className="text-2xl font-bold text-blue-600">{jobs.total || jobs.data.length}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Average Budget</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        ${Math.round(jobs.data.reduce((sum, job) => sum + ((job.budget_min + job.budget_max) / 2), 0) / jobs.data.length) || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium">Remote Opportunities</div>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {Math.round((jobs.data.filter(job => job.is_remote).length / jobs.data.length) * 100) || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                                confirmModal.confirmColor === 'red' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                                <svg className={`h-6 w-6 ${
                                    confirmModal.confirmColor === 'red' ? 'text-red-600' : 'text-yellow-600'
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                                {confirmModal.title}
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    {confirmModal.message}
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={confirmAction}
                                    disabled={processing}
                                    className={`px-4 py-2 ${
                                        confirmModal.confirmColor === 'red'
                                            ? 'bg-red-500 hover:bg-red-700'
                                            : 'bg-yellow-500 hover:bg-yellow-700'
                                    } text-white text-base font-medium rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        confirmModal.confirmColor === 'red'
                                            ? 'focus:ring-red-500'
                                            : 'focus:ring-yellow-500'
                                    } disabled:opacity-50`}
                                >
                                    {processing ? 'Processing...' : confirmModal.confirmText}
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                    className="mt-3 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-base font-medium rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
