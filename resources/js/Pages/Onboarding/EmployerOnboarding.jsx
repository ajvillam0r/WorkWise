import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SkillAutocompleteInput from '@/Components/SkillAutocompleteInput';
import FileUploadInput from '@/Components/FileUploadInput';
import CharacterCounter from '@/Components/CharacterCounter';
import ValidationFeedback from '@/Components/ValidationFeedback';
import ErrorSummary from '@/Components/ErrorSummary';
import { ToastContainer } from '@/Components/Toast';
import useOnboardingForm from '@/Hooks/useOnboardingForm';
import useFieldValidation from '@/Hooks/useFieldValidation';
import useToast from '@/Hooks/useToast';
import { validationRules } from '@/utils/validationRules';
import { getFirstError, ERROR_CODES, SUPPORT_CONTACT } from '@/utils/errorHelpers';

export default function EmployerOnboarding({ user, industries, serviceCategories }) {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    const [categorySearchInput, setCategorySearchInput] = useState('');
    const [touchedFields, setTouchedFields] = useState({});
    const [showErrorSummary, setShowErrorSummary] = useState(false);
    const [errorCodes, setErrorCodes] = useState({});
    const [uploadFailures, setUploadFailures] = useState({});
    
    // Toast notifications
    const { toasts, removeToast, success, error: showError, warning } = useToast();

    // Use custom onboarding form hook with file handling and persistence
    const { 
        data, 
        setData, 
        errors, 
        processing, 
        handleFileChange,
        getFile,
        getPreview,
        post,
        clearStorage,
        getUploadProgress,
        getUploadStatus
    } = useOnboardingForm({
        initialData: {
            // Step 1: Company/Individual Information
            company_name: user?.company_name || '',
            company_size: '',
            industry: '',
            company_website: '',
            company_description: '',
            profile_picture: null,
            
            // Step 2: Hiring Preferences
            primary_hiring_needs: [],
            typical_project_budget: '',
            typical_project_duration: '',
            preferred_experience_level: '',
            hiring_frequency: '',
            
            // Step 3: Verification (optional)
            business_registration_document: null,
            tax_id: '',
        },
        storageKey: `onboarding_employer_${user?.id || 'guest'}`,
        enablePersistence: true
    });

    // Safety fallbacks for upload progress functions (in case of caching issues)
    const safeGetUploadProgress = getUploadProgress || (() => 0);
    const safeGetUploadStatus = getUploadStatus || (() => '');

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowErrorSummary(false);
        
        post(route('employer.onboarding.store'), {
            onError: (errors) => {
                console.error('Employer onboarding submission errors:', errors);
                
                // Determine error codes based on error messages
                const codes = {};
                Object.entries(errors).forEach(([field, message]) => {
                    const msg = Array.isArray(message) ? message[0] : message;
                    
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
                const firstError = getFirstError(errors, {
                    company_name: 1, company_size: 1, industry: 1, company_website: 1, company_description: 1, profile_picture: 1,
                    primary_hiring_needs: 2, typical_project_budget: 2, typical_project_duration: 2, preferred_experience_level: 2, hiring_frequency: 2,
                    business_registration_document: 3, tax_id: 3
                });
                
                if (firstError && firstError.step !== null) {
                    setCurrentStep(firstError.step);
                    showError(
                        `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} in your form`,
                        5000
                    );
                } else {
                    showError('Please review and fix the errors in your form', 5000);
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onSuccess: () => {
                success('Your employer profile has been created successfully!', 6000);
                clearStorage();
            }
        });
    };

    const handleSkip = () => {
        post(route('employer.onboarding.skip'), {
            onSuccess: () => {
                success('You can complete your profile later from your dashboard', 5000);
                clearStorage();
            }
        });
    };
    
    // Handle error click to navigate to field
    const handleErrorClick = (fieldName) => {
        const stepMapping = {
            company_name: 1, company_size: 1, industry: 1, company_website: 1, company_description: 1, profile_picture: 1,
            primary_hiring_needs: 2, typical_project_budget: 2, typical_project_duration: 2, preferred_experience_level: 2, hiring_frequency: 2,
            business_registration_document: 3, tax_id: 3
        };
        
        const firstError = getFirstError({ [fieldName]: errors[fieldName] }, stepMapping);
        if (firstError && firstError.step !== null) {
            setCurrentStep(firstError.step);
            
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        const fileInput = document.querySelector(`input[name="${fieldName}"]`);
        if (fileInput) {
            fileInput.click();
        }
    };

    const nextStep = () => {
        // Mark all fields in current step as touched to show validation errors
        if (currentStep === 1) {
            setTouchedFields(prev => ({
                ...prev,
                company_size: true,
                industry: true,
                company_description: true
            }));
            companyDescriptionValidation.markAsTouched();
        } else if (currentStep === 2) {
            setTouchedFields(prev => ({
                ...prev,
                primary_hiring_needs: true,
                typical_project_budget: true,
                typical_project_duration: true,
                preferred_experience_level: true,
                hiring_frequency: true
            }));
        }

        // Only proceed if validation passes
        if (canProceedToNextStep() && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const toggleHiringNeed = (category) => {
        if (data.primary_hiring_needs.includes(category)) {
            setData('primary_hiring_needs', data.primary_hiring_needs.filter(c => c !== category));
        } else {
            setData('primary_hiring_needs', [...data.primary_hiring_needs, category]);
        }
        markFieldAsTouched('primary_hiring_needs');
    };

    const markFieldAsTouched = (fieldName) => {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    };

    // Validation for company description
    const companyDescriptionValidation = useFieldValidation(
        data.company_description,
        [
            validationRules.required('Company description'),
            validationRules.minLength(50, 'Company description')
        ],
        300
    );

    // Step validation logic
    const isStep1Valid = useMemo(() => {
        return (
            data.company_size !== '' &&
            data.industry !== '' &&
            data.company_description.length >= 50
        );
    }, [data.company_size, data.industry, data.company_description]);

    const isStep2Valid = useMemo(() => {
        return (
            data.primary_hiring_needs.length > 0 &&
            data.typical_project_budget !== '' &&
            data.typical_project_duration !== '' &&
            data.preferred_experience_level !== '' &&
            data.hiring_frequency !== ''
        );
    }, [
        data.primary_hiring_needs,
        data.typical_project_budget,
        data.typical_project_duration,
        data.preferred_experience_level,
        data.hiring_frequency
    ]);

    const canProceedToNextStep = () => {
        if (currentStep === 1) return isStep1Valid;
        if (currentStep === 2) return isStep2Valid;
        return true; // Step 3 is optional
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Complete Your Employer Profile
                </h2>
            }
        >
            <Head title="Employer Onboarding" />
            
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {/* Error Summary */}
                    {showErrorSummary && Object.keys(errors).length > 0 && (
                        <div className="mb-6">
                            <ErrorSummary
                                errors={errors}
                                errorCodes={errorCodes}
                                onClose={() => setShowErrorSummary(false)}
                                onErrorClick={handleErrorClick}
                                showErrorCodes={true}
                            />
                        </div>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-sm sm:text-base ${
                                        currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                        {step}
                                    </div>
                                    {step < totalSteps && (
                                        <div className={`flex-1 h-1 mx-2 sm:mx-4 ${
                                            currentStep > step ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Company Info</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Hiring Needs</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Verification</span>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm sm:rounded-lg p-4 sm:p-6">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Company/Individual Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Tell us about your company or business
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            This information helps gig workers understand who they'll be working with.
                                        </p>
                                    </div>

                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Company Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm min-h-[44px]"
                                            placeholder="Your company name or leave blank if individual"
                                        />
                                        {errors.company_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
                                        )}
                                    </div>

                                    {/* Company Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Company Size <span className="text-red-500">*</span>
                                            {data.company_size && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.company_size}
                                            onChange={(e) => {
                                                setData('company_size', e.target.value);
                                                markFieldAsTouched('company_size');
                                            }}
                                            onBlur={() => markFieldAsTouched('company_size')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.company_size && !data.company_size
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.company_size
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select company size</option>
                                            <option value="individual">Individual</option>
                                            <option value="2-10">2-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="200+">200+ employees</option>
                                        </select>
                                        {touchedFields.company_size && !data.company_size && (
                                            <p className="mt-1 text-sm text-red-600">Please select your company size</p>
                                        )}
                                        {errors.company_size && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_size}</p>
                                        )}
                                    </div>

                                    {/* Industry */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Industry <span className="text-red-500">*</span>
                                            {data.industry && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.industry}
                                            onChange={(e) => {
                                                setData('industry', e.target.value);
                                                markFieldAsTouched('industry');
                                            }}
                                            onBlur={() => markFieldAsTouched('industry')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.industry && !data.industry
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.industry
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select your industry</option>
                                            {industries.map((industry) => (
                                                <option key={industry} value={industry}>
                                                    {industry}
                                                </option>
                                            ))}
                                        </select>
                                        {touchedFields.industry && !data.industry && (
                                            <p className="mt-1 text-sm text-red-600">Please select your industry</p>
                                        )}
                                        {errors.industry && (
                                            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                                        )}
                                    </div>

                                    {/* Company Website */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Company Website (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={data.company_website}
                                            onChange={(e) => setData('company_website', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm min-h-[44px]"
                                            placeholder="https://yourcompany.com"
                                        />
                                        {errors.company_website && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_website}</p>
                                        )}
                                    </div>

                                    {/* Company Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Company Description <span className="text-red-500">*</span>
                                            {data.company_description.length >= 50 && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <textarea
                                            value={data.company_description}
                                            onChange={(e) => {
                                                setData('company_description', e.target.value);
                                                companyDescriptionValidation.markAsTouched();
                                            }}
                                            onBlur={() => companyDescriptionValidation.markAsTouched()}
                                            rows="4"
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm ${
                                                companyDescriptionValidation.touched && !companyDescriptionValidation.isValid
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : companyDescriptionValidation.isValid
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Tell us about your company, what you do, and your typical project needs... (minimum 50 characters)"
                                            required
                                        />
                                        <div className="mt-2">
                                            <CharacterCounter
                                                current={data.company_description.length}
                                                min={50}
                                                max={1000}
                                                showProgress={true}
                                            />
                                        </div>
                                        <ValidationFeedback
                                            isValid={companyDescriptionValidation.isValid}
                                            error={companyDescriptionValidation.error}
                                            touched={companyDescriptionValidation.touched}
                                            showSuccess={true}
                                        />
                                        {errors.company_description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_description}</p>
                                        )}
                                    </div>

                                    {/* Profile Picture */}
                                    <FileUploadInput
                                        name="profile_picture"
                                        label="Profile Picture / Company Logo"
                                        accept="image/*"
                                        maxSize={2}
                                        required={false}
                                        preview="image"
                                        value={getFile('profile_picture')}
                                        previewUrl={getPreview('profile_picture')}
                                        error={errors.profile_picture}
                                        onChange={(file) => handleFileChange('profile_picture', file)}
                                        helpText="Upload a professional photo or your company logo (Max 2MB)"
                                        loading={processing && getFile('profile_picture')}
                                        uploadProgress={safeGetUploadProgress('profile_picture')}
                                        uploadStatus={safeGetUploadStatus('profile_picture')}
                                    />
                                </div>
                            )}

                            {/* Step 2: Hiring Preferences */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            What are your hiring needs?
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Help us match you with the right gig workers by telling us about your typical projects.
                                        </p>
                                    </div>

                                    {/* Primary Hiring Needs */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            What services do you typically need? <span className="text-red-500">*</span>
                                            {data.primary_hiring_needs.length > 0 && (
                                                <span className="ml-2 text-green-600 text-xs">
                                                    ✓ {data.primary_hiring_needs.length} selected
                                                </span>
                                            )}
                                        </label>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Type to search and add services quickly, or click on categories below
                                        </p>
                                        
                                        {/* Service Category Autocomplete Input */}
                                        <div className="mb-4">
                                            <SkillAutocompleteInput
                                                value={categorySearchInput}
                                                onChange={setCategorySearchInput}
                                                onSelect={(category) => {
                                                    if (!data.primary_hiring_needs.includes(category)) {
                                                        toggleHiringNeed(category);
                                                    }
                                                }}
                                                skills={serviceCategories}
                                                placeholder="Type to search services (e.g., 'web development', 'design')..."
                                                maxSuggestions={10}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {serviceCategories.map((category) => (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    onClick={() => toggleHiringNeed(category)}
                                                    className={`px-4 py-3 sm:py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                                                        data.primary_hiring_needs.includes(category)
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm scale-105'
                                                            : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-50'
                                                    }`}
                                                >
                                                    {data.primary_hiring_needs.includes(category) && (
                                                        <span className="mr-1">✓</span>
                                                    )}
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                        {touchedFields.primary_hiring_needs && data.primary_hiring_needs.length === 0 && (
                                            <p className="mt-2 text-sm text-red-600">Please select at least one service category</p>
                                        )}
                                        {errors.primary_hiring_needs && (
                                            <p className="mt-2 text-sm text-red-600">{errors.primary_hiring_needs}</p>
                                        )}
                                    </div>

                                    {/* Typical Project Budget */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Typical Project Budget <span className="text-red-500">*</span>
                                            {data.typical_project_budget && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.typical_project_budget}
                                            onChange={(e) => {
                                                setData('typical_project_budget', e.target.value);
                                                markFieldAsTouched('typical_project_budget');
                                            }}
                                            onBlur={() => markFieldAsTouched('typical_project_budget')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.typical_project_budget && !data.typical_project_budget
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.typical_project_budget
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select typical budget</option>
                                            <option value="under_500">Under ₱500</option>
                                            <option value="500-2000">₱500 - ₱2,000</option>
                                            <option value="2000-5000">₱2,000 - ₱5,000</option>
                                            <option value="5000-10000">₱5,000 - ₱10,000</option>
                                            <option value="10000+">₱10,000+</option>
                                        </select>
                                        {touchedFields.typical_project_budget && !data.typical_project_budget && (
                                            <p className="mt-1 text-sm text-red-600">Please select your typical project budget</p>
                                        )}
                                        {errors.typical_project_budget && (
                                            <p className="mt-1 text-sm text-red-600">{errors.typical_project_budget}</p>
                                        )}
                                    </div>

                                    {/* Typical Project Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Typical Project Duration <span className="text-red-500">*</span>
                                            {data.typical_project_duration && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.typical_project_duration}
                                            onChange={(e) => {
                                                setData('typical_project_duration', e.target.value);
                                                markFieldAsTouched('typical_project_duration');
                                            }}
                                            onBlur={() => markFieldAsTouched('typical_project_duration')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.typical_project_duration && !data.typical_project_duration
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.typical_project_duration
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select typical duration</option>
                                            <option value="short_term">Short-term (Less than 1 month)</option>
                                            <option value="medium_term">Medium-term (1-3 months)</option>
                                            <option value="long_term">Long-term (3-6 months)</option>
                                            <option value="ongoing">Ongoing (6+ months)</option>
                                        </select>
                                        {touchedFields.typical_project_duration && !data.typical_project_duration && (
                                            <p className="mt-1 text-sm text-red-600">Please select your typical project duration</p>
                                        )}
                                        {errors.typical_project_duration && (
                                            <p className="mt-1 text-sm text-red-600">{errors.typical_project_duration}</p>
                                        )}
                                    </div>

                                    {/* Preferred Experience Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Preferred Experience Level <span className="text-red-500">*</span>
                                            {data.preferred_experience_level && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.preferred_experience_level}
                                            onChange={(e) => {
                                                setData('preferred_experience_level', e.target.value);
                                                markFieldAsTouched('preferred_experience_level');
                                            }}
                                            onBlur={() => markFieldAsTouched('preferred_experience_level')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.preferred_experience_level && !data.preferred_experience_level
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.preferred_experience_level
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select preferred level</option>
                                            <option value="any">Any level</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                        {touchedFields.preferred_experience_level && !data.preferred_experience_level && (
                                            <p className="mt-1 text-sm text-red-600">Please select your preferred experience level</p>
                                        )}
                                        {errors.preferred_experience_level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.preferred_experience_level}</p>
                                        )}
                                    </div>

                                    {/* Hiring Frequency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            How often do you hire? <span className="text-red-500">*</span>
                                            {data.hiring_frequency && (
                                                <span className="ml-2 text-green-600 text-xs">✓</span>
                                            )}
                                        </label>
                                        <select
                                            value={data.hiring_frequency}
                                            onChange={(e) => {
                                                setData('hiring_frequency', e.target.value);
                                                markFieldAsTouched('hiring_frequency');
                                            }}
                                            onBlur={() => markFieldAsTouched('hiring_frequency')}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 text-base sm:text-sm min-h-[44px] ${
                                                touchedFields.hiring_frequency && !data.hiring_frequency
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : data.hiring_frequency
                                                    ? 'border-green-300 focus:border-green-500'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            required
                                        >
                                            <option value="">Select hiring frequency</option>
                                            <option value="one_time">One-time project</option>
                                            <option value="occasional">Occasional (Few times per year)</option>
                                            <option value="regular">Regular (Monthly)</option>
                                            <option value="ongoing">Ongoing (Multiple projects simultaneously)</option>
                                        </select>
                                        {touchedFields.hiring_frequency && !data.hiring_frequency && (
                                            <p className="mt-1 text-sm text-red-600">Please select your hiring frequency</p>
                                        )}
                                        {errors.hiring_frequency && (
                                            <p className="mt-1 text-sm text-red-600">{errors.hiring_frequency}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Verification */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Verification (Optional)
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Adding verification documents increases trust with gig workers but is optional.
                                        </p>
                                    </div>

                                    {/* Business Registration Document */}
                                    <FileUploadInput
                                        name="business_registration_document"
                                        label="Business Registration Document"
                                        accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                                        maxSize={5}
                                        required={false}
                                        preview="document"
                                        value={getFile('business_registration_document')}
                                        previewUrl={getPreview('business_registration_document')}
                                        error={errors.business_registration_document}
                                        onChange={(file) => handleFileChange('business_registration_document', file)}
                                        helpText="Upload your business registration, tax certificate, or similar document (PDF, JPG, PNG - Max 5MB)"
                                        loading={processing && getFile('business_registration_document')}
                                        uploadProgress={safeGetUploadProgress('business_registration_document')}
                                        uploadStatus={safeGetUploadStatus('business_registration_document')}
                                    />

                                    {/* Tax ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tax ID / EIN (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tax_id}
                                            onChange={(e) => setData('tax_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm min-h-[44px]"
                                            placeholder="Your tax identification number"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Used for invoicing and tax documentation
                                        </p>
                                        {errors.tax_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>
                                        )}
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">
                                                    Ready to start hiring!
                                                </h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>
                                                        You're almost done! Once you complete your profile, you'll be able to:
                                                    </p>
                                                    <ul className="list-disc ml-5 mt-2 space-y-1">
                                                        <li>Post unlimited job listings</li>
                                                        <li>Receive proposals from qualified gig workers</li>
                                                        <li>Access AI-powered candidate matching</li>
                                                        <li>Manage projects and payments securely</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                                <div>
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px] text-base sm:text-sm"
                                        >
                                            Previous
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-800 min-h-[44px] text-base sm:text-sm"
                                        disabled={processing}
                                    >
                                        Skip for now
                                    </button>

                                    {currentStep < totalSteps ? (
                                        <div className="flex flex-col items-stretch sm:items-end gap-2">
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={!canProceedToNextStep()}
                                                className={`px-6 py-3 sm:py-2 rounded-md transition-all min-h-[44px] text-base sm:text-sm ${
                                                    canProceedToNextStep()
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                Next
                                            </button>
                                            {!canProceedToNextStep() && (
                                                <p className="text-xs text-red-600 text-center sm:text-right">
                                                    Please complete all required fields
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-3 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 min-h-[44px] text-base sm:text-sm"
                                        >
                                            {processing ? 'Completing...' : 'Complete Profile'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

