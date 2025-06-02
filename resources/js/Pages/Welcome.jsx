import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="WorkWise - AI-Driven Gig Work Marketplace" />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="border-b border-gray-200">
                    <div className="mx-auto" style={{ paddingLeft: '0.45in', paddingRight: '0.45in' }}>
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center">
                                <span className="text-2xl font-bold text-blue-600">WorkWise</span>
                            </Link>
                            <nav className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-sm text-gray-600 hover:text-gray-900"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('role.selection')}
                                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-6 py-12">

                    <main className="text-center">
                        {/* Hero Section */}
                        <div className="mb-16">
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                                Connect. Create. <span className="text-blue-600">Collaborate.</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                                WorkWise is an AI-driven marketplace that connects talented freelancers with
                                innovative companies. Find your next project or discover the perfect talent for your needs.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={route('jobs.index')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
                                >
                                    Browse Jobs
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={route('role.selection')}
                                        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                                    >
                                        Join WorkWise
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="grid md:grid-cols-3 gap-8 mb-16">
                            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Matching</h3>
                                <p className="text-gray-600">
                                    Our AI-powered system matches freelancers with projects based on skills,
                                    experience, and preferences for perfect collaborations.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
                                <p className="text-gray-600">
                                    Built-in escrow system ensures secure transactions and timely payments
                                    for both freelancers and clients.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Talent</h3>
                                <p className="text-gray-600">
                                    Access to a curated network of skilled professionals across various
                                    industries and expertise levels.
                                </p>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Join thousands of freelancers and companies already using WorkWise to build amazing projects together.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={route('role.selection')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </main>

                    <footer className="py-8 text-center text-gray-500">
                        <p>2025 WorkWise. Built with Laravel + React by BITBOSS.</p>
                    </footer>
                </div>
            </div>
        </>
    );
}
