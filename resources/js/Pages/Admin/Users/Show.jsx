import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function UserShow({ user, stats }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
        profile_status: user.profile_status,
        is_admin: user.is_admin
    });

    const handleEditSubmit = (e) => {
        e.preventDefault();
        router.patch(`/admin/users/${user.id}/status`, editForm, {
            onSuccess: () => {
                setIsEditing(false);
            }
        });
    };

    const handleStatusChange = (action) => {
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            router.patch(`/admin/users/${user.id}/${action}`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUserTypeColor = (type) => {
        switch (type) {
            case 'gig_worker': return 'bg-blue-100 text-blue-800';
            case 'employer': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: 'dashboard' },
        { id: 'projects', name: 'Projects', icon: 'cases' },
        { id: 'activity', name: 'Activity', icon: 'timeline' },
        { id: 'reports', name: 'Reports', icon: 'flag' },
    ];

    return (
        <AdminLayout>
            <Head title={`User: ${user.first_name} ${user.last_name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined mr-1">arrow_back</span>
                            Back to Users
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <span className="material-symbols-outlined mr-2">edit</span>
                            Edit User
                        </button>
                        {user.profile_status === 'rejected' ? (
                            <button
                                onClick={() => handleStatusChange('activate')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <span className="material-symbols-outlined mr-2">check_circle</span>
                                Activate
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusChange('suspend')}
                                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <span className="material-symbols-outlined mr-2">block</span>
                                Suspend
                            </button>
                        )}
                        {!user.is_admin && (
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                        router.delete(`/admin/users/${user.id}`);
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <span className="material-symbols-outlined mr-2">delete</span>
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* User Profile Card */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center space-x-6">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-20 w-20 rounded-full"
                                    src={user.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&color=7F9CF5&background=EBF4FF&size=80`}
                                    alt=""
                                />
                            </div>
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {user.first_name} {user.last_name}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                                        {user.professional_title && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                {user.professional_title}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getUserTypeColor(user.user_type)}`}>
                                            {user.user_type}
                                        </span>
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(user.profile_status)}`}>
                                            {user.profile_status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                        {user.is_admin && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mt-1">
                                                <span className="material-symbols-outlined mr-1 text-sm">admin_panel_settings</span>
                                                Admin User
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                {isEditing && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Edit User Details
                            </h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="first_name"
                                            value={editForm.first_name}
                                            onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            value={editForm.last_name}
                                            onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="user_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            User Type
                                        </label>
                                        <select
                                            id="user_type"
                                            value={editForm.user_type}
                                            onChange={(e) => setEditForm({...editForm, user_type: e.target.value})}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="gig_worker">Gig Worker</option>
                                            <option value="employer">Employer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="profile_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Profile Status
                                        </label>
                                        <select
                                            id="profile_status"
                                            value={editForm.profile_status}
                                            onChange={(e) => setEditForm({...editForm, profile_status: e.target.value})}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_admin"
                                            checked={editForm.is_admin}
                                            onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Admin User
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="inline-flex items-center px-4 py-2 bg-gray-300 border border-transparent rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-400 focus:bg-gray-400 active:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-blue-500">cases</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Total Projects
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                            {stats.total_projects}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-green-500">task_alt</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Completed Projects
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                            {stats.completed_projects}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-yellow-500">account_balance_wallet</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            {user.user_type === 'gig_worker' ? 'Total Earnings' : 'Total Spent'}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                            ${user.user_type === 'gig_worker' ? stats.total_earnings : stats.total_spent}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-red-500">flag</span>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            Reports
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                                            {stats.reports_submitted + stats.reports_received}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined mr-2">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            User Information
                                        </h3>
                                        <dl className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{user.first_name} {user.last_name}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{user.email}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{user.user_type}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Status</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{user.profile_status}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined Date</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">{new Date(user.updated_at).toLocaleDateString()}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            Additional Details
                                        </h3>
                                        <dl className="space-y-3">
                                            {user.bio && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white">{user.bio}</dd>
                                                </div>
                                            )}
                                            {user.location && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white">{user.location}</dd>
                                                </div>
                                            )}
                                            {user.phone && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white">{user.phone}</dd>
                                                </div>
                                            )}
                                            {user.professional_title && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Professional Title</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white">{user.professional_title}</dd>
                                                </div>
                                            )}
                                            {user.hourly_rate && (
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hourly Rate</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white">₱{user.hourly_rate}/hr</dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'projects' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Projects ({stats.total_projects})
                                </h3>
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">cases</span>
                                    <p>Project details will be displayed here</p>
                                    <p className="text-sm">This feature is coming soon...</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Recent Activity
                                </h3>
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">timeline</span>
                                    <p>Activity timeline will be displayed here</p>
                                    <p className="text-sm">This feature is coming soon...</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Reports ({stats.reports_submitted + stats.reports_received})
                                </h3>
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">flag</span>
                                    <p>Report details will be displayed here</p>
                                    <p className="text-sm">This feature is coming soon...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}