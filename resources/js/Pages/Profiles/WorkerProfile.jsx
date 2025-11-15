import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import VerificationBadge from '@/Components/VerificationBadge';
import IDVerifiedBadge from '@/Components/IDVerifiedBadge';
import { MapPinIcon, StarIcon, ClockIcon, CurrencyDollarIcon, BriefcaseIcon, AcademicCapIcon, FolderIcon, ChatBubbleLeftRightIcon, DocumentArrowDownIcon, LinkIcon } from '@heroicons/react/24/solid';

export default function WorkerProfile({ user, reviews, rating_summary, portfolio_items }) {
    const { auth } = usePage().props;
    
    // Debug: Log the data received from backend
    console.log('WorkerProfile - Data received:', {
        user: user?.first_name + ' ' + user?.last_name,
        reviewsCount: reviews?.length || 0,
        reviews: reviews,
        rating_summary: rating_summary
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Worker Profile
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            View professional profile and details
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`${user.first_name} ${user.last_name} - Profile`} />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <div className="relative py-12 bg-white overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Profile Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                        
                        <div className="relative px-6 pb-6">
                            {/* Profile Picture */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-4">
                                <div className="relative">
                                    {user.profile_picture ? (
                                        <img
                                            src={user.profile_picture}
                                            alt={`${user.first_name} ${user.last_name}`}
                                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-white">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h1 className="text-3xl font-bold text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </h1>
                                                {user.id_verification_status === 'verified' && (
                                                    <IDVerifiedBadge size="md" showText={true} />
                                                )}
                                            </div>
                                            {user.professional_title && (
                                                <p className="text-lg text-gray-600 mt-1">
                                                    {user.professional_title}
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

                                    {/* Rating and Location */}
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

                                        {/* Verification Badge */}
                                        {user.id_verification_status === 'verified' && (
                                            <VerificationBadge type="id" verified={true} size="md" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About and Rate Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* About Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                                {user.bio ? (
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {user.bio}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 italic">No bio provided</p>
                                )}

                                {/* Category and Services */}
                                {(user.broad_category || user.specific_services) && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                            <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
                                            Services
                                        </h3>
                                        {user.broad_category && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-600">Category: </span>
                                                <span className="text-gray-900">{user.broad_category}</span>
                                            </div>
                                        )}
                                        {user.specific_services && user.specific_services.length > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600 block mb-2">Specific Services:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.specific_services.map((service, index) => (
                                                        <span 
                                                            key={index}
                                                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                                        >
                                                            {service}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rate and Availability Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate & Availability</h2>
                                
                                {/* Hourly Rate */}
                                {user.hourly_rate && (
                                    <div className="mb-6">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
                                            <span className="text-sm font-medium">Hourly Rate</span>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            ${parseFloat(user.hourly_rate).toFixed(2)}
                                            <span className="text-lg text-gray-600 font-normal">/hour</span>
                                        </div>
                                    </div>
                                )}

                                {/* Working Hours */}
                                {user.working_hours && user.working_hours.length > 0 && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                                            <span className="text-sm font-medium">Working Hours</span>
                                        </div>
                                        <div className="space-y-1">
                                            {user.working_hours.map((hours, index) => (
                                                <div key={index} className="text-gray-700">
                                                    {hours}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timezone */}
                                {user.timezone && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-600 mb-1">Timezone</div>
                                        <div className="text-gray-900">{user.timezone}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <AcademicCapIcon className="w-6 h-6 mr-2 text-blue-600" />
                            Skills & Expertise
                        </h2>
                        {user.skills_with_experience && user.skills_with_experience.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {user.skills_with_experience.map((skill, index) => (
                                    <div 
                                        key={index}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg"
                                    >
                                        <div className="font-semibold text-gray-900">{skill.skill || skill.name || skill}</div>
                                        {skill.experience && (
                                            <div className="text-xs text-blue-700 mt-0.5">
                                                {skill.experience}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No skills listed</p>
                        )}
                    </div>

                    {/* Portfolio Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <FolderIcon className="w-6 h-6 mr-2 text-blue-600" />
                            Portfolio & Work Samples
                        </h2>

                        {/* Portfolio Link */}
                        {user.portfolio_link && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center">
                                    <LinkIcon className="w-5 h-5 text-blue-600 mr-2" />
                                    <a 
                                        href={user.portfolio_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                        View Portfolio Website
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Resume Download */}
                        {user.resume_file && (
                            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center">
                                    <DocumentArrowDownIcon className="w-5 h-5 text-green-600 mr-2" />
                                    <a 
                                        href={user.resume_file}
                                        download
                                        className="text-green-600 hover:text-green-800 hover:underline font-medium"
                                    >
                                        Download Resume
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Portfolio Items */}
                        {portfolio_items && portfolio_items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {portfolio_items.map((item, index) => (
                                    <div 
                                        key={index}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        {item.image && (
                                            <img 
                                                src={item.image}
                                                alt={item.title || 'Portfolio item'}
                                                className="w-full h-48 object-cover"
                                            />
                                        )}
                                        <div className="p-4">
                                            {item.title && (
                                                <h3 className="font-semibold text-gray-900 mb-2">
                                                    {item.title}
                                                </h3>
                                            )}
                                            {item.description && (
                                                <p className="text-sm text-gray-600">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State - Requirement 2.8: Handle empty portfolio gracefully */}
                        {!user.portfolio_link && !user.resume_file && (!portfolio_items || portfolio_items.length === 0) && (
                            <p className="text-gray-500 italic">No portfolio items available</p>
                        )}
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

                    {/* Additional sections will be added here */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
