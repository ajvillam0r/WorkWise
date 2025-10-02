import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ChartBarIcon, 
    UserGroupIcon,
    CurrencyDollarIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function ClientPerformance() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/analytics"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Analytics
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Hiring Performance Analysis
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Hiring Performance Analysis" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Coming Soon Message */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-12 text-center">
                            <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-2xl font-medium text-gray-900 mb-2">
                                Advanced Hiring Analytics
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                                Comprehensive hiring performance metrics including freelancer success rates, 
                                budget optimization insights, project ROI analysis, and market intelligence are coming soon.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Gig Worker Analytics</h4>
                                    <p className="text-sm text-gray-600">
                                        Analyze freelancer performance and identify top talent
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <CurrencyDollarIcon className="h-8 w-8 text-green-500 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Budget Optimization</h4>
                                    <p className="text-sm text-gray-600">
                                        Optimize your project budgets and maximize ROI
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <ClockIcon className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Project Timelines</h4>
                                    <p className="text-sm text-gray-600">
                                        Track project delivery times and improve planning
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <Link
                                    href="/analytics"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Return to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
