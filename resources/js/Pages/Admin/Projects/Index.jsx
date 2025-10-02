import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminProjects({ projects, stats }) {
    return (
        <AdminLayout>
            <Head title="Admin - Projects" />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Projects Management</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage and monitor all platform projects</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        href="/admin/projects/export"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Export
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Total Projects</p>
                        <span className="material-symbols-outlined text-blue-500">cases</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total_projects || '0'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All time</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
                        <span className="material-symbols-outlined text-green-500">play_arrow</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.active_projects || '0'}</p>
                    <p className="mt-1 text-sm text-green-500">Currently running</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Completed</p>
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.completed_projects || '0'}</p>
                    <p className="mt-1 text-sm text-emerald-500">Successfully finished</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-500 dark:text-slate-400">Avg. Value</p>
                        <span className="material-symbols-outlined text-purple-500">attach_money</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">${stats.average_value ? Math.round(stats.average_value) : '0'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Per project</p>
                </div>
            </div>

            {/* Projects Table */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Projects</h2>
                </div>
                <div className="p-6">
                    {projects && projects.length > 0 ? (
                        <div className="space-y-4">
                            {projects.map((project) => (
                                <div key={project.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                                                <span className="material-symbols-outlined text-indigo-500">work</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                                    {project.job?.title || 'Untitled Project'}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Employer: {project.employer?.first_name} {project.employer?.last_name} •
                                                    Gig Worker: {project.gig_worker?.first_name} {project.gig_worker?.last_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                                            project.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                                            project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
                                        }`}>
                                            {project.status}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            ${project.agreed_amount || '0'}
                                        </span>
                                        <Link
                                            href={`/admin/projects/${project.id}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-400">inbox</span>
                                <p className="mt-2 text-slate-500 dark:text-slate-400">No projects found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}