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
import { startCsrfRefresh, stopCsrfRefresh, refreshCsrfToken } from '@/utils/csrfRefresh';

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

    // Load all skills from taxonomy initially for search
    useEffect(() => {
        if (skillsTaxonomy && skillsTaxonomy.services) {
            const allSkills = [];
            skillsTaxonomy.services.forEach(service => {
                service.categories.forEach(cat => {
                    cat.skills.forEach(skill => {
                        if (!allSkills.includes(skill)) allSkills.push(skill);
                    });
                });
            });
            setAvailableSkills(allSkills);
            setAvailableCategories(skillsTaxonomy.services);
        }
    }, [skillsTaxonomy]);

    const handleAddCustomSkill = async (skillName) => {
        if (!skillName) return;

        // Check for duplicate
        if (data.skills_with_experience.find(s => s.skill.toLowerCase() === skillName.toLowerCase())) {
            warning('Skill already added');
            setSkillSearchInput('');
            return;
        }

        // Add skill
        toggleSkillSelection(skillName);
        setSkillSearchInput('');

        // Try AI correction/normalization
        try {
            const response = await axios.post(route('api.ai-skills.correct'), { skill: skillName });
            if (response.data.corrected && response.data.corrected !== skillName) {
                // Update with corrected version
                setData('skills_with_experience', data.skills_with_experience.map(s =>
                    s.skill === skillName ? { ...s, skill: response.data.corrected } : s
                ));
                success(`Corrected "${skillName}" to "${response.data.corrected}"`);
            }
        } catch (e) {
            console.error('Skill correction failed', e);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowErrorSummary(false);

        // Refresh CSRF token before submit to avoid 419 after long form (e.g. with uploads)
        await refreshCsrfToken();

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

    const handleSkip = async () => {
        await refreshCsrfToken();
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
                    if (!data.bio || data.bio.length < 50) errors.push('Professional bio (minimum 50 characters)');
                    if (data.hourly_rate && (data.hourly_rate < 5 || data.hourly_rate > 10000)) errors.push('Valid hourly rate (₱5-₱10,000)');

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
                return data.professional_title && data.bio && data.bio.length >= 50;
            case 2: // Skills
                return data.skills_with_experience.length >= 3;
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
                                                <TextInput
                                                    id="professional_title"
                                                    value={data.professional_title}
                                                    list="professional-titles"
                                                    className={`mt-1 block w-full ${attemptedProceed && !data.professional_title ? 'border-red-300 bg-red-50' : ''
                                                        } ${professionalTitleValidation.isValid ? 'border-green-300 bg-green-50' : ''
                                                        }`}
                                                    onChange={(e) => {
                                                        setData('professional_title', e.target.value);
                                                        professionalTitleValidation.markAsTouched();
                                                    }}
                                                    onBlur={() => professionalTitleValidation.markAsTouched()}
                                                    placeholder="e.g. Full Stack Web Developer"
                                                    required
                                                />
                                                <datalist id="professional-titles">
                                                    <option value="Web Developer" />
                                                    <option value="Mobile Developer" />
                                                    <option value="Frontend Developer" />
                                                    <option value="Backend Developer" />
                                                    <option value="Full Stack Developer" />
                                                    <option value="UI/UX Designer" />
                                                    <option value="Graphic Designer" />
                                                    <option value="Content Writer" />
                                                    <option value="Copywriter" />
                                                    <option value="Digital Marketer" />
                                                    <option value="SEO Specialist" />
                                                    <option value="Social Media Manager" />
                                                    <option value="Video Editor" />
                                                    <option value="Photographer" />
                                                    <option value="Virtual Assistant" />
                                                    <option value="Data Analyst" />
                                                    <option value="Project Manager" />
                                                </datalist>
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
                                            <InputLabel htmlFor="hourly_rate" value="Expected Hourly Rate (PHP) (Optional)" />
                                            <div className="relative">
                                                <TextInput
                                                    id="hourly_rate"
                                                    type="number"
                                                    value={data.hourly_rate}
                                                    className={`mt-1 block w-full ${attemptedProceed && (!data.hourly_rate || data.hourly_rate < 5 || data.hourly_rate > 10000)
                                                        ? 'border-red-300 bg-red-50'
                                                        : ''
                                                        } ${hourlyRateValidation.isValid ? 'border-green-300 bg-green-50' : ''
                                                        }`}
                                                    placeholder="500"
                                                    min="5"
                                                    max="10000"
                                                    onChange={(e) => {
                                                        setData('hourly_rate', e.target.value);
                                                        hourlyRateValidation.markAsTouched();
                                                    }}
                                                    onBlur={() => hourlyRateValidation.markAsTouched()}
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
                                                    className={`mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${attemptedProceed && (!data.bio || data.bio.length < 50) ? 'border-red-300 bg-red-50' : ''
                                                        } ${bioValidation.isValid ? 'border-green-300 bg-green-50' : ''
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

                                {/* Step 2: Unified Skill Selection */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-4">
                                            <p className="text-gray-600">
                                                Add your expertise areas and set your experience level for each.
                                            </p>
                                        </div>

                                        <div>
                                            <InputLabel value="Search & Add Skills (Choose 3 or more) *" />
                                            <div className="mt-2 flex gap-2">
                                                <div className="flex-1">
                                                    <SkillAutocompleteInput
                                                        value={skillSearchInput}
                                                        onChange={setSkillSearchInput}
                                                        onSelect={(skill) => {
                                                            if (!data.skills_with_experience.find(s => s.skill === skill)) {
                                                                toggleSkillSelection(skill);
                                                                setSkillSearchInput('');
                                                            }
                                                        }}
                                                        skills={availableSkills}
                                                        placeholder="e.g. React, PHP, Graphic Design..."
                                                        maxSuggestions={8}
                                                    />
                                                </div>
                                                <PrimaryButton
                                                    type="button"
                                                    onClick={() => handleAddCustomSkill(skillSearchInput)}
                                                    className="h-10 px-4"
                                                    disabled={!skillSearchInput.trim()}
                                                >
                                                    Add
                                                </PrimaryButton>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Press Enter or click Add to include a skill. AI will suggest improvements!
                                            </p>
                                        </div>

                                        {/* Selected Skills List */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-gray-900 border-b pb-1">Your Selected Skills</h4>
                                            {data.skills_with_experience.length === 0 ? (
                                                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                                                    No skills added yet. Start typing above to add your expertise.
                                                </div>
                                            ) : (
                                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                                    {data.skills_with_experience.map((skillData, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200 shadow-sm transition-all"
                                                        >
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    <span className="font-semibold text-blue-900">{skillData.skill}</span>
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                                                    <div className="flex bg-white rounded-full p-1 border border-blue-100 shadow-inner">
                                                                        {['beginner', 'intermediate', 'expert'].map((level) => (
                                                                            <button
                                                                                key={level}
                                                                                type="button"
                                                                                onClick={() => updateSkillExperience(skillData.skill, level)}
                                                                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full transition-all ${skillData.experience_level === level
                                                                                    ? 'bg-blue-600 text-white shadow-md'
                                                                                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                                                                                    }`}
                                                                            >
                                                                                {level}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleSkillSelection(skillData.skill)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                                        title="Remove skill"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <InputError message={errors.skills_with_experience} className="mt-2" />
                                            <p className={`text-xs mt-1 font-medium ${data.skills_with_experience.length < 3 ? 'text-red-500' : 'text-green-600'}`}>
                                                {data.skills_with_experience.length} skills selected (min 3)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Portfolio */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <p className="text-gray-600 mb-2">
                                                Showcase your work to stand out (Optional)
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                You can provide both a link to your website and upload a resume.
                                            </p>
                                        </div>

                                        {/* Portfolio Link Section */}
                                        <div className="bg-white p-4 border-2 rounded-lg border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-100 p-2 rounded-md">
                                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Portfolio Website</h4>
                                                    <p className="text-xs text-gray-500">Share your Behance, Dribbble, GitHub, or personal site</p>
                                                </div>
                                            </div>
                                            <TextInput
                                                id="portfolio_link"
                                                type="url"
                                                value={data.portfolio_link}
                                                onChange={(e) => setData('portfolio_link', e.target.value)}
                                                className="w-full"
                                                placeholder="https://yourportfolio.com"
                                            />
                                            <InputError message={errors.portfolio_link} className="mt-2" />
                                        </div>

                                        {/* Resume Upload Section */}
                                        <div className="bg-white p-4 border-2 rounded-lg border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-100 p-2 rounded-md">
                                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Resume / CV</h4>
                                                    <p className="text-xs text-gray-500">Upload PDF, DOC, or DOCX (Max 5MB)</p>
                                                </div>
                                            </div>
                                            <FileUploadInput
                                                name="resume_file"
                                                accept=".pdf,.doc,.docx"
                                                maxSize={5}
                                                required={false}
                                                preview="icon"
                                                value={files.resume_file || null}
                                                error={errors.resume_file}
                                                onChange={(file) => handleFileChange('resume_file', file)}
                                                helpText="Professional resumes increase hiring chances by 60%."
                                                loading={processing && files.resume_file}
                                                uploadProgress={safeGetUploadProgress('resume_file')}
                                                uploadStatus={safeGetUploadStatus('resume_file')}
                                            />
                                        </div>
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

                                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 shadow-sm">
                                            <div>
                                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                                                    Professional Info
                                                </h5>
                                                <div className="text-sm space-y-2 text-gray-700 bg-gray-50 p-3 rounded-md">
                                                    <p><strong>Title:</strong> {data.professional_title || 'Not set'}</p>
                                                    <p><strong>Expected Rate:</strong> {data.hourly_rate ? `₱${data.hourly_rate}/hour` : 'Negotiable'}</p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                                                    Your Expertise
                                                </h5>
                                                <div className="text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        {data.skills_with_experience.map((skill, i) => (
                                                            <div key={i} className="flex items-center bg-blue-50 border border-blue-200 rounded-full pl-3 pr-1 py-1">
                                                                <span className="text-blue-900 font-medium mr-2">{skill.skill}</span>
                                                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] uppercase font-bold tracking-tighter">
                                                                    {skill.experience_level}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {data.skills_with_experience.length === 0 && (
                                                            <span className="text-gray-500 italic">No skills added</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                                                    Portfolio & Resume
                                                </h5>
                                                <div className="text-sm text-gray-700 space-y-2 bg-gray-50 p-3 rounded-md">
                                                    <p className="flex items-center gap-2">
                                                        <strong>Link:</strong>
                                                        {data.portfolio_link ? (
                                                            <a href={data.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
                                                                {data.portfolio_link}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">Not provided</span>
                                                        )}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <strong>Resume:</strong>
                                                        {files.resume_file ? (
                                                            <span className="text-green-600 font-medium">{files.resume_file.name}</span>
                                                        ) : (
                                                            <span className="text-gray-400">Not uploaded</span>
                                                        )}
                                                    </p>
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
            </div >
        </AuthenticatedLayout >
    );
}

