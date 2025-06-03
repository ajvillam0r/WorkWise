import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function ReportsIndex({ reports = { data: [] } }) {
    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            investigating: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            dismissed: 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            investigating: '🔍',
            resolved: '✅',
            dismissed: '❌'
        };
        return icons[status] || '📋';
    };

    const getReportTypeIcon = (type) => {
        const icons = {
            fraud: '🚨',
            spam: '📧',
            inappropriate: '⚠️',
            scam: '💰',
            fake_profile: '👤',
            other: '📝'
        };
        return icons[type] || '📝';
    };

    const getReportTypeLabel = (type) => {
        const labels = {
            fraud: 'Fraudulent Activity',
            spam: 'Spam/Unwanted Messages',
            inappropriate: 'Inappropriate Behavior',
            scam: 'Scam Attempt',
            fake_profile: 'Fake Profile',
            other: 'Other Violation'
        };
        return labels[type] || type;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        My Reports
                    </h2>
                    <div className="text-sm text-gray-600">
                        {reports?.data?.length || 0} report{(reports?.data?.length || 0) !== 1 ? 's' : ''}
                    </div>
                </div>
            }
        >
            <Head title="My Reports" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Safety Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-blue-400 text-xl">🛡️</span>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Your Safety is Our Priority
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>We take all reports seriously and investigate them thoroughly. Your reports help keep the WorkWise community safe for everyone.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!reports?.data?.length ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">🛡️</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No reports submitted
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    If you encounter any suspicious behavior or violations, don't hesitate to report them.
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">When to report:</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• Fraudulent or scam activities</li>
                                            <li>• Inappropriate messages or behavior</li>
                                            <li>• Fake profiles or misleading information</li>
                                            <li>• Spam or unwanted communications</li>
                                            <li>• Any violation of platform terms</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reports.data.map((report) => (
                                <div key={report.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <span className="text-2xl">{getReportTypeIcon(report.type)}</span>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {getReportTypeLabel(report.type)}
                                                        </h3>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                            <span>
                                                                Reported: 
                                                                <span className="font-medium ml-1">
                                                                    {report.reported_user.first_name} {report.reported_user.last_name}
                                                                </span>
                                                            </span>
                                                            <span>•</span>
                                                            <span>Submitted {formatDistanceToNow(new Date(report.created_at))} ago</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-gray-700 line-clamp-3">
                                                        {report.description}
                                                    </p>
                                                </div>

                                                {report.project && (
                                                    <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                                                        <div className="text-sm text-gray-600">Related Project:</div>
                                                        <div className="font-medium text-gray-900">
                                                            {report.project.job.title}
                                                        </div>
                                                    </div>
                                                )}

                                                {report.evidence && report.evidence.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="text-sm text-gray-600 mb-2">Evidence Provided:</div>
                                                        <div className="space-y-1">
                                                            {report.evidence.map((evidence, index) => (
                                                                <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                                                                    <span className="text-blue-500">📎</span>
                                                                    <span>{evidence}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                                            {getStatusIcon(report.status)} {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                        </span>
                                                        {report.resolved_at && (
                                                            <span className="text-xs text-gray-500">
                                                                Resolved {formatDistanceToNow(new Date(report.resolved_at))} ago
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={`/reports/${report.id}`}
                                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>

                                                {report.admin_notes && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                                                        <div className="text-sm font-medium text-blue-800 mb-1">Admin Response:</div>
                                                        <div className="text-sm text-blue-700">{report.admin_notes}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {reports?.links && reports.links.length > 3 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {reports.prev_page_url && (
                                            <Link
                                                href={reports.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {reports.next_page_url && (
                                            <Link
                                                href={reports.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{reports.from}</span> to{' '}
                                                <span className="font-medium">{reports.to}</span> of{' '}
                                                <span className="font-medium">{reports.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                {reports.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                            index === reports.links.length - 1 ? 'rounded-r-md' : ''
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

                    {/* Report Guidelines */}
                    <div className="mt-8 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">📋 Reporting Guidelines</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">What happens after you report:</h4>
                                    <ol className="text-sm text-gray-600 space-y-2">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">1.</span>
                                            <span>Your report is immediately flagged for review</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">2.</span>
                                            <span>Our team investigates the reported behavior</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">3.</span>
                                            <span>Appropriate action is taken if violations are found</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">4.</span>
                                            <span>You receive an update on the resolution</span>
                                        </li>
                                    </ol>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Tips for effective reporting:</h4>
                                    <ul className="text-sm text-gray-600 space-y-2">
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Provide specific details about the incident</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Include screenshots or evidence when possible</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Report as soon as possible after the incident</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Be honest and accurate in your description</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
