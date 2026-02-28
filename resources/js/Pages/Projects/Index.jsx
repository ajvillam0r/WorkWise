import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsIndex({ projects }) {
    const { auth } = usePage().props;
    const isEmployer = auth.user.user_type === 'employer';

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            disputed: 'bg-yellow-100 text-yellow-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusBadgeDark = (status) => {
        const badges = {
            active: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
            disputed: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        };
        return badges[status] || 'bg-white/10 text-white/80 border border-white/20';
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
            pageTheme="dark"
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-white leading-tight tracking-tight">
                        My Projects
                    </h2>
                    <div className="text-sm text-white/60">
                        {projects.data.length} project{projects.data.length !== 1 ? 's' : ''}
                    </div>
                </div>
            }
        >
            <Head title="My Projects" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <div className="relative min-h-screen py-12 bg-[#05070A] overflow-hidden">
                {/* Animated Background */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {projects.data.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-sm overflow-hidden border border-white/10 rounded-xl">
                            <div className="p-6 text-center">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-white mb-2">
                                    No projects yet
                                </h3>
                                <p className="text-white/60 mb-4">
                                    {isEmployer
                                        ? "Start by posting a job to find talented gig workers."
                                        : "Browse available jobs and submit proposals to get started."
                                    }
                                </p>
                                <Link
                                    href={isEmployer ? "/jobs/create" : "/jobs"}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest transition ease-in-out duration-150"
                                >
                                    {isEmployer ? "Post a Job" : "Browse Jobs"}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {projects.data.map((project) => (
                                <div key={project.id} className="bg-white/5 backdrop-blur-sm overflow-hidden border border-white/10 rounded-xl">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <span className="text-2xl">{getStatusIcon(project.status)}</span>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">
                                                            <Link
                                                                href={`/projects/${project.id}`}
                                                                className="hover:text-blue-400 transition-colors"
                                                            >
                                                                {project.job.title}
                                                            </Link>
                                                        </h3>
                                                        <div className="flex items-center space-x-4 text-sm text-white/60">
                                                            <span>
                                                                {isEmployer ? 'Gig Worker:' : 'Employer:'}{' '}
                                                                <Link
                                                                    href={isEmployer
                                                                        ? route('workers.show', project.gig_worker.id)
                                                                        : route('employers.show', project.employer.id)
                                                                    }
                                                                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium ml-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                    }}
                                                                >
                                                                    {isEmployer
                                                                        ? `${project.gig_worker.first_name} ${project.gig_worker.last_name}`
                                                                        : `${project.employer.first_name} ${project.employer.last_name}`
                                                                    }
                                                                </Link>
                                                            </span>
                                                            <span>•</span>
                                                            <span>Started {formatDistanceToNow(new Date(project.started_at))} ago</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                                        <div className="text-sm text-blue-400 font-medium">Project Value</div>
                                                        <div className="text-lg font-semibold text-green-400">
                                                            ₱{project.agreed_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                                        <div className="text-sm text-blue-400 font-medium">Duration</div>
                                                        <div className="text-lg font-semibold text-white/90">
                                                            {project.agreed_duration_days} days
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                                        <div className="text-sm text-blue-400 font-medium">Deadline</div>
                                                        <div className="text-lg font-semibold text-white/90">
                                                            {project.deadline
                                                                ? new Date(project.deadline).toLocaleDateString()
                                                                : 'Not set'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                {project.job.description && (
                                                    <p className="text-white/70 mb-4 line-clamp-2 break-all">
                                                        {project.job.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold ${getStatusBadgeDark(project.status)}`}>
                                                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                                        </span>
                                                        {project.payment_released && (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                                                                Payment Released
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {project.transactions && project.transactions.length > 0 && (
                                                            <Link
                                                                href="/payment/history"
                                                                className="text-sm text-blue-400 hover:text-blue-300"
                                                            >
                                                                💳 View Payments
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={`/projects/${project.id}`}
                                                            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-xl text-white bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-300"
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
                                <div className="bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between sm:px-6 rounded-xl">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {projects.prev_page_url && (
                                            <Link
                                                href={projects.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/5 hover:bg-blue-500/20"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {projects.next_page_url && (
                                            <Link
                                                href={projects.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/5 hover:bg-blue-500/20"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-white/70">
                                                Showing <span className="font-medium text-white">{projects.from}</span> to{' '}
                                                <span className="font-medium text-white">{projects.to}</span> of{' '}
                                                <span className="font-medium text-white">{projects.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md -space-x-px">
                                                {projects.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? 'z-10 bg-blue-600 border-blue-500/50 text-white'
                                                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-blue-500/20 hover:text-white'
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

            <style>{`
                body {
                    background: #05070A;
                    color: #e5e7eb;
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
