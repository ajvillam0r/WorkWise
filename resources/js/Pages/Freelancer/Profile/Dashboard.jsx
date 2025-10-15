import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    UserIcon, 
    BriefcaseIcon, 
    AcademicCapIcon, 
    FolderIcon,
    CertificateIcon,
    LanguageIcon,
    CogIcon,
    EyeIcon,
    PencilIcon,
    PlusIcon,
    StarIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard({ auth, freelancer, profileCompletion, stats }) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', name: 'Overview', icon: ChartBarIcon },
        { id: 'basic', name: 'Basic Info', icon: UserIcon },
        { id: 'experience', name: 'Experience', icon: BriefcaseIcon },
        { id: 'education', name: 'Education', icon: AcademicCapIcon },
        { id: 'portfolio', name: 'Portfolio', icon: FolderIcon },
        { id: 'certifications', name: 'Certifications', icon: CertificateIcon },
        { id: 'languages', name: 'Languages', icon: LanguageIcon },
        { id: 'skills', name: 'Skills', icon: CogIcon },
    ];

    const getCompletionColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600 bg-green-100';
        if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Profile Completion */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCompletionColor(profileCompletion)}`}>
                        {profileCompletion}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${profileCompletion}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Complete your profile to attract more clients and increase your visibility.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(stats.total_earnings)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Projects Completed</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total_projects}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <StarIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Average Rating</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <EyeIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Profile Views</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.profile_views}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href={route('freelancer.profile.show', freelancer.id)}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <EyeIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">View Public Profile</span>
                    </Link>
                    
                    <button
                        onClick={() => setActiveTab('basic')}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <PencilIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <PlusIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Add Portfolio Item</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBasicInfo = () => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Professional Title</label>
                    <p className="mt-1 text-sm text-gray-900">{freelancer.professional_title || 'Not specified'}</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                    <p className="mt-1 text-sm text-gray-900">
                        {freelancer.hourly_rate ? formatCurrency(freelancer.hourly_rate) : 'Not specified'}
                    </p>
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{freelancer.bio || 'No bio provided'}</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{freelancer.location || 'Not specified'}</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                    <p className="mt-1 text-sm text-gray-900">
                        {freelancer.years_of_experience ? `${freelancer.years_of_experience} years` : 'Not specified'}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderExperience = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Experience
                </button>
            </div>
            
            {freelancer.experiences && freelancer.experiences.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.experiences.map((experience) => (
                        <div key={experience.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900">{experience.job_title}</h4>
                                    <p className="text-sm text-gray-600">{experience.company_name}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(experience.start_date).toLocaleDateString()} - 
                                        {experience.is_current ? ' Present' : new Date(experience.end_date).toLocaleDateString()}
                                    </p>
                                    {experience.description && (
                                        <p className="text-sm text-gray-700 mt-2">{experience.description}</p>
                                    )}
                                </div>
                                <button className="ml-4 text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience added</h3>
                    <p className="text-gray-600 mb-4">Add your work experience to showcase your professional background.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Experience
                    </button>
                </div>
            )}
        </div>
    );

    const renderEducation = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Education</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Education
                </button>
            </div>
            
            {freelancer.educations && freelancer.educations.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.educations.map((education) => (
                        <div key={education.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900">{education.degree_type}</h4>
                                    <p className="text-sm text-gray-600">{education.institution_name}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {education.field_of_study && `${education.field_of_study} • `}
                                        {new Date(education.start_date).toLocaleDateString()} - 
                                        {education.is_current ? ' Present' : new Date(education.end_date).toLocaleDateString()}
                                    </p>
                                    {education.gpa && (
                                        <p className="text-sm text-gray-500 mt-1">GPA: {education.gpa}</p>
                                    )}
                                    {education.description && (
                                        <p className="text-sm text-gray-700 mt-2">{education.description}</p>
                                    )}
                                </div>
                                <button className="ml-4 text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No education added</h3>
                    <p className="text-gray-600 mb-4">Add your educational background to showcase your qualifications.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Education
                    </button>
                </div>
            )}
        </div>
    );

    const renderPortfolio = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Portfolio</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Portfolio Item
                </button>
            </div>
            
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
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{portfolio.title}</h4>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {portfolio.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{portfolio.project_type}</span>
                                    {portfolio.project_value && (
                                        <span>{formatCurrency(portfolio.project_value)}</span>
                                    )}
                                </div>
                                {portfolio.technologies_used && portfolio.technologies_used.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {portfolio.technologies_used.slice(0, 3).map((tech, index) => (
                                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {tech}
                                            </span>
                                        ))}
                                        {portfolio.technologies_used.length > 3 && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                +{portfolio.technologies_used.length - 3}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio items added</h3>
                    <p className="text-gray-600 mb-4">Showcase your best work to attract potential clients.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Portfolio Item
                    </button>
                </div>
            )}
        </div>
    );

    const renderCertifications = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Certification
                </button>
            </div>
            
            {freelancer.certifications && freelancer.certifications.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.certifications.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <h4 className="text-lg font-medium text-gray-900">{cert.name}</h4>
                                        {cert.is_verified && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Issued {new Date(cert.issue_date).toLocaleDateString()}
                                        {cert.expiration_date && !cert.does_not_expire && (
                                            ` • Expires ${new Date(cert.expiration_date).toLocaleDateString()}`
                                        )}
                                        {cert.does_not_expire && ' • No expiration'}
                                    </p>
                                    {cert.credential_id && (
                                        <p className="text-sm text-gray-500 mt-1">Credential ID: {cert.credential_id}</p>
                                    )}
                                    {cert.description && (
                                        <p className="text-sm text-gray-700 mt-2">{cert.description}</p>
                                    )}
                                    {cert.skills_validated && cert.skills_validated.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {cert.skills_validated.map((skill, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button className="ml-4 text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <CertificateIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added</h3>
                    <p className="text-gray-600 mb-4">Add your professional certifications to build credibility.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Certification
                    </button>
                </div>
            )}
        </div>
    );

    const renderLanguages = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Languages</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Language
                </button>
            </div>
            
            {freelancer.languages && freelancer.languages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {freelancer.languages.map((language) => (
                        <div key={language.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <h4 className="text-lg font-medium text-gray-900">{language.language}</h4>
                                        {language.is_native && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Native
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 capitalize">{language.proficiency_level}</p>
                                    {language.certifications && (
                                        <p className="text-sm text-gray-500 mt-1">{language.certifications}</p>
                                    )}
                                </div>
                                <button className="ml-4 text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <LanguageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No languages added</h3>
                    <p className="text-gray-600 mb-4">Add languages you speak to attract international clients.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Language
                    </button>
                </div>
            )}
        </div>
    );

    const renderSkills = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Skills & Expertise</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Skill
                </button>
            </div>
            
            {freelancer.skills && freelancer.skills.length > 0 ? (
                <div className="space-y-4">
                    {freelancer.skills.map((freelancerSkill) => (
                        <div key={freelancerSkill.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {freelancerSkill.skill ? freelancerSkill.skill.name : 'Unknown Skill'}
                                        </h4>
                                        {freelancerSkill.is_featured && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                        <span className="capitalize">{freelancerSkill.proficiency_level}</span>
                                        {freelancerSkill.years_of_experience && (
                                            <span>{freelancerSkill.years_of_experience} years experience</span>
                                        )}
                                        {freelancerSkill.hourly_rate && (
                                            <span>{formatCurrency(freelancerSkill.hourly_rate)}/hr</span>
                                        )}
                                    </div>
                                    {freelancerSkill.projects_completed && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {freelancerSkill.projects_completed} projects completed
                                        </p>
                                    )}
                                    {freelancerSkill.average_rating && (
                                        <div className="flex items-center mt-1">
                                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600 ml-1">
                                                {freelancerSkill.average_rating.toFixed(1)} rating
                                            </span>
                                        </div>
                                    )}
                                    {freelancerSkill.description && (
                                        <p className="text-sm text-gray-700 mt-2">{freelancerSkill.description}</p>
                                    )}
                                </div>
                                <button className="ml-4 text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <CogIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No skills added</h3>
                    <p className="text-gray-600 mb-4">Add your skills to help clients find you for relevant projects.</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Your First Skill
                    </button>
                </div>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'basic':
                return renderBasicInfo();
            case 'experience':
                return renderExperience();
            case 'education':
                return renderEducation();
            case 'portfolio':
                return renderPortfolio();
            case 'certifications':
                return renderCertifications();
            case 'languages':
                return renderLanguages();
            case 'skills':
                return renderSkills();
            default:
                return renderOverview();
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Freelancer Profile Dashboard
                    </h2>
                    <Link
                        href={route('freelancer.profile.show', freelancer.id)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Public Profile
                    </Link>
                </div>
            }
        >
            <Head title="Freelancer Profile Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow">
                                <nav className="space-y-1 p-4">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                    activeTab === tab.id
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon className="h-5 w-5 mr-3" />
                                                {tab.name}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}