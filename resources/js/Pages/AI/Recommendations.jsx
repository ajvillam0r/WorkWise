import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function AIRecommendations() {
    const user = usePage().props.auth.user;
    const isFreelancer = user.user_type === 'freelancer';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    🤖 AI Job Recommendations
                </h2>
            }
        >
            <Head title="AI Recommendations" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Coming Soon Banner */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-8 text-white text-center">
                            <div className="text-6xl mb-4">🤖</div>
                            <h1 className="text-3xl font-bold mb-2">AI-Powered Job Matching</h1>
                            <p className="text-xl opacity-90">
                                Smart recommendations tailored for Lapu-Lapu City freelancers
                            </p>
                        </div>
                    </div>

                    {/* Feature Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                        </svg>
                                    </div>
                                    <h3 className="ml-4 text-lg font-semibold text-gray-900">Smart Matching</h3>
                                </div>
                                <p className="text-gray-600">
                                    AI analyzes your skills, experience, and preferences to recommend the perfect jobs for you.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                                        </svg>
                                    </div>
                                    <h3 className="ml-4 text-lg font-semibold text-gray-900">Local Focus</h3>
                                </div>
                                <p className="text-gray-600">
                                    Prioritizes opportunities in Lapu-Lapu City and nearby areas for better work-life balance.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                        </svg>
                                    </div>
                                    <h3 className="ml-4 text-lg font-semibold text-gray-900">Personalized</h3>
                                </div>
                                <p className="text-gray-600">
                                    Learns from your bidding history and preferences to improve recommendations over time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Message */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 text-center">
                            <div className="text-4xl mb-4">🚀</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Our AI recommendation engine is currently in development. 
                                This feature will be available in the next update.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <a
                                    href={route('jobs.index')}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Browse Jobs Now
                                </a>
                                <a
                                    href={route('profile.edit')}
                                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Update Profile
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* How It Will Work */}
                    <div className="mt-8 bg-gray-50 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">How AI Matching Will Work</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">For You:</h4>
                                    <ul className="space-y-2 text-gray-600">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Analyze your skills and experience level</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Consider your location preferences</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Match with your hourly rate expectations</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Learn from your bidding patterns</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Benefits:</h4>
                                    <ul className="space-y-2 text-gray-600">
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span>Save time finding relevant jobs</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span>Higher success rate on proposals</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span>Focus on local opportunities</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span>Grow your freelance career faster</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
