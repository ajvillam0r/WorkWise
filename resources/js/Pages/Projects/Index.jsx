import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsIndex({ projects }) {
    const { auth } = usePage().props;
    const isClient = auth.user.user_type === 'client';

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            disputed: 'bg-yellow-100 text-yellow-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            active: '🔄',
            completed: '✅',
            cancelled: '❌',
            disputed: '⚠️'
        };
        return icons[status] || '📋';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        My Projects
                    </h2>
                    <div className="text-sm text-gray-600">
                        {projects.data.length} project{projects.data.length !== 1 ? 's' : ''}
                    </div>
                </div>
            }
        >
            <Head title="My Projects" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {projects.data.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No projects yet
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {isClient 
                                        ? "Start by posting a job to find talented freelancers."
                                        : "Browse available jobs and submit proposals to get started."
                                    }
                                </p>
                                <Link
                                    href={isClient ? "/jobs/create" : "/jobs"}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    {isClient ? "Post a Job" : "Browse Jobs"}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {projects.data.map((project) => (
                                <div key={project.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <span className="text-2xl">{getStatusIcon(project.status)}</span>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            <Link 
                                                                href={`/projects/${project.id}`}
                                                                className="hover:text-blue-600 transition-colors"
                                                            >
                                                                {project.job.title}
                                                            </Link>
                                                        </h3>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                            <span>
                                                                {isClient ? 'Freelancer:' : 'Client:'} 
                                                                <span className="font-medium ml-1">
                                                                    {isClient 
                                                                        ? `${project.freelancer.first_name} ${project.freelancer.last_name}`
                                                                        : `${project.client.first_name} ${project.client.last_name}`
                                                                    }
                                                                </span>
                                                            </span>
                                                            <span>•</span>
                                                            <span>Started {formatDistanceToNow(new Date(project.started_at))} ago</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="text-sm text-gray-600">Project Value</div>
                                                        <div className="text-lg font-semibold text-green-600">
                                                            ${project.agreed_amount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="text-sm text-gray-600">Duration</div>
                                                        <div className="text-lg font-semibold">
                                                            {project.agreed_duration_days} days
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="text-sm text-gray-600">Deadline</div>
                                                        <div className="text-lg font-semibold">
                                                            {project.deadline 
                                                                ? new Date(project.deadline).toLocaleDateString()
                                                                : 'Not set'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                {project.job.description && (
                                                    <p className="text-gray-700 mb-4 line-clamp-2">
                                                        {project.job.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(project.status)}`}>
                                                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                                        </span>
                                                        {project.payment_released && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                💰 Payment Released
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {project.transactions && project.transactions.length > 0 && (
                                                            <Link
                                                                href="/payment/history"
                                                                className="text-sm text-blue-600 hover:text-blue-800"
                                                            >
                                                                💳 View Payments
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={`/projects/${project.id}`}
                                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {projects.links && projects.links.length > 3 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {projects.prev_page_url && (
                                            <Link
                                                href={projects.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {projects.next_page_url && (
                                            <Link
                                                href={projects.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{projects.from}</span> to{' '}
                                                <span className="font-medium">{projects.to}</span> of{' '}
                                                <span className="font-medium">{projects.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                {projects.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                            index === projects.links.length - 1 ? 'rounded-r-md' : ''
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
