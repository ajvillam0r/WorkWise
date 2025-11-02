import React, { useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Transition } from '@headlessui/react';
import SuccessModal from '@/Components/SuccessModal';
import VerificationBadge, { VerificationBadges } from '@/Components/VerificationBadge';

export default function Edit({ mustVerifyEmail, status, profileCompletion }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [activeTab, setActiveTab] = useState('basic');
    const [skillInput, setSkillInput] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isGigWorker = user.user_type === 'gig_worker';
    const isEmployer = user.user_type === 'employer';

    // Helper function to get color based on completion percentage
    const getCompletionColor = (percentage) => {
        if (percentage === 100) return 'from-green-500 to-green-600';
        if (percentage >= 75) return 'from-blue-500 to-blue-600';
        if (percentage >= 50) return 'from-yellow-500 to-yellow-600';
        return 'from-orange-500 to-orange-600';
    };

    const { data, setData, patch, post, processing, errors, recentlySuccessful, reset } = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        country: user.country || '',
        province: user.province || '',
        municipality: user.municipality || '',
        street_address: user.street_address || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
        // Freelancer fields
        professional_title: user.professional_title || '',
        hourly_rate: user.hourly_rate || '',

        // Gig worker onboarding fields
        broad_category: user.broad_category || '',
        specific_services: user.specific_services || [],
        skills_with_experience: user.skills_with_experience || [],
        working_hours: user.working_hours || {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
        timezone: user.timezone || 'Asia/Manila',
        preferred_communication: user.preferred_communication || [],
        availability_notes: user.availability_notes || '',

        // Client/Employer fields
        company_name: user.company_name || '',
        work_type_needed: user.work_type_needed || '',
        budget_range: user.budget_range || '',
        project_intent: user.project_intent || '',
        
        // Employer onboarding fields
        company_size: user.company_size || '',
        industry: user.industry || '',
        company_website: user.company_website || '',
        company_description: user.company_description || '',
        primary_hiring_needs: user.primary_hiring_needs || [],
        typical_project_budget: user.typical_project_budget || '',
        typical_project_duration: user.typical_project_duration || '',
        preferred_experience_level: user.preferred_experience_level || '',
        hiring_frequency: user.hiring_frequency || '',
        tax_id: user.tax_id || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Submit form (without profile picture - upload removed)
        patch(route('profile.update'), data, {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => {
                console.error('Profile update errors:', errors);
            },
            onSuccess: () => {
                console.log('Profile updated successfully');
                setShowSuccessModal(true);
            },
        });
    };

    const getUserAvatar = () => {
        // Check for Cloudinary profile picture first
        if (user.profile_picture) {
            return (
                <img
                    src={user.profile_picture}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-24 w-24 rounded-full object-cover"
                />
            );
        }
        
        // Fallback to profile photo (Cloudinary URL)
        if (user.profile_photo) {
            return (
                <img
                    src={user.profile_photo}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-24 w-24 rounded-full object-cover"
                />
            );
        }

        const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
        ];
        const colorIndex = user.id % colors.length;

        return (
            <div className={`h-24 w-24 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-2xl font-semibold`}>
                {initials}
            </div>
        );
    };

    const tabs = [
        { id: 'basic', name: 'Basic Info', icon: '👤' },
        { id: 'professional', name: isGigWorker ? 'Professional' : 'Business', icon: isGigWorker ? '💼' : '🏢' },
        ...(isGigWorker ? [
            { id: 'availability', name: 'Availability', icon: '📅' },
            { id: 'portfolio', name: 'Portfolio', icon: '🎨' },
        ] : []),
        { id: 'security', name: 'Security', icon: '🔒' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Edit Profile
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your account settings and profile information
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form to original user values
                                        reset();
                                    }}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Edit Profile" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <div className="relative py-12 bg-white overflow-hidden">
                {/* Animated Background Shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Profile Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                <div className="p-8">
                                    {/* Profile Photo - Display Only */}
                                    <div className="text-center mb-6">
                                        <div className="flex justify-center mb-4">
                                            {user.profile_picture || user.profile_photo ? (
                                                <img 
                                                    src={user.profile_picture || user.profile_photo}
                                                    alt={`${user.first_name} ${user.last_name}`}
                                                    className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
                                                />
                                            ) : (
                                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200">
                                                    <span className="text-lg">
                                                        {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {user.first_name} {user.last_name}
                                        </h3>
                                        <VerificationBadges user={user} size="sm" className="justify-center mt-2 mb-3" />
                                        <p className="text-sm text-gray-600 mb-3">
                                            {isGigWorker ? user.professional_title || 'Gig Worker' : user.company_name || 'Employer'}
                                        </p>
                                        <div className="mt-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md ${
                                                user.user_type === 'employer'
                                                    ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                                                    : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                            }`}>
                                                {user.user_type === 'employer' ? '🏢 Employer' : '💼 Gig Worker'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Profile Completion */}
                                    {isGigWorker && profileCompletion && (
                                        <div className="mb-8 bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                                            <div className="flex justify-between text-sm font-medium text-blue-700 mb-3">
                                                <span>Profile Completion</span>
                                                <span>{profileCompletion.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
                                                <div 
                                                    className={`h-3 rounded-full shadow-lg transition-all duration-500 bg-gradient-to-r ${getCompletionColor(profileCompletion.percentage)}`}
                                                    style={{ width: `${profileCompletion.percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-3 font-medium">
                                                {profileCompletion.is_complete 
                                                    ? '🎉 Your profile is complete!' 
                                                    : `Complete ${profileCompletion.missing_count} more ${profileCompletion.missing_count === 1 ? 'field' : 'fields'} to attract more employers`
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {/* ID Verification Quick Access */}
                                    <div className="mb-6">
                                        <Link
                                            href="/id-verification"
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                            <span>ID Verification</span>
                                            {user.id_verification_status === 'pending' && (
                                                <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                            {user.id_verification_status === 'verified' && (
                                                <span className="ml-1 px-2 py-0.5 bg-green-400 text-green-900 text-xs font-bold rounded-full">
                                                    ✓
                                                </span>
                                            )}
                                            {!user.id_verification_status && (
                                                <span className="ml-1 px-2 py-0.5 bg-red-400 text-red-900 text-xs font-bold rounded-full">
                                                    Required
                                                </span>
                                            )}
                                        </Link>
                                    </div>

                                    {/* Navigation Tabs */}
                                    <nav className="space-y-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                                                    activeTab === tab.id
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50 hover:shadow-md'
                                                }`}
                                            >
                                                <span className="mr-3 text-lg">{tab.icon}</span>
                                                {tab.name}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <form onSubmit={handleSubmit}>
                                {/* Basic Information Tab */}
                                {activeTab === 'basic' && (
                                    <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                        <div className="p-8">
                                            <div className="mb-8">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Basic Information</h3>
                                                <p className="text-gray-600 text-lg">
                                                    Update your personal information and contact details
                                                </p>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Profile Picture upload functionality has been removed */}

                                                {/* Name Fields */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                            First Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="first_name"
                                                            value={data.first_name}
                                                            onChange={(e) => setData('first_name', e.target.value)}
                                                            disabled={!isEditing}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                        {errors.first_name && <p className="mt-2 text-sm text-red-600">{errors.first_name}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Last Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="last_name"
                                                            value={data.last_name}
                                                            onChange={(e) => setData('last_name', e.target.value)}
                                                            disabled={!isEditing}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                        {errors.last_name && <p className="mt-2 text-sm text-red-600">{errors.last_name}</p>}
                                                    </div>
                                                </div>

                                                {/* Contact Information */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Email Address *
                                                        </label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            value={data.email}
                                                            onChange={(e) => setData('email', e.target.value)}
                                                            disabled={!isEditing}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                        {mustVerifyEmail && user.email_verified_at === null && (
                                                            <p className="mt-2 text-sm text-yellow-600">
                                                                Your email address is unverified. Please check your inbox.
                                                            </p>
                                                        )}
                                                        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Phone Number
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            id="phone"
                                                            value={data.phone}
                                                            onChange={(e) => setData('phone', e.target.value)}
                                                            disabled={!isEditing}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="+63 912 345 6789"
                                                        />
                                                        {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                                                    </div>
                                                </div>

                                                {/* Location (Auto-Detected) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Location (Auto-detected via IP)
                                                    </label>
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                        <p className="text-gray-900 font-medium">{user.country || 'Not detected'}</p>
                                                        {user.city && <p className="text-sm text-gray-600 mt-1">City: {user.city}</p>}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            📍 Location automatically verified during registration
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Complete Address from KYC */}
                                                <div className="border-t border-gray-200 pt-6 mt-6">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                                                        Verified Address (from ID Verification)
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Street Address
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="street_address"
                                                                value={data.street_address}
                                                                onChange={(e) => setData('street_address', e.target.value)}
                                                                disabled={!isEditing || user.address_verified_at}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="123 Main Street"
                                                            />
                                                            {errors.street_address && <p className="mt-2 text-sm text-red-600">{errors.street_address}</p>}
                                                        </div>
                                                        <div>
                                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                                                City
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="city"
                                                                value={data.city}
                                                                onChange={(e) => setData('city', e.target.value)}
                                                                disabled={!isEditing || user.address_verified_at}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Lapu-Lapu City"
                                                            />
                                                            {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city}</p>}
                                                        </div>
                                                        <div>
                                                            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Postal Code
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="postal_code"
                                                                value={data.postal_code}
                                                                onChange={(e) => setData('postal_code', e.target.value)}
                                                                disabled={!isEditing || user.address_verified_at}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="6015"
                                                            />
                                                            {errors.postal_code && <p className="mt-2 text-sm text-red-600">{errors.postal_code}</p>}
                                                        </div>
                                                        <div>
                                                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Country
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="country"
                                                                value={data.country}
                                                                onChange={(e) => setData('country', e.target.value)}
                                                                disabled={!isEditing || user.address_verified_at}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Philippines"
                                                            />
                                                            {errors.country && <p className="mt-2 text-sm text-red-600">{errors.country}</p>}
                                                        </div>
                                                    </div>
                                                    {user.address_verified_at && (
                                                        <p className="mt-2 text-xs text-green-600">
                                                            ✓ Address verified on {new Date(user.address_verified_at).toLocaleDateString()}. Contact support to update.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Bio */}
                                                <div>
                                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Professional Bio
                                                    </label>
                                                    <textarea
                                                        id="bio"
                                                        value={data.bio}
                                                        onChange={(e) => setData('bio', e.target.value)}
                                                        disabled={!isEditing}
                                                        rows={4}
                                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder={isGigWorker
                                                            ? "Tell employers about your experience, skills, and what makes you unique..."
                                                            : "Describe your company, the type of projects you work on, and what you're looking for..."
                                                        }
                                                    />
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        {data.bio.length}/1000 characters. This will be visible on your profile.
                                                    </p>
                                                    {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio}</p>}
                                                </div>

                                                {/* Verification Status Section */}
                                                <div className="border-t border-gray-200 pt-6 mt-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h4>
                                                    <div className="space-y-4">
                                                        {/* Email Verification */}
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">📧</span>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">Email Verification</p>
                                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {user.email_verified_at ? (
                                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : (
                                                                    <Link
                                                                        href={route('verification.send')}
                                                                        method="post"
                                                                        as="button"
                                                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                                    >
                                                                        Verify Email
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* ID Verification */}
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">🆔</span>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">Valid ID Verification</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {user.id_verification_status === 'pending' && 'Under review'}
                                                                        {user.id_verification_status === 'verified' && 'Verified by admin'}
                                                                        {user.id_verification_status === 'rejected' && 'Rejected - Resubmission needed'}
                                                                        {!user.id_verification_status && 'Not submitted'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {user.id_verification_status === 'verified' ? (
                                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : user.id_verification_status === 'pending' ? (
                                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                                                        ⏳ Pending
                                                                    </span>
                                                                ) : (
                                                                    <Link
                                                                        href="/id-verification"
                                                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                                    >
                                                                        {user.id_verification_status === 'rejected' ? 'Resubmit ID' : 'Upload ID'}
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Address Verification */}
                                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">📍</span>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">Address Verification</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {user.address_verified_at 
                                                                            ? `Verified via ID submission on ${new Date(user.address_verified_at).toLocaleDateString()}`
                                                                            : (user.country ? `Location auto-detected (${user.country}). Submit ID to verify address.` : 'Location not detected')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {user.address_verified_at ? (
                                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : user.country ? (
                                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                        📍 Auto-detected
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                                                                        Not detected
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {user.id_verification_status === 'rejected' && user.id_verification_notes && (
                                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                                <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                                                                <p className="text-sm text-red-700">{user.id_verification_notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Professional/Business Tab */}
                                {activeTab === 'professional' && (
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                        <div className="p-8">
                                            <div className="mb-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {isGigWorker ? 'Professional Information' : 'Business Information'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {isGigWorker
                                                        ? 'Showcase your skills, experience, and professional details'
                                                        : 'Tell us about your business and project requirements'
                                                    }
                                                </p>
                                            </div>

                                            <div className="space-y-6">
                                                {isGigWorker ? (
                                                    <>
                                                        {/* Professional Title */}
                                                        <div>
                                                            <label htmlFor="professional_title" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Professional Title *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="professional_title"
                                                                value={data.professional_title}
                                                                onChange={(e) => setData('professional_title', e.target.value)}
                                                                disabled={!isEditing}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="e.g., Full Stack Developer, UI/UX Designer"
                                                                required
                                                            />
                                                            <p className="mt-2 text-sm text-gray-500">
                                                                This will be displayed prominently on your profile
                                                            </p>
                                                            {errors.professional_title && <p className="mt-2 text-sm text-red-600">{errors.professional_title}</p>}
                                                        </div>

                                                        {/* Hourly Rate */}
                                                        <div>
                                                            <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Hourly Rate (PHP) *
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                                                <input
                                                                    type="number"
                                                                    id="hourly_rate"
                                                                    value={data.hourly_rate}
                                                                    onChange={(e) => setData('hourly_rate', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="25.00"
                                                                    min="5"
                                                                    max="500"
                                                                    step="0.01"
                                                                    required
                                                                />
                                                            </div>
                                                            <p className="mt-2 text-sm text-gray-500">
                                                                Set your standard hourly rate. You can adjust this for specific projects.
                                                            </p>
                                                            {errors.hourly_rate && <p className="mt-2 text-sm text-red-600">{errors.hourly_rate}</p>}
                                                        </div>

                                                        {/* === SKILLS & SERVICES (Basis for AI Matching) === */}
                                                        <div className="border-t border-gray-200 pt-6 mt-6">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills & Services</h4>
                                                            <p className="text-sm text-gray-600 mb-6">These details are used for AI-powered job matching</p>
                                                            
                                                            {/* Broad Category */}
                                                            <div className="mb-6">
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Category
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={data.broad_category}
                                                                    onChange={(e) => setData('broad_category', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="e.g., Creative & Design Services"
                                                                />
                                                            </div>

                                                            {/* Specific Services */}
                                                            <div className="mb-6">
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Specific Services
                                                                </label>
                                                                <div className="space-y-2">
                                                                    {data.specific_services.map((service, index) => (
                                                                        <div key={index} className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={service}
                                                                                onChange={(e) => {
                                                                                    const newServices = [...data.specific_services];
                                                                                    newServices[index] = e.target.value;
                                                                                    setData('specific_services', newServices);
                                                                                }}
                                                                                disabled={!isEditing}
                                                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                                                                placeholder="Service name"
                                                                            />
                                                                            {isEditing && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setData('specific_services', 
                                                                                            data.specific_services.filter((_, i) => i !== index)
                                                                                        );
                                                                                    }}
                                                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {isEditing && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setData('specific_services', [...data.specific_services, ''])}
                                                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                                                        >
                                                                            + Add Service
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Skills with Experience */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Skills with Experience Level
                                                                </label>
                                                                <div className="space-y-2">
                                                                    {data.skills_with_experience.map((item, index) => (
                                                                        <div key={index} className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={item.skill}
                                                                                onChange={(e) => {
                                                                                    const newSkills = [...data.skills_with_experience];
                                                                                    newSkills[index].skill = e.target.value;
                                                                                    setData('skills_with_experience', newSkills);
                                                                                }}
                                                                                disabled={!isEditing}
                                                                                placeholder="Skill name"
                                                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                                                            />
                                                                            <select
                                                                                value={item.experience_level}
                                                                                onChange={(e) => {
                                                                                    const newSkills = [...data.skills_with_experience];
                                                                                    newSkills[index].experience_level = e.target.value;
                                                                                    setData('skills_with_experience', newSkills);
                                                                                }}
                                                                                disabled={!isEditing}
                                                                                className="px-4 py-2 border border-gray-300 rounded-lg"
                                                                            >
                                                                                <option value="beginner">Beginner</option>
                                                                                <option value="intermediate">Intermediate</option>
                                                                                <option value="expert">Expert</option>
                                                                            </select>
                                                                            {isEditing && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setData('skills_with_experience', 
                                                                                            data.skills_with_experience.filter((_, i) => i !== index)
                                                                                        );
                                                                                    }}
                                                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {isEditing && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setData('skills_with_experience', [
                                                                                ...data.skills_with_experience, 
                                                                                { skill: '', experience_level: 'intermediate' }
                                                                            ])}
                                                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                                                        >
                                                                            + Add Skill
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Company Name */}
                                                        <div>
                                                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Company Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="company_name"
                                                                value={data.company_name}
                                                                onChange={(e) => setData('company_name', e.target.value)}
                                                                disabled={!isEditing}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Your Company Name"
                                                            />
                                                            {errors.company_name && <p className="mt-2 text-sm text-red-600">{errors.company_name}</p>}
                                                        </div>

                                                        {/* Work Type Needed */}
                                                        <div>
                                                            <label htmlFor="work_type_needed" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Type of Work Needed
                                                            </label>
                                                            <select
                                                                id="work_type_needed"
                                                                value={data.work_type_needed}
                                                                onChange={(e) => setData('work_type_needed', e.target.value)}
                                                                disabled={!isEditing}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select work type</option>
                                                                <option value="Web Development">Web Development</option>
                                                                <option value="Mobile Development">Mobile Development</option>
                                                                <option value="Design">Design & Creative</option>
                                                                <option value="Marketing">Marketing & SEO</option>
                                                                <option value="Writing">Writing & Content</option>
                                                                <option value="Data">Data & Analytics</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                            {errors.work_type_needed && <p className="mt-2 text-sm text-red-600">{errors.work_type_needed}</p>}
                                                        </div>

                                                        {/* Budget Range */}
                                                        <div>
                                                            <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Typical Project Budget
                                                            </label>
                                                            <select
                                                                id="budget_range"
                                                                value={data.budget_range}
                                                                onChange={(e) => setData('budget_range', e.target.value)}
                                                                disabled={!isEditing}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select budget range</option>
                                                                <option value="$500 - $1,000">₱500 - ₱1,000</option>
                                                                <option value="$1,000 - $5,000">₱1,000 - ₱5,000</option>
                                                                <option value="$5,000 - $10,000">₱5,000 - ₱10,000</option>
                                                                <option value="$10,000 - $25,000">₱10,000 - ₱25,000</option>
                                                                <option value="$25,000+">₱25,000+</option>
                                                            </select>
                                                            {errors.budget_range && <p className="mt-2 text-sm text-red-600">{errors.budget_range}</p>}
                                                        </div>

                                                        {/* Project Intent */}
                                                        <div>
                                                            <label htmlFor="project_intent" className="block text-sm font-medium text-gray-700 mb-2">
                                                                Project Goals & Intent
                                                            </label>
                                                            <textarea
                                                                id="project_intent"
                                                                value={data.project_intent}
                                                                onChange={(e) => setData('project_intent', e.target.value)}
                                                                disabled={!isEditing}
                                                                rows={4}
                                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Describe the types of projects you typically work on and your business goals..."
                                                            />
                                                            <p className="mt-2 text-sm text-gray-500">
                                                                Help gig workers understand your business needs and project requirements
                                                            </p>
                                                            {errors.project_intent && <p className="mt-2 text-sm text-red-600">{errors.project_intent}</p>}
                                                        </div>

                                                        {/* === EMPLOYER ONBOARDING FIELDS === */}
                                                        <div className="border-t border-gray-200 pt-6 mt-6">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h4>
                                                            
                                                            {/* Company Size */}
                                                            <div className="mb-6">
                                                                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Company Size
                                                                </label>
                                                                <select
                                                                    id="company_size"
                                                                    value={data.company_size}
                                                                    onChange={(e) => setData('company_size', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select company size</option>
                                                                    <option value="individual">Individual / Sole Proprietor</option>
                                                                    <option value="2-10">2-10 employees</option>
                                                                    <option value="11-50">11-50 employees</option>
                                                                    <option value="51-200">51-200 employees</option>
                                                                    <option value="200+">200+ employees</option>
                                                                </select>
                                                                {errors.company_size && <p className="mt-2 text-sm text-red-600">{errors.company_size}</p>}
                                                            </div>

                                                            {/* Industry */}
                                                            <div className="mb-6">
                                                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Industry
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    id="industry"
                                                                    value={data.industry}
                                                                    onChange={(e) => setData('industry', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="e.g., Technology & IT, Healthcare, E-commerce"
                                                                />
                                                                {errors.industry && <p className="mt-2 text-sm text-red-600">{errors.industry}</p>}
                                                            </div>

                                                            {/* Company Website */}
                                                            <div className="mb-6">
                                                                <label htmlFor="company_website" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Company Website
                                                                </label>
                                                                <input
                                                                    type="url"
                                                                    id="company_website"
                                                                    value={data.company_website}
                                                                    onChange={(e) => setData('company_website', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="https://example.com"
                                                                />
                                                                {errors.company_website && <p className="mt-2 text-sm text-red-600">{errors.company_website}</p>}
                                                            </div>

                                                            {/* Company Description */}
                                                            <div className="mb-6">
                                                                <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Company Description
                                                                </label>
                                                                <textarea
                                                                    id="company_description"
                                                                    value={data.company_description}
                                                                    onChange={(e) => setData('company_description', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    rows={4}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="Tell us about your company or business..."
                                                                />
                                                                {errors.company_description && <p className="mt-2 text-sm text-red-600">{errors.company_description}</p>}
                                                            </div>
                                                        </div>

                                                        {/* === HIRING PREFERENCES === */}
                                                        <div className="border-t border-gray-200 pt-6 mt-6">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Hiring Preferences</h4>
                                                            
                                                            {/* Typical Project Budget */}
                                                            <div className="mb-6">
                                                                <label htmlFor="typical_project_budget" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Typical Project Budget
                                                                </label>
                                                                <select
                                                                    id="typical_project_budget"
                                                                    value={data.typical_project_budget}
                                                                    onChange={(e) => setData('typical_project_budget', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select budget range</option>
                                                                    <option value="under_500">Under ₱500</option>
                                                                    <option value="500-2000">₱500 - ₱2,000</option>
                                                                    <option value="2000-5000">₱2,000 - ₱5,000</option>
                                                                    <option value="5000-10000">₱5,000 - ₱10,000</option>
                                                                    <option value="10000+">₱10,000+</option>
                                                                </select>
                                                                {errors.typical_project_budget && <p className="mt-2 text-sm text-red-600">{errors.typical_project_budget}</p>}
                                                            </div>

                                                            {/* Typical Project Duration */}
                                                            <div className="mb-6">
                                                                <label htmlFor="typical_project_duration" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Typical Project Duration
                                                                </label>
                                                                <select
                                                                    id="typical_project_duration"
                                                                    value={data.typical_project_duration}
                                                                    onChange={(e) => setData('typical_project_duration', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select duration</option>
                                                                    <option value="short_term">Short-term (1-4 weeks)</option>
                                                                    <option value="medium_term">Medium-term (1-3 months)</option>
                                                                    <option value="long_term">Long-term (3+ months)</option>
                                                                    <option value="ongoing">Ongoing / Retainer</option>
                                                                </select>
                                                                {errors.typical_project_duration && <p className="mt-2 text-sm text-red-600">{errors.typical_project_duration}</p>}
                                                            </div>

                                                            {/* Preferred Experience Level */}
                                                            <div className="mb-6">
                                                                <label htmlFor="preferred_experience_level" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Preferred Experience Level
                                                                </label>
                                                                <select
                                                                    id="preferred_experience_level"
                                                                    value={data.preferred_experience_level}
                                                                    onChange={(e) => setData('preferred_experience_level', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select experience level</option>
                                                                    <option value="any">Any level</option>
                                                                    <option value="beginner">Beginner</option>
                                                                    <option value="intermediate">Intermediate</option>
                                                                    <option value="expert">Expert</option>
                                                                </select>
                                                                {errors.preferred_experience_level && <p className="mt-2 text-sm text-red-600">{errors.preferred_experience_level}</p>}
                                                            </div>

                                                            {/* Hiring Frequency */}
                                                            <div className="mb-6">
                                                                <label htmlFor="hiring_frequency" className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Hiring Frequency
                                                                </label>
                                                                <select
                                                                    id="hiring_frequency"
                                                                    value={data.hiring_frequency}
                                                                    onChange={(e) => setData('hiring_frequency', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select frequency</option>
                                                                    <option value="one_time">One-time project</option>
                                                                    <option value="occasional">Occasional (few times a year)</option>
                                                                    <option value="regular">Regular (monthly)</option>
                                                                    <option value="ongoing">Ongoing (weekly/daily)</option>
                                                                </select>
                                                                {errors.hiring_frequency && <p className="mt-2 text-sm text-red-600">{errors.hiring_frequency}</p>}
                                                            </div>

                                                            {/* Tax ID */}
                                                            {data.tax_id && (
                                                                <div className="mb-6">
                                                                    <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Tax ID / Business Registration
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        id="tax_id"
                                                                        value={data.tax_id}
                                                                        disabled={true}
                                                                        className="w-full border-gray-300 rounded-md shadow-sm bg-gray-100"
                                                                        placeholder="Tax ID (if provided during onboarding)"
                                                                    />
                                                                    <p className="mt-2 text-xs text-gray-500">Tax ID cannot be edited from profile. Contact support for changes.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Availability Tab */}
                                {activeTab === 'availability' && isGigWorker && (
                                    <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200 p-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Availability & Communication</h3>
                                        <div className="space-y-6">
                                            {/* Working Hours */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Working Hours
                                                </label>
                                                <div className="space-y-2">
                                                    {Object.keys(data.working_hours).map((day) => (
                                                        <div key={day} className="flex items-center gap-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.working_hours[day].enabled}
                                                                onChange={(e) => {
                                                                    setData('working_hours', {
                                                                        ...data.working_hours,
                                                                        [day]: { ...data.working_hours[day], enabled: e.target.checked }
                                                                    });
                                                                }}
                                                                className="w-5 h-5 text-blue-600 rounded"
                                                            />
                                                            <span className="w-24 capitalize font-medium">{day}</span>
                                                            {data.working_hours[day].enabled && (
                                                                <>
                                                                    <input
                                                                        type="time"
                                                                        value={data.working_hours[day].start}
                                                                        onChange={(e) => {
                                                                            setData('working_hours', {
                                                                                ...data.working_hours,
                                                                                [day]: { ...data.working_hours[day], start: e.target.value }
                                                                            });
                                                                        }}
                                                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                                                    />
                                                                    <span className="text-gray-600">to</span>
                                                                    <input
                                                                        type="time"
                                                                        value={data.working_hours[day].end}
                                                                        onChange={(e) => {
                                                                            setData('working_hours', {
                                                                                ...data.working_hours,
                                                                                [day]: { ...data.working_hours[day], end: e.target.value }
                                                                            });
                                                                        }}
                                                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Timezone */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Timezone
                                                </label>
                                                <select
                                                    value={data.timezone}
                                                    onChange={(e) => setData('timezone', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Asia/Manila">Asia/Manila (PHT)</option>
                                                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                                    <option value="America/New_York">America/New_York (EST)</option>
                                                    <option value="Europe/London">Europe/London (GMT)</option>
                                                </select>
                                            </div>

                                            {/* Preferred Communication */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Preferred Communication Methods
                                                </label>
                                                <div className="space-y-2">
                                                    {['email', 'chat', 'video_call', 'phone'].map((method) => (
                                                        <label key={method} className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.preferred_communication.includes(method)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setData('preferred_communication', [...data.preferred_communication, method]);
                                                                    } else {
                                                                        setData('preferred_communication', 
                                                                            data.preferred_communication.filter(m => m !== method)
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-5 h-5 text-blue-600 rounded"
                                                            />
                                                            <span className="capitalize">{method.replace('_', ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Availability Notes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Availability Notes
                                                </label>
                                                <textarea
                                                    value={data.availability_notes}
                                                    onChange={(e) => setData('availability_notes', e.target.value)}
                                                    rows={4}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Any additional notes about your availability..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Portfolio Tab */}
                                {activeTab === 'portfolio' && isGigWorker && (
                                    <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200 p-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Your portfolio items are managed separately during onboarding. 
                                        </p>
                                        {user.portfolio_items && user.portfolio_items.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {user.portfolio_items.map((item, index) => (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                        <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                                                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                                        {item.project_url && (
                                                            <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                                                View Project →
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-gray-500">No portfolio items yet. Add them during your onboarding process.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        {/* Change Password */}
                                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                            <div className="p-8">
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Ensure your account is using a long, random password to stay secure
                                                    </p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Current Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="current_password"
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter your current password"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                            New Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="new_password"
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter a new password"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                            Confirm New Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="confirm_password"
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Confirm your new password"
                                                        />
                                                    </div>
                                                    <div className="pt-4">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                        >
                                                            Update Password
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Account Security */}
                                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                            <div className="p-8">
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Security</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Manage your account security settings and preferences
                                                    </p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
                                                            <p className="text-sm text-gray-600">
                                                                {user.email_verified_at ? 'Your email is verified' : 'Please verify your email address'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            {user.email_verified_at ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    ✓ Verified
                                                                </span>
                                                            ) : (
                                                                <button className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                                    Verify Email
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900">Profile Status</h4>
                                                            <p className="text-sm text-gray-600">
                                                                Your profile is currently {user.profile_status}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                user.profile_status === 'approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : user.profile_status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {user.profile_status === 'approved' ? '✓' : user.profile_status === 'pending' ? '⏳' : '❌'} {user.profile_status.charAt(0).toUpperCase() + user.profile_status.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isGigWorker && user.id_verification_status && (
                                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-900">ID Verification Status</h4>
                                                                <p className="text-sm text-gray-600">
                                                                    Your {user.id_type?.replace('_', ' ')} is {user.id_verification_status}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    user.id_verification_status === 'verified'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : user.id_verification_status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {user.id_verification_status === 'verified' ? '✓' : user.id_verification_status === 'pending' ? '⏳' : '❌'} {user.id_verification_status.charAt(0).toUpperCase() + user.id_verification_status.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900">Account Type</h4>
                                                            <p className="text-sm text-gray-600">
                                                                You are registered as a {user.user_type === 'employer' ? 'Employer' : 'Gig Worker'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                user.user_type === 'employer'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {user.user_type === 'employer' ? '🏢 Employer' : '💼 Gig Worker'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-red-200 border">
                                            <div className="p-8">
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                                                    <p className="text-sm text-red-600">
                                                        Irreversible and destructive actions
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                                                            <p className="text-sm text-red-600">
                                                                Permanently delete your account and all associated data
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <button className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                                Delete Account
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Save Button - Always visible */}
                                {(activeTab === 'basic' || activeTab === 'professional') && (
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                                        <div className="p-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Transition
                                                        show={recentlySuccessful}
                                                        enter="transition ease-in-out"
                                                        enterFrom="opacity-0"
                                                        leave="transition ease-in-out"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <p className="text-sm text-green-600">✓ Profile updated successfully!</p>
                                                    </Transition>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => window.location.reload()}
                                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processing ? (
                                                            <div className="flex items-center">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                Saving...
                                                            </div>
                                                        ) : (
                                                            'Save Changes'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Profile Tips */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Profile Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-blue-900 mb-3">
                                    {isGigWorker ? 'Stand Out to Employers:' : 'Attract Top Gig Workers:'}
                                </h4>
                                <ul className="text-sm text-blue-800 space-y-2">
                                    {isGigWorker ? (
                                        <>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Upload a professional profile photo</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Write a compelling bio highlighting your expertise</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>List relevant skills and set competitive rates</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Add your portfolio to showcase your work</span>
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Provide clear company information</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Describe your typical project requirements</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Set realistic budget expectations</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-500 mr-2">•</span>
                                                <span>Explain your business goals and vision</span>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-3">Profile Completion Benefits:</h4>
                                <ul className="text-sm text-blue-800 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span>Higher visibility in search results</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span>Better AI job recommendations</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span>Increased trust from {isGigWorker ? 'employers' : 'gig workers'}</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span>Access to premium features</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                body {
                    background: white;
                    color: #333;
                    font-family: 'Inter', sans-serif;
                }
            `}</style>

            {/* Success Modal */}
            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                message="Profile picture updated successfully!"
            />

        </AuthenticatedLayout>
    );
}
