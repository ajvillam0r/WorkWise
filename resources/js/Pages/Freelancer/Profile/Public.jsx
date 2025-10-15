import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    StarIcon, 
    MapPinIcon, 
    ClockIcon, 
    CurrencyDollarIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    FolderIcon,
    CertificateIcon,
    LanguageIcon,
    CogIcon,
    EyeIcon,
    ChatBubbleLeftIcon,
    HeartIcon,
    ShareIcon,
    CheckBadgeIcon,
    CalendarIcon,
    GlobeAltIcon,
    LinkIcon,
    EyeSlashIcon,
    LockClosedIcon,
    UserGroupIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function Public({ auth, freelancer, stats, isOwnProfile = false }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isFavorited, setIsFavorited] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    const { data: privacyData, setData: setPrivacyData, patch: updatePrivacy, processing: privacyProcessing } = useForm({
        profile_visibility: freelancer.profile_visibility || 'public',
        show_contact_info: freelancer.show_contact_info || false,
        show_earnings: freelancer.show_earnings || false,
        show_portfolio: freelancer.show_portfolio || true,
        show_reviews: freelancer.show_reviews || true
    });

    const { data: contactData, setData: setContactData, post: sendMessage, processing: contactProcessing } = useForm({
        subject: '',
        message: ''
    });

    const tabs = [
        { id: 'overview', name: 'Overview' },
        { id: 'portfolio', name: 'Portfolio' },
        { id: 'experience', name: 'Experience' },
        { id: 'education', name: 'Education' },
        { id: 'reviews', name: 'Reviews' },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    const handlePrivacyUpdate = (e) => {
        e.preventDefault();
        updatePrivacy(`/freelancer/profile/privacy`, {
            onSuccess: () => {
                setShowPrivacyModal(false);
            }
        });
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        sendMessage(`/freelancer/${freelancer.id}/contact`, {
            onSuccess: () => {
                setShowContactModal(false);
                setContactData({ subject: '', message: '' });
            }
        });
    };

    const handleFavorite = () => {
        // Toggle favorite logic here
        setIsFavorited(!isFavorited);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${freelancer.first_name} ${freelancer.last_name} - Freelancer Profile`,
                text: `Check out ${freelancer.first_name}'s freelancer profile on WorkWise`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            // Show toast notification
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <div key={i} className="relative">
                        <StarIcon className="h-5 w-5 text-gray-300" />
                        <div className="absolute inset-0 overflow-hidden w-1/2">
                            <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        </div>
                    </div>
                );
            } else {
                stars.push(
                    <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                );
            }
        }
        return stars;
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'private':
                return <LockClosedIcon className="h-4 w-4" />;
            case 'contacts':
                return <UserGroupIcon className="h-4 w-4" />;
            default:
                return <GlobeAltIcon className="h-4 w-4" />;
        }
    };

    const getVisibilityText = (visibility) => {
        switch (visibility) {
            case 'private':
                return 'Private';
            case 'contacts':
                return 'Contacts Only';
            default:
                return 'Public';
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed">
                    {freelancer.bio || 'No bio provided.'}
                </p>
            </div>

            {/* Skills */}
            {freelancer.skills && freelancer.skills.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {freelancer.skills.map((skill) => (
                            <div key={skill.id} className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {skill.skill?.name || skill.name}
                                </span>
                                {skill.years_of_experience && (
                                    <span className="text-xs text-gray-500">
                                        {skill.years_of_experience}y exp
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Languages */}
            {freelancer.languages && freelancer.languages.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Languages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {freelancer.languages.map((language) => (
                            <div key={language.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{language.language_name}</span>
                                    {language.is_native && (
                                        <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                                    )}
                                </div>
                                <span className="text-sm text-gray-600 capitalize">
                                    {language.proficiency_level}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Certifications */}
            {freelancer.certifications && freelancer.certifications.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications</h3>
                    <div className="space-y-4">
                        {freelancer.certifications.slice(0, 3).map((cert) => (
                            <div key={cert.id} className="flex items-start space-x-3">
                                <CertificateIcon className="h-6 w-6 text-blue-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{cert.certification_name}</h4>
                                    <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                                    <p className="text-xs text-gray-500">
                                        Issued {formatDate(cert.issue_date)}
                                        {cert.expiration_date && ` • Expires ${formatDate(cert.expiration_date)}`}
                                    </p>
                                </div>
                                {cert.is_verified && (
                                    <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderPortfolio = () => (
        <div className="space-y-6">
            {freelancer.portfolios && freelancer.portfolios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {freelancer.portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="bg-white rounded-lg shadow overflow-hidden">
                            {portfolio.images && portfolio.images.length > 0 && (
                                <div className="aspect-w-16 aspect-h-9">
                                    <img
                                        src={portfolio.images[0]}
                                        alt={portfolio.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-4">
                                <h4 className="font-medium text-gray-900 mb-2">{portfolio.title}</h4>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {portfolio.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{portfolio.project_type}</span>
                                    {portfolio.project_value && (
                                        <span>{formatCurrency(portfolio.project_value)}</span>
                                    )}
                                </div>
                                {portfolio.technologies && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {portfolio.technologies.slice(0, 3).map((tech, index) => (
                                            <span
                                                key={index}
                                                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                        {portfolio.technologies.length > 3 && (
                                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                                +{portfolio.technologies.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio items</h3>
                    <p className="text-gray-600">This freelancer hasn't added any portfolio items yet.</p>
                </div>
            )}
        </div>
    );

    const renderExperience = () => (
        <div className="space-y-6">
            {freelancer.experiences && freelancer.experiences.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.experiences.map((experience) => (
                        <div key={experience.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <BriefcaseIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900">{experience.job_title}</h4>
                                    <p className="text-sm text-gray-600 mb-1">{experience.company_name}</p>
                                    <p className="text-sm text-gray-500 mb-3">
                                        {formatDate(experience.start_date)} - 
                                        {experience.is_current ? ' Present' : formatDate(experience.end_date)}
                                        {experience.location && ` • ${experience.location}`}
                                    </p>
                                    {experience.description && (
                                        <p className="text-sm text-gray-700">{experience.description}</p>
                                    )}
                                    {experience.key_achievements && experience.key_achievements.length > 0 && (
                                        <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-900 mb-2">Key Achievements:</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {experience.key_achievements.map((achievement, index) => (
                                                    <li key={index}>{achievement}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience</h3>
                    <p className="text-gray-600">This freelancer hasn't added any work experience yet.</p>
                </div>
            )}
        </div>
    );

    const renderEducation = () => (
        <div className="space-y-6">
            {freelancer.educations && freelancer.educations.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.educations.map((education) => (
                        <div key={education.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <AcademicCapIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900">{education.degree}</h4>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {education.field_of_study} • {education.institution_name}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-3">
                                        {formatDate(education.start_date)} - 
                                        {education.is_current ? ' Present' : formatDate(education.end_date)}
                                    </p>
                                    {education.gpa && (
                                        <p className="text-sm text-gray-700 mb-2">GPA: {education.gpa}</p>
                                    )}
                                    {education.description && (
                                        <p className="text-sm text-gray-700">{education.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No education information</h3>
                    <p className="text-gray-600">This freelancer hasn't added any education information yet.</p>
                </div>
            )}
        </div>
    );

    const renderReviews = () => (
        <div className="space-y-6">
            {freelancer.reviews && freelancer.reviews.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            {review.employer?.first_name?.[0]}{review.employer?.last_name?.[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium text-gray-900">
                                            {review.employer?.first_name} {review.employer?.last_name}
                                        </h4>
                                        <div className="flex items-center">
                                            {renderStars(review.rating)}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {review.project && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            Project: {review.project.job?.title}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-700">{review.comment}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">This freelancer hasn't received any reviews yet.</p>
                </div>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'portfolio':
                return renderPortfolio();
            case 'experience':
                return renderExperience();
            case 'education':
                return renderEducation();
            case 'reviews':
                return renderReviews();
            default:
                return renderOverview();
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Freelancer Profile
                </h2>
            }
        >
            <Head title={`${freelancer.user?.first_name} ${freelancer.user?.last_name} - Freelancer Profile`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Profile Header */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-8">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
                                {/* Profile Photo */}
                                <div className="flex-shrink-0 mb-6 lg:mb-0">
                                    <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                                        {freelancer.profile_photo ? (
                                            <img
                                                src={freelancer.profile_photo}
                                                alt="Profile"
                                                className="w-32 h-32 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-3xl font-medium text-gray-700">
                                                {freelancer.user?.first_name?.[0]}{freelancer.user?.last_name?.[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex-1">
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                {freelancer.user?.first_name} {freelancer.user?.last_name}
                                            </h1>
                                            {freelancer.professional_title && (
                                                <p className="text-xl text-gray-600 mb-4">{freelancer.professional_title}</p>
                                            )}
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                                {freelancer.location && (
                                                    <div className="flex items-center">
                                                        <MapPinIcon className="h-4 w-4 mr-1" />
                                                        {freelancer.location}
                                                    </div>
                                                )}
                                                {freelancer.hourly_rate && (
                                                    <div className="flex items-center">
                                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                                        {formatCurrency(freelancer.hourly_rate)}/hour
                                                    </div>
                                                )}
                                                {stats.response_time && (
                                                    <div className="flex items-center">
                                                        <ClockIcon className="h-4 w-4 mr-1" />
                                                        Responds in {stats.response_time}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rating and Stats */}
                                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                                {stats.average_rating && (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center">
                                                            {renderStars(stats.average_rating)}
                                                        </div>
                                                        <span className="font-medium text-gray-900">
                                                            {stats.average_rating.toFixed(1)}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            ({freelancer.total_reviews} reviews)
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-600">
                                                    {stats.total_projects} projects completed
                                                </div>
                                                {stats.success_rate && (
                                                    <div className="text-sm text-gray-600">
                                                        {stats.success_rate}% success rate
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                         <div className="flex flex-col space-y-3 lg:ml-6">
                                             {isOwnProfile ? (
                                                 <>
                                                     <Link
                                                         href="/freelancer/profile/edit"
                                                         className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                     >
                                                         <CogIcon className="h-5 w-5 mr-2" />
                                                         Edit Profile
                                                     </Link>
                                                     <div className="flex space-x-2">
                                                         <button
                                                             onClick={() => setShowPrivacyModal(true)}
                                                             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                         >
                                                             {getVisibilityIcon(privacyData.profile_visibility)}
                                                             <span className="ml-2">{getVisibilityText(privacyData.profile_visibility)}</span>
                                                         </button>
                                                         <Link
                                                             href="/freelancer/wallet"
                                                             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                         >
                                                             <CurrencyDollarIcon className="h-4 w-4" />
                                                         </Link>
                                                     </div>
                                                 </>
                                             ) : (
                                                 <>
                                                     <button
                                                         onClick={() => setShowContactModal(true)}
                                                         className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                     >
                                                         <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                                                         Contact
                                                     </button>
                                                     <div className="flex space-x-2">
                                                         <button
                                                             onClick={handleFavorite}
                                                             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                         >
                                                             {isFavorited ? (
                                                                 <HeartSolidIcon className="h-4 w-4 text-red-500" />
                                                             ) : (
                                                                 <HeartIcon className="h-4 w-4" />
                                                             )}
                                                         </button>
                                                         <button
                                                             onClick={handleShare}
                                                             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                         >
                                                             <ShareIcon className="h-4 w-4" />
                                                         </button>
                                                         {freelancer.show_contact_info && (
                                                             <>
                                                                 {freelancer.phone && (
                                                                     <a
                                                                         href={`tel:${freelancer.phone}`}
                                                                         className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                                     >
                                                                         <PhoneIcon className="h-4 w-4" />
                                                                     </a>
                                                                 )}
                                                                 {freelancer.user?.email && (
                                                                     <a
                                                                         href={`mailto:${freelancer.user.email}`}
                                                                         className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                                     >
                                                                         <EnvelopeIcon className="h-4 w-4" />
                                                                     </a>
                                                                 )}
                                                             </>
                                                         )}
                                                     </div>
                                                 </>
                                             )}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-t border-gray-200">
                            <nav className="flex space-x-8 px-6">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                     {renderTabContent()}
                 </div>
             </div>

             {/* Privacy Settings Modal */}
             {showPrivacyModal && (
                 <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                     <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                         <div className="mt-3">
                             <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                             <form onSubmit={handlePrivacyUpdate} className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                         Profile Visibility
                                     </label>
                                     <select
                                         value={privacyData.profile_visibility}
                                         onChange={(e) => setPrivacyData('profile_visibility', e.target.value)}
                                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                     >
                                         <option value="public">Public - Anyone can view</option>
                                         <option value="contacts">Contacts Only - Only people you've worked with</option>
                                         <option value="private">Private - Only you can view</option>
                                     </select>
                                 </div>

                                 <div className="space-y-3">
                                     <label className="flex items-center">
                                         <input
                                             type="checkbox"
                                             checked={privacyData.show_contact_info}
                                             onChange={(e) => setPrivacyData('show_contact_info', e.target.checked)}
                                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                         />
                                         <span className="ml-2 text-sm text-gray-700">Show contact information</span>
                                     </label>

                                     <label className="flex items-center">
                                         <input
                                             type="checkbox"
                                             checked={privacyData.show_earnings}
                                             onChange={(e) => setPrivacyData('show_earnings', e.target.checked)}
                                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                         />
                                         <span className="ml-2 text-sm text-gray-700">Show earnings information</span>
                                     </label>

                                     <label className="flex items-center">
                                         <input
                                             type="checkbox"
                                             checked={privacyData.show_portfolio}
                                             onChange={(e) => setPrivacyData('show_portfolio', e.target.checked)}
                                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                         />
                                         <span className="ml-2 text-sm text-gray-700">Show portfolio items</span>
                                     </label>

                                     <label className="flex items-center">
                                         <input
                                             type="checkbox"
                                             checked={privacyData.show_reviews}
                                             onChange={(e) => setPrivacyData('show_reviews', e.target.checked)}
                                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                         />
                                         <span className="ml-2 text-sm text-gray-700">Show reviews and ratings</span>
                                     </label>
                                 </div>

                                 <div className="flex justify-end space-x-3 pt-4">
                                     <button
                                         type="button"
                                         onClick={() => setShowPrivacyModal(false)}
                                         className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                     >
                                         Cancel
                                     </button>
                                     <button
                                         type="submit"
                                         disabled={privacyProcessing}
                                         className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                     >
                                         {privacyProcessing ? 'Saving...' : 'Save Changes'}
                                     </button>
                                 </div>
                             </form>
                         </div>
                     </div>
                 </div>
             )}

             {/* Contact Modal */}
             {showContactModal && (
                 <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                     <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                         <div className="mt-3">
                             <h3 className="text-lg font-medium text-gray-900 mb-4">
                                 Contact {freelancer.user?.first_name}
                             </h3>
                             <form onSubmit={handleContactSubmit} className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                         Subject
                                     </label>
                                     <input
                                         type="text"
                                         value={contactData.subject}
                                         onChange={(e) => setContactData('subject', e.target.value)}
                                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                         placeholder="Project inquiry, collaboration, etc."
                                         required
                                     />
                                 </div>

                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                         Message
                                     </label>
                                     <textarea
                                         value={contactData.message}
                                         onChange={(e) => setContactData('message', e.target.value)}
                                         rows={4}
                                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                         placeholder="Tell them about your project or inquiry..."
                                         required
                                     />
                                 </div>

                                 <div className="flex justify-end space-x-3 pt-4">
                                     <button
                                         type="button"
                                         onClick={() => setShowContactModal(false)}
                                         className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                     >
                                         Cancel
                                     </button>
                                     <button
                                         type="submit"
                                         disabled={contactProcessing}
                                         className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                     >
                                         {contactProcessing ? 'Sending...' : 'Send Message'}
                                     </button>
                                 </div>
                             </form>
                         </div>
                     </div>
                 </div>
             )}
         </AuthenticatedLayout>
     );
 }