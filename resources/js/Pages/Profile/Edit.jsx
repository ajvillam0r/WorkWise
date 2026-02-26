import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Transition } from '@headlessui/react';
import SuccessModal from '@/Components/SuccessModal';
import VerificationBadge, { VerificationBadges } from '@/Components/VerificationBadge';
import IDVerifiedBadge from '@/Components/IDVerifiedBadge';
import { ToastContainer } from '@/Components/Toast';
import useToast from '@/Hooks/useToast';
import { validateSection, validateField } from '@/utils/validation';
import BasicInfoTab from './Tabs/BasicInfoTab';
import ProfessionalTab from './Tabs/ProfessionalTab';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [activeTab, setActiveTab] = useState('basic');
    const [skillInput, setSkillInput] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Toast notifications
    const toast = useToast();

    // Section-level editing states
    const [editingSections, setEditingSections] = useState({
        basic: false,
        professional: false,
        security: false,
    });

    // Section-level loading states
    const [savingSections, setSavingSections] = useState({
        basic: false,
        professional: false,
        security: false,
    });

    // Client-side validation errors
    const [clientErrors, setClientErrors] = useState({});

    // Real-time field validation on blur
    const validateFieldOnBlur = useCallback((fieldName, value) => {
        const error = validateField(fieldName, value);
        setClientErrors(prev => {
            if (error) {
                return { ...prev, [fieldName]: error };
            } else {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            }
        });
    }, []);

    // Track original values for comparison
    const [originalData, setOriginalData] = useState(null);

    const isGigWorker = user.user_type === 'gig_worker';
    const isEmployer = user.user_type === 'employer';



    // Initialize form data
    const initialFormData = useMemo(() => ({
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

        // Portfolio fields
        portfolio_link: user.portfolio_link || '',
        resume_file: null, // File input starts empty

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

        // Profile Picture
        profile_picture: null,
    }), [user]);

    const { data, setData, patch, post, processing, errors, recentlySuccessful, reset } = useForm(initialFormData);

    // Initialize original data on mount and sync when user data changes
    useEffect(() => {
        const newOriginalData = JSON.parse(JSON.stringify(initialFormData));
        setOriginalData(newOriginalData);
    }, [user.id]); // Only reset when user changes (e.g., after successful save)

    // Helper function to deeply compare values
    const deepEqual = useCallback((obj1, obj2) => {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return false;
        if (typeof obj1 !== typeof obj2) return false;

        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) return false;
            return obj1.every((val, idx) => deepEqual(val, obj2[idx]));
        }

        if (typeof obj1 === 'object') {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            if (keys1.length !== keys2.length) return false;
            return keys1.every(key => deepEqual(obj1[key], obj2[key]));
        }

        return obj1 === obj2;
    }, []);

    // Get only changed fields (dirty fields)
    const getChangedFields = useCallback(() => {
        if (!originalData) return {};

        const changed = {};
        Object.keys(data).forEach(key => {
            if (!deepEqual(data[key], originalData[key])) {
                changed[key] = data[key];
            }
        });
        return changed;
    }, [data, originalData, deepEqual]);

    // Check if any fields are dirty
    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return Object.keys(getChangedFields()).length > 0;
    }, [data, originalData, getChangedFields]);

    // Helper to get editing state for current active tab
    const isCurrentTabEditing = useMemo(() => {
        if (activeTab === 'basic') return editingSections.basic;
        if (activeTab === 'professional') return editingSections.professional;
        if (activeTab === 'security') return editingSections.security;
        return false;
    }, [activeTab, editingSections]);

    // Get fields for a specific section
    const getSectionFields = useCallback((section) => {
        const fieldMap = {
            basic: ['first_name', 'last_name', 'email', 'phone', 'bio', 'country', 'province', 'municipality', 'street_address', 'city', 'postal_code'],
            professional: isGigWorker
                ? ['professional_title', 'hourly_rate', 'broad_category', 'specific_services', 'skills_with_experience']
                : ['company_name', 'work_type_needed', 'budget_range', 'project_intent', 'company_size', 'industry', 'company_website', 'company_description'],
            security: [], // Password change handled separately
        };
        return fieldMap[section] || [];
    }, []);

    // Section-level edit handlers
    const startEditingSection = useCallback((section) => {
        setEditingSections(prev => ({ ...prev, [section]: true }));
    }, []);

    const cancelEditingSection = useCallback((section) => {
        setEditingSections(prev => ({ ...prev, [section]: false }));
        // Reset only fields related to this section
        if (originalData) {
            const sectionFields = getSectionFields(section);
            sectionFields.forEach(field => {
                setData(field, originalData[field]);
            });
        }
    }, [originalData, setData, getSectionFields]);

    // Get changed fields for a specific section
    const getSectionChanges = useCallback((section) => {
        const changedFields = getChangedFields();
        const sectionFields = getSectionFields(section);
        const sectionChanges = {};
        sectionFields.forEach(field => {
            if (changedFields[field] !== undefined) {
                sectionChanges[field] = changedFields[field];
            }
        });
        return sectionChanges;
    }, [getChangedFields, getSectionFields]);

    // Save a specific section
    const saveSection = useCallback((section) => {
        const sectionChanges = getSectionChanges(section);

        if (Object.keys(sectionChanges).length === 0) {
            setEditingSections(prev => ({ ...prev, [section]: false }));
            return;
        }

        // Client-side validation
        const validationErrors = validateSection(data, section);
        setClientErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            toast.error('Please fix the errors before saving');
            return;
        }

        // Clear client errors for this section
        setClientErrors(prev => {
            const updated = { ...prev };
            Object.keys(validationErrors).forEach(key => delete updated[key]);
            return updated;
        });

        // Set loading state
        setSavingSections(prev => ({ ...prev, [section]: true }));

        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('_method', 'PATCH');

        Object.keys(sectionChanges).forEach(key => {
            // Handle array fields specifically
            if (Array.isArray(sectionChanges[key])) {
                sectionChanges[key].forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        // For array of objects (like skills_with_experience)
                        Object.keys(item).forEach(subKey => {
                            formData.append(`${key}[${index}][${subKey}]`, item[subKey]);
                        });
                    } else {
                        // For simple arrays (like specific_services)
                        formData.append(`${key}[]`, item);
                    }
                });
            } else {
                formData.append(key, sectionChanges[key]);
            }
        });

        post(route('profile.update'), {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            only: Object.keys(sectionChanges),
            onError: (serverErrors) => {
                console.error('Profile update errors:', serverErrors);
                setSavingSections(prev => ({ ...prev, [section]: false }));
                toast.error('Failed to save changes. Please check the errors below.');
            },
            onSuccess: () => {
                // Update original data with saved changes (deep merge for nested objects)
                setOriginalData(prev => {
                    const updated = JSON.parse(JSON.stringify(prev || {}));
                    Object.keys(sectionChanges).forEach(key => {
                        if (typeof sectionChanges[key] === 'object' && !Array.isArray(sectionChanges[key]) && sectionChanges[key] !== null) {
                            updated[key] = JSON.parse(JSON.stringify(sectionChanges[key]));
                        } else {
                            updated[key] = sectionChanges[key];
                        }
                    });
                    return updated;
                });
                setEditingSections(prev => ({ ...prev, [section]: false }));
                setSavingSections(prev => ({ ...prev, [section]: false }));

                const sectionNames = {
                    basic: 'Basic Information',
                    professional: 'Professional Details',
                    availability: 'Availability',
                    portfolio: 'Portfolio & Resume',
                    matching: 'Matching Preferences',
                    security: 'Security Settings',
                };
                toast.success(`${sectionNames[section]} saved successfully!`);
            },
        });
    }, [getSectionChanges, data, patch, toast]);

    // Handle global submit (for backward compatibility or full form saves)
    const handleSubmit = useCallback((e) => {
        e?.preventDefault();

        const changedFields = getChangedFields();

        if (Object.keys(changedFields).length === 0) {
            toast.info('No changes to save');
            return;
        }

        // Validate all sections that have changes
        const allErrors = {};
        Object.keys(changedFields).forEach(key => {
            // Determine which section this field belongs to
            const sectionMap = {
                basic: ['first_name', 'last_name', 'email', 'phone', 'bio', 'country', 'province', 'municipality', 'street_address', 'city', 'postal_code'],
                professional: ['company_name', 'work_type_needed', 'budget_range', 'project_intent', 'company_size', 'industry', 'company_website', 'company_description', 'primary_hiring_needs', 'typical_project_budget', 'typical_project_duration', 'preferred_experience_level', 'hiring_frequency', 'tax_id'],
            };

            let section = null;
            for (const [sec, fields] of Object.entries(sectionMap)) {
                if (fields.includes(key)) {
                    section = sec;
                    break;
                }
            }

            if (section) {
                const sectionErrors = validateSection(data, section);
                Object.assign(allErrors, sectionErrors);
            }
        });

        setClientErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {
            toast.error('Please fix the errors before saving');
            return;
        }

        patch(route('profile.update'), changedFields, {
            preserveScroll: true,
            preserveState: true,
            only: Object.keys(changedFields),
            onError: (serverErrors) => {
                console.error('Profile update errors:', serverErrors);
                toast.error('Failed to save changes. Please check the errors below.');
            },
            onSuccess: () => {
                // Update original data with saved changes (deep merge for nested objects)
                setOriginalData(prev => {
                    const updated = JSON.parse(JSON.stringify(prev || {}));
                    Object.keys(changedFields).forEach(key => {
                        if (typeof changedFields[key] === 'object' && !Array.isArray(changedFields[key]) && changedFields[key] !== null) {
                            updated[key] = JSON.parse(JSON.stringify(changedFields[key]));
                        } else {
                            updated[key] = changedFields[key];
                        }
                    });
                    return updated;
                });
                toast.success(`Profile updated successfully! (${Object.keys(changedFields).length} field${Object.keys(changedFields).length > 1 ? 's' : ''})`);
            },
        });
    }, [getChangedFields, data, isGigWorker, patch, toast]);

    // Handle profile picture upload
    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('_method', 'PATCH');
        formData.append('profile_picture', file);

        post(route('profile.update'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile picture updated successfully!');
                // Update original data to reflect new image (though it's handled by page props reload)
            },
            onError: () => {
                toast.error('Failed to update profile picture.');
            }
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
        { id: 'professional', name: 'Business', icon: '🏢' },
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
                        {hasChanges && (
                            <>
                                <button
                                    onClick={() => {
                                        // Reset all changes
                                        if (originalData) {
                                            Object.keys(data).forEach(key => {
                                                setData(key, originalData[key]);
                                            });
                                        }
                                    }}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : `Save All Changes (${Object.keys(getChangedFields()).length})`}
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
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="relative z-20 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Profile Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                <div className="p-8">
                                    {/* Profile Photo - Display Only */}
                                    <div className="text-center mb-6">
                                        <div className="flex justify-center mb-4">
                                            <div className="relative h-24 w-24">
                                                {user.profile_picture || user.profile_photo ? (
                                                    <img
                                                        src={user.profile_picture || user.profile_photo}
                                                        alt={`${data.first_name} ${data.last_name}`}
                                                        className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200">
                                                        <span className="text-lg">
                                                            {data.first_name?.[0] || ''}{data.last_name?.[0] || ''}
                                                        </span>
                                                    </div>
                                                )}


                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {data.first_name} {data.last_name}
                                        </h3>
                                        <VerificationBadges user={user} size="sm" className="justify-center mt-2 mb-3" />
                                        <div className="mt-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                                                🏢 Employer
                                            </span>
                                        </div>
                                    </div>



                                    {/* ID Verification Quick Access */}
                                    {/* Show button only when status is null or rejected */}
                                    {(!user.id_verification_status || user.id_verification_status === 'rejected') && (
                                        <div className="mb-6">
                                            <Link
                                                href="/id-verification"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                </svg>
                                                <span>
                                                    {user.id_verification_status === 'rejected' ? 'Re-upload ID' : 'Verify Your ID'}
                                                </span>
                                                {user.id_verification_status === 'rejected' && (
                                                    <span className="ml-1 px-2 py-0.5 bg-red-400 text-red-900 text-xs font-bold rounded-full">
                                                        Rejected
                                                    </span>
                                                )}
                                                {!user.id_verification_status && (
                                                    <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                                        Required
                                                    </span>
                                                )}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Show status message card when pending */}
                                    {user.id_verification_status === 'pending' && (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                            <div className="flex items-center gap-2 text-yellow-800">
                                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold">ID Verification Pending</p>
                                                    <p className="text-xs mt-1">Your ID is under review</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show status message card when verified */}
                                    {user.id_verification_status === 'verified' && (
                                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <div className="flex items-center gap-2 text-green-800">
                                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold">ID Verified</p>
                                                    <p className="text-xs mt-1">Your identity is confirmed</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Tabs */}
                                    <nav className="space-y-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === tab.id
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
                                    <BasicInfoTab
                                        data={data}
                                        setData={setData}
                                        errors={{ ...errors, ...clientErrors }}
                                        user={user}
                                        mustVerifyEmail={mustVerifyEmail}
                                        isGigWorker={isGigWorker}
                                        isEditing={editingSections.basic}
                                        processing={savingSections.basic}
                                        hasChanges={Object.keys(getSectionChanges('basic')).length > 0}
                                        onEdit={() => startEditingSection('basic')}
                                        onCancel={() => cancelEditingSection('basic')}
                                        onSave={() => saveSection('basic')}
                                    />
                                )}

                                {/* Professional Information Tab */}
                                {activeTab === 'professional' && (
                                    <ProfessionalTab
                                        data={data}
                                        setData={setData}
                                        errors={{ ...errors, ...clientErrors }}
                                        isGigWorker={isGigWorker}
                                        isEditing={editingSections.professional}
                                        processing={savingSections.professional}
                                        hasChanges={Object.keys(getSectionChanges('professional')).length > 0}
                                        onEdit={() => startEditingSection('professional')}
                                        onCancel={() => cancelEditingSection('professional')}
                                        onSave={() => saveSection('professional')}
                                        user={user}
                                    />
                                )}




                                {/* Legacy Basic Tab Code - Remove after migration */}
                                {false && activeTab === 'basic' && (
                                    <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg sm:rounded-xl border border-gray-200">
                                        <div className="p-8">
                                            <div className="mb-8 flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Basic Information</h3>
                                                    <p className="text-gray-600 text-lg">
                                                        Update your personal information and contact details
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!editingSections.basic ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditingSection('basic')}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => cancelEditingSection('basic')}
                                                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveSection('basic')}
                                                                disabled={savingSections.basic || Object.keys(getSectionChanges('basic')).length === 0}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                {savingSections.basic && (
                                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                )}
                                                                {savingSections.basic ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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
                                                            disabled={!editingSections.basic}
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
                                                            disabled={!isCurrentTabEditing}
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
                                                            disabled={!isCurrentTabEditing}
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
                                                            disabled={!isCurrentTabEditing}
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
                                                                placeholder="Enter your city"
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

                                {/* Legacy Professional Tab - Remove after full migration */}
                                {false && activeTab === 'professional' && (
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                        <div className="p-8">
                                            <div className="mb-8 flex justify-between items-start">
                                                <div>
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
                                                                disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                                disabled={!isCurrentTabEditing}
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
                                                                                disabled={!isCurrentTabEditing}
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
                                                                                disabled={!isCurrentTabEditing}
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
                                                                disabled={!isCurrentTabEditing}
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
                                                                disabled={!isCurrentTabEditing}
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
                                                                disabled={!isCurrentTabEditing}
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
                                                                disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                                    disabled={!isCurrentTabEditing}
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
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.profile_status === 'approved'
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
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.id_verification_status === 'verified'
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
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.user_type === 'employer'
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

            {/* Success Modal (kept for backward compatibility) */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message="Profile picture updated successfully!"
            />

            {/* Toast Notifications */}
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

        </AuthenticatedLayout>
    );
}
