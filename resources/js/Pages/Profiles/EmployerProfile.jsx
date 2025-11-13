import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    MapPinIcon, 
    StarIcon, 
    BuildingOfficeIcon, 
    BriefcaseIcon, 
    CurrencyDollarIcon, 
    ClockIcon, 
    UserGroupIcon, 
    GlobeAltIcon, 
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    ChartBarIcon
} from '@heroicons/react/24/solid';

export default function EmployerProfile({ user, reviews, rating_summary, job_statistics }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Employer Profile
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            View company profile and details
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`${user.company_name || user.first_name + ' ' + user.last_name} - Profile`} />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <div className="relative py-12 bg-white overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Company Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                        
                        <div className="relative px-6 pb-6">
                            {/* Company Logo / Profile Picture */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-4">
                                <div className="relative">
                                    {user.profile_picture ? (
                                        <img
                                            src={user.profile_picture}
                                            alt={user.company_name || `${user.first_name} ${user.last_name}`}
                                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            <BuildingOfficeIcon className="w-16 h-16 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">
                                                {user.company_name || `${user.first_name} ${user.last_name}`}
                                            </h1>
                                            {user.industry && (
                                                <p className="text-lg text-gray-600 mt-1">
                                                    {user.industry}
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact Button */}
                                        {auth.user && auth.user.id !== user.id && (
                                            <Link
                                                href={`/messages/${user.id}`}
                                                className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                                                Contact
                                            </Link>
                                        )}
                                    </div>

                                    {/* Rating, Location, and Verification */}
                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        {/* Rating */}
                                        <div className="flex items-center">
                                            <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                                            <span className="text-lg font-semibold text-gray-900">
                                                {rating_summary?.average 
                                                    ? rating_summary.average.toFixed(1) 
                                                    : '0.0'}
                                            </span>
                                            <span className="text-gray-600 ml-1">
                                                ({rating_summary?.count || 0})
                                            </span>
                                        </div>

                                        {/* Location */}
                                        {(user.city || user.country) && (
                                            <div className="flex items-center text-gray-600">
                                                <MapPinIcon className="w-5 h-5 mr-1" />
                                                <span>
                                                    {[user.city, user.country].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Verification Indicator */}
                                        {user.business_registration_document && (
                                            <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                <CheckBadgeIcon className="w-4 h-4 mr-1" />
                                                Verified Business
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Job Statistics Section */}
                    {job_statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Total Jobs Posted */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Total Jobs Posted</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {job_statistics.total_jobs_posted || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Active Jobs */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Active Jobs</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {job_statistics.active_jobs || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <ChartBarIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Completed Projects */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Completed Projects</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {job_statistics.completed_projects || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <CheckBadgeIcon className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Details and Hiring Preferences */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Company Details Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                    <BuildingOfficeIcon className="w-6 h-6 mr-2 text-blue-600" />
                                    Company Details
                                </h2>
                                
                                {/* Company Description */}
                                {user.company_description ? (
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                                        {user.company_description}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 italic mb-6">No company description provided</p>
                                )}

                                {/* Company Size */}
                                {user.company_size && (
                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center">
                                            <UserGroupIcon className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="text-sm font-medium text-gray-600 mr-2">Company Size:</span>
                                            <span className="text-gray-900 font-medium">{user.company_size}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Company Website */}
                                {user.company_website && (
                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center">
                                            <GlobeAltIcon className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="text-sm font-medium text-gray-600 mr-2">Website:</span>
                                            <a 
                                                href={user.company_website.startsWith('http') ? user.company_website : `https://${user.company_website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                            >
                                                {user.company_website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Primary Hiring Needs */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
                                        Primary Hiring Needs
                                    </h3>
                                    {user.primary_hiring_needs && user.primary_hiring_needs.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {user.primary_hiring_needs.map((need, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                                >
                                                    {need}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No hiring needs specified</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Hiring Preferences Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Hiring Preferences</h2>
                                
                                {/* Typical Project Budget */}
                                {user.typical_project_budget && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
                                            <span className="text-sm font-medium">Typical Budget</span>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {user.typical_project_budget}
                                        </div>
                                    </div>
                                )}

                                {/* Typical Project Duration */}
                                {user.typical_project_duration && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                                            <span className="text-sm font-medium">Typical Duration</span>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {user.typical_project_duration}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Experience Level */}
                                {user.preferred_experience_level && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Preferred Experience</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {user.preferred_experience_level}
                                        </div>
                                    </div>
                                )}

                                {/* Hiring Frequency */}
                                {user.hiring_frequency && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-600 mb-2">Hiring Frequency</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {user.hiring_frequency}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-blue-600" />
                            Reviews & Ratings
                        </h2>

                        {/* Rating Summary */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center">
                                    <div className="text-5xl font-bold text-gray-900 mr-4">
                                        {rating_summary?.average 
                                            ? rating_summary.average.toFixed(1) 
                                            : '0.0'}
                                    </div>
                                    <div>
                                        <div className="flex items-center mb-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <StarIcon 
                                                    key={star}
                                                    className={`w-5 h-5 ${
                                                        star <= (rating_summary?.average || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Based on {rating_summary?.count || 0} review{rating_summary?.count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Rating Distribution */}
                                {rating_summary?.distribution && (
                                    <div className="flex-1 min-w-[200px]">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <div key={star} className="flex items-center gap-2 mb-1">
                                                <span className="text-sm text-gray-600 w-8">{star}★</span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-yellow-400"
                                                        style={{
                                                            width: `${rating_summary.count > 0 
                                                                ? ((rating_summary.distribution[star] || 0) / rating_summary.count) * 100 
                                                                : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600 w-8">
                                                    {rating_summary.distribution[star] || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Individual Reviews */}
                        {reviews && reviews.length > 0 ? (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div 
                                        key={review.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Reviewer Profile Picture */}
                                            {review.reviewer?.profile_picture ? (
                                                <img 
                                                    src={review.reviewer.profile_picture}
                                                    alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-white">
                                                        {review.reviewer?.first_name?.[0]}{review.reviewer?.last_name?.[0]}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                {/* Reviewer Name and Rating */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {review.reviewer?.first_name} {review.reviewer?.last_name}
                                                        </div>
                                                        <div className="flex items-center mt-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <StarIcon 
                                                                    key={star}
                                                                    className={`w-4 h-4 ${
                                                                        star <= review.rating
                                                                            ? 'text-yellow-400'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                {/* Review Comment */}
                                                {review.comment && (
                                                    <p className="text-gray-700 leading-relaxed">
                                                        {review.comment}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 italic">No reviews yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
