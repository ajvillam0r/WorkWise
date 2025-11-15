import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SkillAutocompleteInput from '@/Components/SkillAutocompleteInput';
import FileUploadInput from '@/Components/FileUploadInput';
import ValidationFeedback from '@/Components/ValidationFeedback';
import CharacterCounter from '@/Components/CharacterCounter';
import ErrorSummary from '@/Components/ErrorSummary';
import { ToastContainer } from '@/Components/Toast';
import useOnboardingForm from '@/Hooks/useOnboardingForm.js';
import useFieldValidation from '@/Hooks/useFieldValidation';
import useToast from '@/Hooks/useToast';
import { validationRules } from '@/utils/validationRules';
import { getFirstError, ERROR_CODES, SUPPORT_CONTACT } from '@/utils/errorHelpers';
import { startCsrfRefresh, stopCsrfRefresh } from '@/utils/csrfRefresh';

export default function GigWorkerOnboarding({ user, skillsTaxonomy }) {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 5; // Simplified: removed language, availability, and ID verification steps (0-4)

    // Use custom onboarding form hook with file handling and persistence
    const { 
        data, 
        setData, 
        post, 
        processing, 
        errors,
        files,
        filePreviews,
        handleFileChange,
        clearStorage,
        getUploadProgress,
        getUploadStatus
    } = useOnboardingForm({
        initialData: {
            // Step 1: Basic Info
            professional_title: '',
            hourly_rate: '',
            bio: '',
            profile_picture: null,

            // Step 2: Hierarchical Skills
            broad_category: '',
            specific_services: [],
            skills_with_experience: [],

            // Step 3: Portfolio
            portfolio_link: '',
            resume_file: null,
        },
        storageKey: `onboarding_gig_worker_${user?.id || 'guest'}`,
        enablePersistence: true
    });

    // Safety fallbacks for upload progress functions (in case of caching issues)
    const safeGetUploadProgress = getUploadProgress || (() => 0);
    const safeGetUploadStatus = getUploadStatus || (() => '');

    // State for UI
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [skillSearchInput, setSkillSearchInput] = useState('');
    const [portfolioType, setPortfolioType] = useState('none'); // 'none', 'link', 'resume'
    const [attemptedProceed, setAttemptedProceed] = useState(false);
    const [showErrorSummary, setShowErrorSummary] = useState(false);
    const [errorCodes, setErrorCodes] = useState({});
    const [uploadFailures, setUploadFailures] = useState({});
    
    // Toast notifications
    const { toasts, removeToast, success, error: showError, warning } = useToast();

    // Real-time validation for Step 1 fields
    const professionalTitleValidation = useFieldValidation(
        data.professional_title,
        [validationRules.required('Professional title')],
        300
    );

    const hourlyRateValidation = useFieldValidation(
        data.hourly_rate,
        [
            validationRules.required('Hourly rate'),
            validationRules.numeric('Hourly rate'),
            validationRules.minValue(5, 'Hourly rate'),
            validationRules.maxValue(10000, 'Hourly rate')
        ],
        300
    );

    const bioValidation = useFieldValidation(
        data.bio,
        [
            validationRules.required('Professional bio'),
            validationRules.minLength(50, 'Professional bio')
        ],
        500
    );

    // Start CSRF token refresh to prevent 419 errors on long forms
    useEffect(() => {
        // Refresh CSRF token every 30 minutes to prevent session expiration
        const refreshIntervalId = startCsrfRefresh(30);
        
        return () => {
            stopCsrfRefresh(refreshIntervalId);
        };
    }, []);

    // Load categories from taxonomy
    useEffect(() => {
        if (skillsTaxonomy && skillsTaxonomy.services) {
            setAvailableCategories(skillsTaxonomy.services);
        }
    }, [skillsTaxonomy]);

    // Update available services when broad category changes
    useEffect(() => {
        if (data.broad_category && availableCategories.length > 0) {
            const selected = availableCategories.find(cat => cat.name === data.broad_category);
            if (selected) {
                setAvailableServices(selected.categories || []);
                // Only reset if services actually changed
                if (data.specific_services.length > 0) {
                    setData('specific_services', []);
                    setData('skills_with_experience', []);
                }
                setAvailableSkills([]);
            }
        }
    }, [data.broad_category, availableCategories]);

    // Update available skills when specific services change
    useEffect(() => {
        if (data.specific_services.length > 0 && availableServices.length > 0) {
            const allSkills = [];
            data.specific_services.forEach(serviceName => {
                const service = availableServices.find(s => s.name === serviceName);
                if (service && service.skills) {
                    service.skills.forEach(skill => {
                        if (!allSkills.includes(skill)) {
                            allSkills.push(skill);
                        }
                    });
                }
            });
            setAvailableSkills(allSkills);
        } else if (data.specific_services.length === 0) {
            setAvailableSkills([]);
        }
    }, [data.specific_services, availableServices]);



    const handleSubmit = (e) => {
        e.preventDefault();
        setShowErrorSummary(false);
        
        post(route('gig-worker.onboarding.store'), {
            forceFormData: true,
            onError: (errors) => {
                console.error('Onboarding submission errors:', errors);
                
                // Determine error codes based on error messages
                const codes = {};
                Object.entries(errors).forEach(([field, message]) => {
                    const msg = Array.isArray(message) ? message[0] : message;
                    
                    // Assign error codes based on message content
                    if (msg.includes('required') || msg.includes('must be provided')) {
                        codes[field] = ERROR_CODES.REQUIRED_FIELD_MISSING;
                    } else if (msg.includes('file') && msg.includes('large')) {
                        codes[field] = ERROR_CODES.FILE_TOO_LARGE;
                    } else if (msg.includes('file') && msg.includes('type')) {
                        codes[field] = ERROR_CODES.INVALID_FILE_TYPE;
                    } else if (msg.includes('minimum') || msg.includes('at least')) {
                        codes[field] = ERROR_CODES.MIN_LENGTH;
                    } else if (msg.includes('maximum') || msg.includes('exceed')) {
                        codes[field] = ERROR_CODES.MAX_LENGTH;
                    } else if (msg.includes('format') || msg.includes('invalid')) {
                        codes[field] = ERROR_CODES.INVALID_FORMAT;
                    } else {
                        codes[field] = ERROR_CODES.SERVER_ERROR;
                    }
                });
                
                setErrorCodes(codes);
                setShowErrorSummary(true);
                
                // Navigate to the step with the first error
                const firstError = getFirstError(errors);
                if (firstError && firstError.step !== null) {
                    setCurrentStep(firstError.step);
                    
                    // Show error toast
                    showError(
                        `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} in your form`,
                        5000
                    );
                } else {
                    // Generic error toast if we can't determine the step
                    showError('Please review and fix the errors in your form', 5000);
                }
                
                // Scroll to top to show error summary
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onSuccess: () => {
                console.log('Onboarding completed successfully');
                success('Your profile has been created successfully! Welcome to WorkWise!', 6000);
                clearStorage();
            }
        });
    };

    const handleSkip = () => {
        post(route('gig-worker.onboarding.skip'));
    };
    
    // Handle error click to navigate to field
    const handleErrorClick = (fieldName) => {
        const firstError = getFirstError({ [fieldName]: errors[fieldName] });
        if (firstError && firstError.step !== null) {
            setCurrentStep(firstError.step);
            
            // Scroll to top after navigation
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Try to focus the field
                const element = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
                if (element) {
                    element.focus();
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };
    
    // Handle file upload retry
    const handleFileRetry = (fieldName) => {
        setUploadFailures(prev => ({ ...prev, [fieldName]: false }));
        warning(`Retrying upload for ${fieldName.replace(/_/g, ' ')}...`, 3000);
        
        // Trigger file input click to allow user to select file again
        const fileInput = document.querySelector(`input[name="${fieldName}"]`);
        if (fileInput) {
            fileInput.click();
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            if (canProceedFromStep(currentStep)) {
                setCurrentStep(currentStep + 1);
                setAttemptedProceed(false); // Reset for next step
                // Auto-scroll to top on step navigation (mobile optimization)
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Mark that user attempted to proceed (to show validation errors)
                setAttemptedProceed(true);
                
                // Mark validation fields as touched for Step 1
                if (currentStep === 1) {
                    professionalTitleValidation.markAsTouched();
                    hourlyRateValidation.markAsTouched();
                    bioValidation.markAsTouched();
                }
                
                // Show error message based on current step
                let errorMsg = 'Please complete all required fields before proceeding.';
                if (currentStep === 1) {
                    const errors = [];
                    if (!data.professional_title) errors.push('Professional title');
                    if (!data.hourly_rate || data.hourly_rate < 5 || data.hourly_rate > 10000) errors.push('Valid hourly rate (₱5-₱10,000)');
                    if (!data.bio || data.bio.length < 50) errors.push('Professional bio (minimum 50 characters)');
                    
                    if (errors.length > 0) {
                        errorMsg = `Please complete the following:\n• ${errors.join('\n• ')}`;
                    }
                } else if (currentStep === 2) {
                    errorMsg = `Please select at least 3 skills with experience levels. You have selected ${data.skills_with_experience.length} skill(s).`;
                }
                alert(errorMsg);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            // Auto-scroll to top on step navigation (mobile optimization)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const toggleSkillSelection = (skill) => {
        const exists = data.skills_with_experience.find(s => s.skill === skill);
        if (exists) {
            setData('skills_with_experience', data.skills_with_experience.filter(s => s.skill !== skill));
        } else {
            setData('skills_with_experience', [...data.skills_with_experience, {
                skill: skill,
                experience_level: 'intermediate'
            }]);
        }
    };

    const updateSkillExperience = (skill, level) => {
        setData('skills_with_experience', data.skills_with_experience.map(s =>
            s.skill === skill ? { ...s, experience_level: level } : s
        ));
    };

    const canProceedFromStep = (step) => {
        switch (step) {
            case 1: // Basic Info
                return data.professional_title && data.hourly_rate && data.bio && data.bio.length >= 50;
            case 2: // Skills
                return data.broad_category && 
                       data.specific_services.length >= 2 && 
                       data.skills_with_experience.length >= 3;
            default:
                return true;
        }
    };



    const toggleService = (serviceName) => {
        if (data.specific_services.includes(serviceName)) {
            setData('specific_services', data.specific_services.filter(s => s !== serviceName));
        } else {
            setData('specific_services', [...data.specific_services, serviceName]);
        }
    };



    const getStepTitle = () => {
        switch (currentStep) {
            case 0: return 'Welcome to WorkWise!';
            case 1: return 'Tell us about yourself';
            case 2: return 'Your Skills & Services';
            case 3: return 'Showcase Your Work';
            case 4: return 'Review Your Profile';
            default: return 'Onboarding';
        }
    };



    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Gig Worker Onboarding
                </h2>
            }
        >
            <Head title="Gig Worker Onboarding" />
            
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="py-4 sm:py-8 md:py-12 px-4 sm:px-0">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-4 sm:p-6 text-gray-900">
                            {/* Error Summary */}
                            {showErrorSummary && Object.keys(errors).length > 0 && (
                                <ErrorSummary
                                    errors={errors}
                                    errorCodes={errorCodes}
                                    onClose={() => setShowErrorSummary(false)}
                                    onErrorClick={handleErrorClick}
                                    showErrorCodes={true}
                                />
                            )}
                            
                            {/* Progress Bar - Mobile Optimized */}
                            <div className="mb-4 sm:mb-6 md:mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                                        Step {currentStep + 1} of {totalSteps}
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                        {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                                    <div 
                                        className="bg-blue-600 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center px-2">
                                {getStepTitle()}
                            </h3>

                            <form onSubmit={handleSubmit}>
                                {/* Step 0: Welcome / Tutorial - Mobile Optimized */}
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                                            <h4 className="text-lg font-semibold text-blue-900 mb-4">
                                                🎉 Welcome to the WorkWise Community!
                                            </h4>
                                            <p className="text-gray-700 mb-4">
                                                Let's set up your professional profile in just a few steps. This will help employers find and hire you for projects.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Basic Information</p>
                                                        <p className="text-sm text-gray-600">Tell us about your professional background</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Skills & Services</p>
                                                        <p className="text-sm text-gray-600">Select your expertise areas and skill levels</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Portfolio & Review</p>
                                                        <p className="text-sm text-gray-600">Showcase your work and review your profile</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> You can complete ID verification later from your dashboard to start bidding on projects.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <InputLabel htmlFor="professional_title" value="Professional Title *" />
                                            <div className="relative">
                                                <select
                                                    id="professional_title"
                                                    value={data.professional_title}
                                                    className={`mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${
                                                        attemptedProceed && !data.professional_title ? 'border-red-300 bg-red-50' : ''
                                                    } ${
                                                        professionalTitleValidation.isValid ? 'border-green-300 bg-green-50' : ''
                                                    }`}
                                                    onChange={(e) => {
                                                        setData('professional_title', e.target.value);
                                                        professionalTitleValidation.markAsTouched();
                                                    }}
                                                    onBlur={() => professionalTitleValidation.markAsTouched()}
                                                    required
                                                >
                                                    <option value="">Select your professional title</option>
                                                    <option value="Web Developer">Web Developer</option>
                                                    <option value="Mobile Developer">Mobile Developer</option>
                                                    <option value="Frontend Developer">Frontend Developer</option>
                                                    <option value="Backend Developer">Backend Developer</option>
                                                    <option value="Full Stack Developer">Full Stack Developer</option>
                                                    <option value="UI/UX Designer">UI/UX Designer</option>
                                                    <option value="Graphic Designer">Graphic Designer</option>
                                                    <option value="Content Writer">Content Writer</option>
                                                    <option value="Copywriter">Copywriter</option>
                                                    <option value="Digital Marketer">Digital Marketer</option>
                                                    <option value="SEO Specialist">SEO Specialist</option>
                                                    <option value="Social Media Manager">Social Media Manager</option>
                                                    <option value="Video Editor">Video Editor</option>
                                                    <option value="Photographer">Photographer</option>
                                                    <option value="Virtual Assistant">Virtual Assistant</option>
                                                    <option value="Data Analyst">Data Analyst</option>
                                                    <option value="Project Manager">Project Manager</option>
                                                    <option value="Other">Other (specify in bio)</option>
                                                </select>
                                                {professionalTitleValidation.isValid && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <ValidationFeedback
                                                isValid={professionalTitleValidation.isValid}
                                                error={professionalTitleValidation.error}
                                                touched={professionalTitleValidation.touched || attemptedProceed}
                                                showSuccess={true}
                                            />
                                            <InputError message={errors.professional_title} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select the title that best describes your primary skill or role
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="hourly_rate" value="Hourly Rate (PHP) *" />
                                            <div className="relative">
                                                <TextInput
                                                    id="hourly_rate"
                                                    type="number"
                                                    value={data.hourly_rate}
                                                    className={`mt-1 block w-full ${
                                                        attemptedProceed && (!data.hourly_rate || data.hourly_rate < 5 || data.hourly_rate > 10000) 
                                                            ? 'border-red-300 bg-red-50' 
                                                            : ''
                                                    } ${
                                                        hourlyRateValidation.isValid ? 'border-green-300 bg-green-50' : ''
                                                    }`}
                                                    placeholder="500"
                                                    min="5"
                                                    max="10000"
                                                    onChange={(e) => {
                                                        setData('hourly_rate', e.target.value);
                                                        hourlyRateValidation.markAsTouched();
                                                    }}
                                                    onBlur={() => hourlyRateValidation.markAsTouched()}
                                                    required
                                                />
                                                {hourlyRateValidation.isValid && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <ValidationFeedback
                                                isValid={hourlyRateValidation.isValid}
                                                error={hourlyRateValidation.error}
                                                touched={hourlyRateValidation.touched || attemptedProceed}
                                                showSuccess={true}
                                            />
                                            <InputError message={errors.hourly_rate} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Enter a rate between ₱5 and ₱10,000. Consider your experience and market rates.
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="bio" value="Professional Bio *" />
                                            <div className="relative">
                                                <textarea
                                                    id="bio"
                                                    value={data.bio}
                                                    className={`mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${
                                                        attemptedProceed && (!data.bio || data.bio.length < 50) ? 'border-red-300 bg-red-50' : ''
                                                    } ${
                                                        bioValidation.isValid ? 'border-green-300 bg-green-50' : ''
                                                    }`}
                                                    rows="6"
                                                    placeholder="Describe your experience, expertise, what makes you unique, and what you're passionate about..."
                                                    onChange={(e) => {
                                                        setData('bio', e.target.value);
                                                        bioValidation.markAsTouched();
                                                    }}
                                                    onBlur={() => bioValidation.markAsTouched()}
                                                    required
                                                />
                                                {bioValidation.isValid && (
                                                    <div className="absolute right-3 top-3 pointer-events-none">
                                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <ValidationFeedback
                                                isValid={bioValidation.isValid}
                                                error={bioValidation.error}
                                                touched={bioValidation.touched || attemptedProceed}
                                                showSuccess={true}
                                            />
                                            <InputError message={errors.bio} className="mt-2" />
                                            <div className="mt-2">
                                                <CharacterCounter
                                                    current={data.bio.length}
                                                    min={50}
                                                    max={1000}
                                                    showProgress={true}
                                                />
                                            </div>
                                        </div>

                                        <FileUploadInput
                                            name="profile_picture"
                                            label="Profile Photo"
                                            accept="image/*"
                                            maxSize={2}
                                            required={false}
                                            preview="image"
                                            value={files.profile_picture || null}
                                            previewUrl={filePreviews.profile_picture || null}
                                            error={errors.profile_picture}
                                            onChange={(file) => handleFileChange('profile_picture', file)}
                                            helpText="Profiles with photos get 40% more responses! Max 2MB."
                                            loading={processing && files.profile_picture}
                                            uploadProgress={safeGetUploadProgress('profile_picture')}
                                            uploadStatus={safeGetUploadStatus('profile_picture')}
                                        />
                                    </div>
                                )}

                                {/* Step 2: Hierarchical Skills Selection */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <p className="text-gray-600 text-center mb-4">
                                            Select your primary category, then choose the specific services you offer, and finally pick your skills.
                                        </p>

                                        {/* Broad Category Selection */}
                                        <div>
                                            <InputLabel value="1. Select Your Primary Category *" />
                                            <select
                                                value={data.broad_category}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                onChange={(e) => setData('broad_category', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Choose a category --</option>
                                                {availableCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.broad_category} className="mt-2" />
                                        </div>

                                        {/* Specific Services Selection */}
                                        {data.broad_category && (
                                            <div>
                                                <InputLabel value="2. Select Specific Services (Choose 2 or more) *" />
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                                    {availableServices.map((service) => (
                                                        <label
                                                            key={service.id}
                                                            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                                                                data.specific_services.includes(service.name)
                                                                    ? 'bg-blue-100 border-2 border-blue-500'
                                                                    : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.specific_services.includes(service.name)}
                                                                onChange={() => toggleService(service.name)}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm font-medium">{service.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <InputError message={errors.specific_services} className="mt-2" />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Selected: {data.specific_services.length} service(s)
                                                </p>
                                            </div>
                                        )}

                                        {/* Skills Selection with Experience Levels */}
                                        {data.specific_services.length > 0 && availableSkills.length > 0 && (
                                            <div>
                                                <InputLabel value="3. Select Your Skills & Set Experience Level (Choose 3 or more) *" />
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Type to search and add skills quickly, or click on skills below
                                                </p>
                                                
                                                {/* Skill Autocomplete Input */}
                                                <div className="mb-4">
                                                    <SkillAutocompleteInput
                                                        value={skillSearchInput}
                                                        onChange={setSkillSearchInput}
                                                        onSelect={(skill) => {
                                                            if (!data.skills_with_experience.find(s => s.skill === skill)) {
                                                                toggleSkillSelection(skill);
                                                            }
                                                        }}
                                                        skills={availableSkills}
                                                        placeholder="Type to search skills (e.g., 'react', 'php')..."
                                                        maxSuggestions={10}
                                                    />
                                                </div>

                                                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                                                    {availableSkills.map((skill, index) => {
                                                        const skillData = data.skills_with_experience.find(s => s.skill === skill);
                                                        const isSelected = !!skillData;

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`p-3 rounded-md border-2 transition-all ${
                                                                    isSelected
                                                                        ? 'bg-blue-50 border-blue-500'
                                                                        : 'bg-white border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <label className="flex items-center cursor-pointer flex-1">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleSkillSelection(skill)}
                                                                            className="mr-2"
                                                                        />
                                                                        <span className="font-medium text-gray-900">{skill}</span>
                                                                    </label>

                                                                    {isSelected && (
                                                                        <div className="flex gap-2 ml-4">
                                                                            {['beginner', 'intermediate', 'expert'].map((level) => (
                                                                                <button
                                                                                    key={level}
                                                                                    type="button"
                                                                                    onClick={() => updateSkillExperience(skill, level)}
                                                                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                                                                        skillData.experience_level === level
                                                                                            ? 'bg-blue-600 text-white'
                                                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={errors.skills_with_experience} className="mt-2" />
                                                <p className={`text-xs mt-1 font-medium ${
                                                    data.skills_with_experience.length < 3 
                                                        ? 'text-red-600' 
                                                        : 'text-green-600'
                                                }`}>
                                                    Selected: {data.skills_with_experience.length} skill(s) (minimum 3 required)
                                                    {data.skills_with_experience.length < 3 && (
                                                        <span className="block mt-1">⚠️ You need {3 - data.skills_with_experience.length} more skill(s) to proceed</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Portfolio */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <p className="text-gray-600 mb-2">
                                                Showcase your work to stand out (optional)
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Choose one option below or skip to continue
                                            </p>
                                        </div>

                                        {/* Portfolio Type Selection */}
                                        <div className="space-y-4">
                                            <InputLabel value="How would you like to showcase your work?" />
                                            
                                            <div className="space-y-3">
                                                {/* Portfolio Link Option */}
                                                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: portfolioType === 'link' ? '#4F46E5' : '#D1D5DB' }}>
                                                    <input
                                                        type="radio"
                                                        name="portfolio_type"
                                                        value="link"
                                                        checked={portfolioType === 'link'}
                                                        onChange={(e) => {
                                                            setPortfolioType(e.target.value);
                                                            handleFileChange('resume_file', null);
                                                        }}
                                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            <span className="font-medium text-gray-900">Portfolio Website Link</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Share a link to your online portfolio, Behance, Dribbble, GitHub, etc.
                                                        </p>
                                                    </div>
                                                </label>

                                                {/* Resume Upload Option */}
                                                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: portfolioType === 'resume' ? '#4F46E5' : '#D1D5DB' }}>
                                                    <input
                                                        type="radio"
                                                        name="portfolio_type"
                                                        value="resume"
                                                        checked={portfolioType === 'resume'}
                                                        onChange={(e) => {
                                                            setPortfolioType(e.target.value);
                                                            setData('portfolio_link', '');
                                                        }}
                                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="font-medium text-gray-900">Upload Resume</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Upload your resume or CV (PDF, DOC, or DOCX - Max 5MB)
                                                        </p>
                                                    </div>
                                                </label>

                                                {/* Skip Option */}
                                                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: portfolioType === 'none' ? '#4F46E5' : '#D1D5DB' }}>
                                                    <input
                                                        type="radio"
                                                        name="portfolio_type"
                                                        value="none"
                                                        checked={portfolioType === 'none'}
                                                        onChange={(e) => {
                                                            setPortfolioType(e.target.value);
                                                            setData('portfolio_link', '');
                                                            handleFileChange('resume_file', null);
                                                        }}
                                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                            <span className="font-medium text-gray-900">Skip for Now</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            You can add your portfolio later from your profile
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Portfolio Link Input */}
                                        {portfolioType === 'link' && (
                                            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                                <InputLabel htmlFor="portfolio_link" value="Portfolio Website URL *" />
                                                <TextInput
                                                    id="portfolio_link"
                                                    type="url"
                                                    value={data.portfolio_link}
                                                    className="mt-2 block w-full"
                                                    placeholder="https://yourportfolio.com"
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setData('portfolio_link', value);
                                                        
                                                        // Frontend URL validation
                                                        const urlPattern = /^https?:\/\/.+\..+/;
                                                        if (value && !urlPattern.test(value)) {
                                                            e.target.setCustomValidity('Please enter a valid URL starting with http:// or https://');
                                                        } else {
                                                            e.target.setCustomValidity('');
                                                        }
                                                    }}
                                                    required={portfolioType === 'link'}
                                                />
                                                <InputError message={errors.portfolio_link} className="mt-2" />
                                                <p className="text-xs text-indigo-700 mt-2">
                                                    Examples: GitHub profile, Behance portfolio, personal website, LinkedIn, etc.
                                                </p>
                                            </div>
                                        )}

                                        {/* Resume File Upload */}
                                        {portfolioType === 'resume' && (
                                            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                                <FileUploadInput
                                                    name="resume_file"
                                                    label="Upload Your Resume"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    maxSize={5}
                                                    required={portfolioType === 'resume'}
                                                    preview="document"
                                                    value={files.resume_file || null}
                                                    previewUrl={filePreviews.resume_file || null}
                                                    error={errors.resume_file}
                                                    onChange={(file) => handleFileChange('resume_file', file)}
                                                    helpText="Accepted formats: PDF, DOC, DOCX • Maximum size: 5MB"
                                                    loading={processing && files.resume_file}
                                                    uploadProgress={safeGetUploadProgress('resume_file')}
                                                    uploadStatus={safeGetUploadStatus('resume_file')}
                                                />
                                            </div>
                                        )}

                                        {/* Skip Message */}
                                        {portfolioType === 'none' && (
                                            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                                <p className="text-gray-600">
                                                    No problem! You can add your portfolio or resume later from your profile settings.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Profile Preview (renumbered from Step 5) */}
                                {currentStep === 4 && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                                            <h4 className="text-lg font-semibold text-green-900 mb-2">
                                                ✨ You're Almost Done!
                                            </h4>
                                            <p className="text-gray-700">
                                                Review your profile below. Once submitted, you can start exploring opportunities on WorkWise!
                                            </p>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                                            <div>
                                                <h5 className="font-semibold text-gray-900 mb-2">Basic Information</h5>
                                                <div className="text-sm space-y-1 text-gray-700">
                                                    <p><strong>Title:</strong> {data.professional_title || 'Not set'}</p>
                                                    <p><strong>Hourly Rate:</strong> ₱{data.hourly_rate || '0'}/hour</p>
                                                    <p><strong>Bio:</strong> {data.bio ? `${data.bio.substring(0, 100)}...` : 'Not set'}</p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">Skills & Services</h5>
                                                <div className="text-sm space-y-1 text-gray-700">
                                                    <p><strong>Category:</strong> {data.broad_category || 'Not selected'}</p>
                                                    <p><strong>Services:</strong> {data.specific_services.length} selected</p>
                                                    <p><strong>Skills:</strong> {data.skills_with_experience.length} skills with experience levels</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {data.skills_with_experience.slice(0, 10).map((skill, i) => (
                                                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                                {skill.skill} ({skill.experience_level})
                                                            </span>
                                                        ))}
                                                        {data.skills_with_experience.length > 10 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                                +{data.skills_with_experience.length - 10} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">Portfolio</h5>
                                                <div className="text-sm text-gray-700 space-y-1">
                                                    {data.portfolio_link && (
                                                        <p>
                                                            <strong>Portfolio Link:</strong>{' '}
                                                            <a href={data.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                                                {data.portfolio_link}
                                                            </a>
                                                        </p>
                                                    )}
                                                    {data.resume_file && (
                                                        <p>
                                                            <strong>Resume:</strong> {data.resume_file.name}
                                                        </p>
                                                    )}
                                                    {!data.portfolio_link && !data.resume_file && (
                                                        <p className="text-gray-500">No portfolio added</p>
                                                    )}
                                                </div>
                                            </div>


                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                After submission, your profile will be reviewed within 24-48 hours. You'll receive a notification once approved!
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons - Mobile Optimized */}
                                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                                    <div className="order-2 sm:order-1">
                                        {currentStep > 0 && (
                                            <button
                                                type="button"
                                                onClick={prevStep}
                                                className="w-full sm:w-auto min-h-[44px] px-6 py-3 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-base sm:text-sm font-medium"
                                            >
                                                ← Previous
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                                        {currentStep < totalSteps - 1 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="w-full sm:w-auto min-h-[44px] px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base sm:text-sm font-medium"
                                            >
                                                Next →
                                            </button>
                                        ) : (
                                            <PrimaryButton 
                                                disabled={processing}
                                                className="w-full sm:w-auto min-h-[44px] text-base sm:text-sm"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Profile'}
                                            </PrimaryButton>
                                        )}
                                        
                                        {currentStep === 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSkip}
                                                disabled={processing}
                                                className="w-full sm:w-auto min-h-[44px] px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-base sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                Skip for now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

