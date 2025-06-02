import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function RoleSelection() {
    const [selectedRole, setSelectedRole] = useState(null);
    const { data, setData, post, processing } = useForm({
        user_type: ''
    });

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setData('user_type', role);
    };

    const handleContinue = () => {
        if (selectedRole) {
            post(route('role.store'));
        }
    };

    const roles = [
        {
            type: 'freelancer',
            title: 'I\'m a freelancer',
            subtitle: 'I\'m looking for work',
            description: 'I want to find projects and earn money using my skills',
            icon: (
                <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
            ),
            features: [
                'Browse and apply to projects',
                'Build your portfolio',
                'Get paid securely',
                'Work with global clients'
            ]
        },
        {
            type: 'client',
            title: 'I\'m a client',
            subtitle: 'I\'m looking to hire',
            description: 'I want to hire skilled professionals for my projects',
            icon: (
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                </svg>
            ),
            features: [
                'Post projects and get proposals',
                'Access to skilled freelancers',
                'Manage projects easily',
                'Pay only when satisfied'
            ]
        }
    ];

    return (
        <>
            <Head title="Join WorkWise" />

            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="border-b border-gray-200">
                    <div className="mx-auto" style={{ paddingLeft: '0.45in', paddingRight: '0.45in' }}>
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center">
                                <span className="text-2xl font-bold text-blue-600">WorkWise</span>
                            </Link>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">Already have an account?</span>
                                <Link
                                    href={route('login')}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Log in
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto pt-12 pb-16 px-4">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-normal text-gray-900 mb-4">
                            Join as a freelancer or client
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Choose how you'd like to use WorkWise. You can always switch between roles later.
                        </p>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {roles.map((role) => (
                            <div
                                key={role.type}
                                onClick={() => handleRoleSelect(role.type)}
                                className={`relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-200 hover:shadow-xl ${
                                    selectedRole === role.type
                                        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                {/* Selection indicator */}
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all ${
                                    selectedRole === role.type
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedRole === role.type && (
                                        <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                    )}
                                </div>

                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className={`p-4 rounded-full ${
                                        role.type === 'freelancer' ? 'bg-blue-100' : 'bg-green-100'
                                    }`}>
                                        {role.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {role.title}
                                    </h3>
                                    <p className="text-lg font-medium text-gray-600 mb-3">
                                        {role.subtitle}
                                    </p>
                                    <p className="text-gray-500">
                                        {role.description}
                                    </p>
                                </div>

                                {/* Features */}
                                <div className="space-y-3">
                                    {role.features.map((feature, index) => (
                                        <div key={index} className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                            </svg>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Continue Button */}
                    <div className="text-center">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedRole || processing}
                            className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full transition-all duration-200 ${
                                selectedRole && !processing
                                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12">
                        <p className="text-gray-500">
                            Already have an account?{' '}
                            <Link href={route('login')} className="text-blue-600 hover:text-blue-700 font-medium">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
