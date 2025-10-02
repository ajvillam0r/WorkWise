import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';

export default function ClientOnboarding({ user }) {
    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        work_type_needed: '',
        budget_range: '',
        project_intent: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employer.onboarding'));
    };

    const handleSkip = () => {
        post(route('employer.onboarding.skip'));
    };

    const workTypes = [
        'Web Development',
        'Mobile App Development',
        'UI/UX Design',
        'Graphic Design',
        'Content Writing',
        'Digital Marketing',
        'Data Analysis',
        'Video Editing',
        'Translation',
        'Virtual Assistant',
        'Other'
    ];

    const budgetRanges = [
        'Less than ₱500',
        '₱500 - ₱1,000',
        '₱1,000 - ₱5,000',
        '₱5,000 - ₱10,000',
        '₱10,000 - ₱25,000',
        '₱25,000+',
        'Ongoing/Hourly work'
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Employer Onboarding" />

            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                    Welcome to WorkWise!
                                </h1>
                                <p className="text-lg text-gray-600 mb-2">
                                    Let's set up your employer profile to help you find the perfect talent
                                </p>
                                <p className="text-sm text-gray-500">
                                    This information helps us recommend the best gig workers for your projects
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name (Optional)
                                    </label>
                                    <input
                                        id="company_name"
                                        type="text"
                                        name="company_name"
                                        value={data.company_name}
                                        placeholder="Your company or organization name"
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <InputError message={errors.company_name} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="work_type_needed" className="block text-sm font-medium text-gray-700 mb-1">
                                        What type of work do you need help with?
                                    </label>
                                    <select
                                        id="work_type_needed"
                                        name="work_type_needed"
                                        value={data.work_type_needed}
                                        onChange={(e) => setData('work_type_needed', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select work type</option>
                                        {workTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.work_type_needed} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700 mb-1">
                                        What's your budget range?
                                    </label>
                                    <select
                                        id="budget_range"
                                        name="budget_range"
                                        value={data.budget_range}
                                        onChange={(e) => setData('budget_range', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select budget range</option>
                                        {budgetRanges.map((range) => (
                                            <option key={range} value={range}>
                                                {range}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.budget_range} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="project_intent" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tell us about your project
                                    </label>
                                    <textarea
                                        id="project_intent"
                                        name="project_intent"
                                        value={data.project_intent}
                                        rows="4"
                                        placeholder="Describe what you're looking to accomplish, your timeline, and any specific requirements..."
                                        onChange={(e) => setData('project_intent', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        required
                                    />
                                    <InputError message={errors.project_intent} className="mt-1" />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Minimum 20 characters ({data.project_intent.length}/20)
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                What happens next?
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>You can immediately start posting projects</li>
                                                    <li>Browse and contact gig workers in Lapu-Lapu City</li>
                                                    <li>Receive proposals from qualified local professionals</li>
                                                    <li>Manage your projects from your dashboard</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-full transition-colors"
                                    >
                                        {processing ? 'Setting up...' : 'Complete Setup'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        disabled={processing}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Skip for now
                                    </button>
                                </div>

                                <div className="text-center pt-4">
                                    <p className="text-xs text-gray-500">
                                        You can always update this information later in your profile settings
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
