import { Head } from '@inertiajs/react';

export default function TestDashboard() {
    console.log('TestDashboard component loading...');
    
    return (
        <div className="min-h-screen bg-gray-100">
            <Head title="Test Dashboard" />
            
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                🎉 Test Dashboard Working!
                            </h1>
                            <p className="text-gray-600 mb-4">
                                This is a simple test to verify that React components are loading properly.
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-800">✅ Success!</h3>
                                <p className="text-green-700">
                                    If you can see this page, then:
                                </p>
                                <ul className="list-disc list-inside text-green-700 mt-2">
                                    <li>React is working</li>
                                    <li>Inertia.js is working</li>
                                    <li>Vite is compiling correctly</li>
                                    <li>Laravel routes are working</li>
                                </ul>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Quick Links:</h3>
                                <div className="space-x-4">
                                    <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
                                    <a href="/register" className="text-blue-600 hover:text-blue-800">Register</a>
                                    <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
