import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SettingsIndex({ settings }) {
    const [activeTab, setActiveTab] = useState('platform');

    const platformForm = useForm({
        site_name: settings?.site_name || 'WorkWise',
        site_description: settings?.site_description || '',
        contact_email: settings?.contact_email || '',
        support_email: settings?.support_email || '',
        maintenance_mode: settings?.maintenance_mode || false,
    });

    const feeForm = useForm({
        platform_fee_percentage: settings?.platform_fee_percentage || 10,
        minimum_project_amount: settings?.minimum_project_amount || 500,
        withdrawal_fee: settings?.withdrawal_fee || 0,
        minimum_withdrawal: settings?.minimum_withdrawal || 1000,
    });

    const securityForm = useForm({
        require_email_verification: settings?.require_email_verification ?? true,
        require_id_verification: settings?.require_id_verification ?? false,
        session_timeout_minutes: settings?.session_timeout_minutes || 120,
        max_login_attempts: settings?.max_login_attempts || 5,
        enable_2fa: settings?.enable_2fa || false,
    });

    const handlePlatformSubmit = (e) => {
        e.preventDefault();
        platformForm.post('/admin/settings/platform', {
            preserveScroll: true,
            onSuccess: () => {
                // Show success message
            }
        });
    };

    const handleFeeSubmit = (e) => {
        e.preventDefault();
        feeForm.post('/admin/settings/fees', {
            preserveScroll: true,
        });
    };

    const handleSecuritySubmit = (e) => {
        e.preventDefault();
        securityForm.post('/admin/settings/security', {
            preserveScroll: true,
        });
    };

    const handleClearCache = () => {
        if (confirm('Are you sure you want to clear all caches?')) {
            router.post('/admin/settings/clear-cache');
        }
    };

    const tabs = [
        { id: 'platform', name: 'Platform Settings', icon: 'settings' },
        { id: 'fees', name: 'Fees & Limits', icon: 'payments' },
        { id: 'security', name: 'Security', icon: 'shield' },
        { id: 'system', name: 'System', icon: 'dns' },
    ];

    return (
        <AdminLayout>
            <Head title="Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage platform settings and configuration
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
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

                {/* Platform Settings Tab */}
                {activeTab === 'platform' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Platform Configuration
                            </h3>
                            <form onSubmit={handlePlatformSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Site Name
                                        </label>
                                        <input
                                            type="text"
                                            id="site_name"
                                            value={platformForm.data.site_name}
                                            onChange={(e) => platformForm.setData('site_name', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        {platformForm.errors.site_name && (
                                            <p className="mt-1 text-sm text-red-600">{platformForm.errors.site_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            id="contact_email"
                                            value={platformForm.data.contact_email}
                                            onChange={(e) => platformForm.setData('contact_email', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Site Description
                                        </label>
                                        <textarea
                                            id="site_description"
                                            rows="3"
                                            value={platformForm.data.site_description}
                                            onChange={(e) => platformForm.setData('site_description', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex items-center">
                                        <input
                                            type="checkbox"
                                            id="maintenance_mode"
                                            checked={platformForm.data.maintenance_mode}
                                            onChange={(e) => platformForm.setData('maintenance_mode', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Enable Maintenance Mode (Users won't be able to access the platform)
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={platformForm.processing}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined mr-2">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Fees & Limits Tab */}
                {activeTab === 'fees' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Platform Fees & Limits
                            </h3>
                            <form onSubmit={handleFeeSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="platform_fee_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Platform Fee Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="platform_fee_percentage"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={feeForm.data.platform_fee_percentage}
                                            onChange={(e) => feeForm.setData('platform_fee_percentage', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        {feeForm.errors.platform_fee_percentage && (
                                            <p className="mt-1 text-sm text-red-600">{feeForm.errors.platform_fee_percentage}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="minimum_project_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Minimum Project Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            id="minimum_project_amount"
                                            min="0"
                                            step="0.01"
                                            value={feeForm.data.minimum_project_amount}
                                            onChange={(e) => feeForm.setData('minimum_project_amount', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="withdrawal_fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Withdrawal Fee (₱)
                                        </label>
                                        <input
                                            type="number"
                                            id="withdrawal_fee"
                                            min="0"
                                            step="0.01"
                                            value={feeForm.data.withdrawal_fee}
                                            onChange={(e) => feeForm.setData('withdrawal_fee', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="minimum_withdrawal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Minimum Withdrawal Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            id="minimum_withdrawal"
                                            min="0"
                                            step="0.01"
                                            value={feeForm.data.minimum_withdrawal}
                                            onChange={(e) => feeForm.setData('minimum_withdrawal', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={feeForm.processing}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined mr-2">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Security Settings
                            </h3>
                            <form onSubmit={handleSecuritySubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="require_email_verification"
                                            checked={securityForm.data.require_email_verification}
                                            onChange={(e) => securityForm.setData('require_email_verification', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="require_email_verification" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Require email verification for new accounts
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="require_id_verification"
                                            checked={securityForm.data.require_id_verification}
                                            onChange={(e) => securityForm.setData('require_id_verification', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="require_id_verification" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Require ID verification for gig workers
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="enable_2fa"
                                            checked={securityForm.data.enable_2fa}
                                            onChange={(e) => securityForm.setData('enable_2fa', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="enable_2fa" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Enable Two-Factor Authentication (2FA)
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        <div>
                                            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Session Timeout (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                id="session_timeout_minutes"
                                                min="5"
                                                max="1440"
                                                value={securityForm.data.session_timeout_minutes}
                                                onChange={(e) => securityForm.setData('session_timeout_minutes', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="max_login_attempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Max Login Attempts
                                            </label>
                                            <input
                                                type="number"
                                                id="max_login_attempts"
                                                min="1"
                                                max="10"
                                                value={securityForm.data.max_login_attempts}
                                                onChange={(e) => securityForm.setData('max_login_attempts', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={securityForm.processing}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined mr-2">save</span>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* System Tab */}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        {/* Cache Management */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Cache Management
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Clear application cache to refresh data and improve performance.
                                </p>
                                <button
                                    onClick={handleClearCache}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700"
                                >
                                    <span className="material-symbols-outlined mr-2">delete_sweep</span>
                                    Clear All Caches
                                </button>
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    System Information
                                </h3>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PHP Version</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{settings?.php_version || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Laravel Version</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{settings?.laravel_version || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Database</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{settings?.database_type || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage</dt>
                                        <dd className="text-sm text-gray-900 dark:text-white">{settings?.storage_driver || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


