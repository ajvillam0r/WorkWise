import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ClipboardDocumentListIcon, 
    CalendarIcon,
    DocumentArrowDownIcon,
    StarIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export default function Projects({ projects, period, user_type }) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePeriodChange = (newPeriod) => {
        setSelectedPeriod(newPeriod);
        router.get('/analytics/projects', { period: newPeriod });
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            completed: 'bg-green-100 text-green-800',
            active: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            pending: 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.pending}`}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </span>
        );
    };

    const renderStars = (rating) => {
        if (!rating) return <span className="text-gray-400">No rating</span>;
        
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="ml-1 text-sm text-gray-600">({rating})</span>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/analytics"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Analytics
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Projects Report
                        </h2>
                    </div>
                    <div className="flex space-x-2">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="1month">Last Month</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="12months">Last 12 Months</option>
                        </select>
                        <a
                            href={`/analytics/export?type=projects&period=${selectedPeriod}&format=pdf`}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center"
                            download
                        >
                            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                            Export PDF
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Projects Report" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Projects Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {user_type === 'gig_worker' ? 'Your Projects' : 'Your Hired Projects'}
                            </h3>
                            
                            {projects.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Project
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {user_type === 'gig_worker' ? 'Employer' : 'Gig Worker'}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Started
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Completed
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Rating
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {projects.data.map((project) => (
                                                <tr key={project.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {project.job?.title || 'Untitled Project'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: #{project.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8">
                                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                    <UserIcon className="h-4 w-4 text-gray-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {user_type === 'gig_worker'
                                                                        ? `${project.employer?.first_name} ${project.employer?.last_name}`
                                                                        : `${project.gig_worker?.first_name} ${project.gig_worker?.last_name}`
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(project.agreed_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(project.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {project.started_at ? formatDate(project.started_at) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {project.completed_at ? formatDate(project.completed_at) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {project.reviews && project.reviews.length > 0 
                                                            ? renderStars(project.reviews[0].rating)
                                                            : <span className="text-gray-400 text-sm">No rating</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You don't have any projects in the selected period.
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            {projects.links && projects.links.length > 3 && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {projects.from} to {projects.to} of {projects.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {projects.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-2 text-sm rounded-md ${
                                                    link.active
                                                        ? 'bg-blue-500 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Project Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <ClipboardDocumentListIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Completed Projects</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {projects.data.filter(p => p.status === 'completed').length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <CalendarIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Active Projects</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {projects.data.filter(p => ['active', 'in_progress'].includes(p.status)).length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <StarIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">Average Rating</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {(() => {
                                                const ratings = projects.data
                                                    .filter(p => p.reviews && p.reviews.length > 0)
                                                    .map(p => p.reviews[0].rating);
                                                const avg = ratings.length > 0 
                                                    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                                                    : 0;
                                                return avg > 0 ? avg.toFixed(1) : 'N/A';
                                            })()}
                                        </div>
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
