import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ClientOnboarding({ user }) {
    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        work_type_needed: '',
        budget_range: '',
        project_intent: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.onboarding'));
    };

    const handleSkip = () => {
        post(route('client.onboarding.skip'));
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
        'Less than $500',
        '$500 - $1,000',
        '$1,000 - $5,000',
        '$5,000 - $10,000',
        '$10,000 - $25,000',
        '$25,000+',
        'Ongoing/Hourly work'
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Welcome to WorkWise!
                </h2>
            }
        >
            <Head title="Client Onboarding" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                    Let's get you started!
                                </h3>
                                <p className="text-lg text-gray-600 mb-2">
                                    Tell us about your business and project needs
                                </p>
                                <p className="text-sm text-gray-500">
                                    This information helps us recommend the best freelancers for your projects
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="company_name" value="Company Name (Optional)" />
                                    <TextInput
                                        id="company_name"
                                        type="text"
                                        name="company_name"
                                        value={data.company_name}
                                        className="mt-1 block w-full"
                                        placeholder="Your company or organization name"
                                        onChange={(e) => setData('company_name', e.target.value)}
                                    />
                                    <InputError message={errors.company_name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="work_type_needed" value="What type of work do you need help with?" />
                                    <select
                                        id="work_type_needed"
                                        name="work_type_needed"
                                        value={data.work_type_needed}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('work_type_needed', e.target.value)}
                                        required
                                    >
                                        <option value="">Select work type</option>
                                        {workTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.work_type_needed} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="budget_range" value="What's your budget range?" />
                                    <select
                                        id="budget_range"
                                        name="budget_range"
                                        value={data.budget_range}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('budget_range', e.target.value)}
                                        required
                                    >
                                        <option value="">Select budget range</option>
                                        {budgetRanges.map((range) => (
                                            <option key={range} value={range}>
                                                {range}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.budget_range} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="project_intent" value="Tell us about your project" />
                                    <textarea
                                        id="project_intent"
                                        name="project_intent"
                                        value={data.project_intent}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        rows="4"
                                        placeholder="Describe what you're looking to accomplish, your timeline, and any specific requirements..."
                                        onChange={(e) => setData('project_intent', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.project_intent} className="mt-2" />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Minimum 20 characters ({data.project_intent.length}/20)
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
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
                                                    <li>Browse and contact freelancers</li>
                                                    <li>Receive proposals from qualified professionals</li>
                                                    <li>Manage your projects from your dashboard</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    <PrimaryButton 
                                        className="flex-1 justify-center"
                                        disabled={processing}
                                    >
                                        {processing ? 'Setting up...' : 'Complete Setup'}
                                    </PrimaryButton>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        disabled={processing}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        Skip for now
                                    </button>
                                </div>

                                <div className="text-center">
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
