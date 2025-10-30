import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EmployerOnboarding({ user, industries, serviceCategories }) {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const { data, setData, post, processing, errors } = useForm({
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
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employer.onboarding.store'));
    };

    const handleSkip = () => {
        post(route('employer.onboarding.skip'));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
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

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                        currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                        {step}
                                    </div>
                                    {step < totalSteps && (
                                        <div className={`flex-1 h-1 mx-4 ${
                                            currentStep > step ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-sm font-medium text-gray-700">Company Info</span>
                            <span className="text-sm font-medium text-gray-700">Hiring Needs</span>
                            <span className="text-sm font-medium text-gray-700">Verification</span>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                        </label>
                                        <select
                                            value={data.company_size}
                                            onChange={(e) => setData('company_size', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select company size</option>
                                            <option value="individual">Individual / Freelancer</option>
                                            <option value="2-10">2-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="200+">200+ employees</option>
                                        </select>
                                        {errors.company_size && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_size}</p>
                                        )}
                                    </div>

                                    {/* Industry */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Industry <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.industry}
                                            onChange={(e) => setData('industry', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select your industry</option>
                                            {industries.map((industry) => (
                                                <option key={industry} value={industry}>
                                                    {industry}
                                                </option>
                                            ))}
                                        </select>
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                        </label>
                                        <textarea
                                            value={data.company_description}
                                            onChange={(e) => setData('company_description', e.target.value)}
                                            rows="4"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Tell us about your company, what you do, and your typical project needs... (minimum 50 characters)"
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            {data.company_description.length} / 50 minimum characters
                                        </p>
                                        {errors.company_description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.company_description}</p>
                                        )}
                                    </div>

                                    {/* Profile Picture */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Profile Picture / Company Logo (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setData('profile_picture', e.target.files[0])}
                                            className="mt-1 block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-md file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100"
                                        />
                                        {errors.profile_picture && (
                                            <p className="mt-1 text-sm text-red-600">{errors.profile_picture}</p>
                                        )}
                                    </div>
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
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {serviceCategories.map((category) => (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    onClick={() => toggleHiringNeed(category)}
                                                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                                        data.primary_hiring_needs.includes(category)
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.primary_hiring_needs && (
                                            <p className="mt-2 text-sm text-red-600">{errors.primary_hiring_needs}</p>
                                        )}
                                    </div>

                                    {/* Typical Project Budget */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Typical Project Budget <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.typical_project_budget}
                                            onChange={(e) => setData('typical_project_budget', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select typical budget</option>
                                            <option value="under_500">Under $500</option>
                                            <option value="500-2000">$500 - $2,000</option>
                                            <option value="2000-5000">$2,000 - $5,000</option>
                                            <option value="5000-10000">$5,000 - $10,000</option>
                                            <option value="10000+">$10,000+</option>
                                        </select>
                                        {errors.typical_project_budget && (
                                            <p className="mt-1 text-sm text-red-600">{errors.typical_project_budget}</p>
                                        )}
                                    </div>

                                    {/* Typical Project Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Typical Project Duration <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.typical_project_duration}
                                            onChange={(e) => setData('typical_project_duration', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select typical duration</option>
                                            <option value="short_term">Short-term (Less than 1 month)</option>
                                            <option value="medium_term">Medium-term (1-3 months)</option>
                                            <option value="long_term">Long-term (3-6 months)</option>
                                            <option value="ongoing">Ongoing (6+ months)</option>
                                        </select>
                                        {errors.typical_project_duration && (
                                            <p className="mt-1 text-sm text-red-600">{errors.typical_project_duration}</p>
                                        )}
                                    </div>

                                    {/* Preferred Experience Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Preferred Experience Level <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.preferred_experience_level}
                                            onChange={(e) => setData('preferred_experience_level', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select preferred level</option>
                                            <option value="any">Any level</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                        {errors.preferred_experience_level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.preferred_experience_level}</p>
                                        )}
                                    </div>

                                    {/* Hiring Frequency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            How often do you hire? <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.hiring_frequency}
                                            onChange={(e) => setData('hiring_frequency', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Select hiring frequency</option>
                                            <option value="one_time">One-time project</option>
                                            <option value="occasional">Occasional (Few times per year)</option>
                                            <option value="regular">Regular (Monthly)</option>
                                            <option value="ongoing">Ongoing (Multiple projects simultaneously)</option>
                                        </select>
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Business Registration Document (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setData('business_registration_document', e.target.files[0])}
                                            className="mt-1 block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-md file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Upload your business registration, tax certificate, or similar document (PDF, JPG, PNG - Max 5MB)
                                        </p>
                                        {errors.business_registration_document && (
                                            <p className="mt-1 text-sm text-red-600">{errors.business_registration_document}</p>
                                        )}
                                    </div>

                                    {/* Tax ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tax ID / EIN (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tax_id}
                                            onChange={(e) => setData('tax_id', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <div className="mt-8 flex justify-between items-center">
                                <div>
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                        disabled={processing}
                                    >
                                        Skip for now
                                    </button>

                                    {currentStep < totalSteps ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
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

