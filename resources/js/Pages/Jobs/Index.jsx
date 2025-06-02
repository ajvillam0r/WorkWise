import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function JobsIndex({ auth, jobs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [minBudget, setMinBudget] = useState(filters.min_budget || '');
    const [maxBudget, setMaxBudget] = useState(filters.max_budget || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/jobs', {
            search,
            min_budget: minBudget,
            max_budget: maxBudget,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setMinBudget('');
        setMaxBudget('');
        router.get('/jobs');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Browse Jobs
                    </h2>
                    {auth.user?.user_type === 'employer' && (
                        <Link
                            href={route('jobs.create')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Post a Job
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Browse Jobs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Search jobs..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Min Budget"
                                            value={minBudget}
                                            onChange={(e) => setMinBudget(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Max Budget"
                                            value={maxBudget}
                                            onChange={(e) => setMaxBudget(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Search
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Jobs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.data.map((job) => (
                            <div key={job.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                            {job.title}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            job.budget_type === 'fixed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {job.budget_type}
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {job.description}
                                    </p>
                                    
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {job.required_skills.slice(0, 3).map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.required_skills.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    +{job.required_skills.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm text-gray-500">
                                            <p>Budget: {job.budget_display}</p>
                                            <p>Posted by: {job.employer.name}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {job.bids_count} bids
                                        </div>
                                    </div>
                                    
                                    <Link
                                        href={route('jobs.show', job.id)}
                                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center block"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {jobs.links && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex space-x-1">
                                {jobs.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 text-sm rounded ${
                                            link.active
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {jobs.data.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
