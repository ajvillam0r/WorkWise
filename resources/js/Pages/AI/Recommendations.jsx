import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Recommendations({ recommendations, userType }) {
    const isFreelancer = userType === 'freelancer';

    const getMatchScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const renderFreelancerRecommendations = () => (
        <div className="space-y-6">
            {recommendations.map((match, index) => (
                <div key={index} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    <Link 
                                        href={route('jobs.show', match.job.id)}
                                        className="hover:text-blue-600"
                                    >
                                        {match.job.title}
                                    </Link>
                                </h3>
                                <div className="text-sm text-gray-600">
                                    Posted by: <span className="font-medium">
                                        {match.job.employer && `${match.job.employer.first_name} ${match.job.employer.last_name}`}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${getMatchScoreColor(match.score)}`}>
                                    {match.score}%
                                </div>
                                <div className="text-sm text-gray-500">Match Score</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Why this matches you:</h4>
                            <p className="text-gray-600">{match.reason}</p>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Budget: {match.job.budget_display || `₱${match.job.budget_min || 0} - ₱${match.job.budget_max || 0}`}
                                {match.job.budget_type && (
                                    <span className="text-xs text-gray-500 ml-1">({match.job.budget_type})</span>
                                )}
                            </div>
                            <Link
                                href={route('jobs.show', match.job.id)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                            >
                                View Job
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEmployerRecommendations = () => (
        <div className="space-y-8">
            {Object.entries(recommendations).map(([jobId, jobData]) => (
                <div key={jobId} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Matches for: {jobData.job.title}
                        </h3>
                        
                        <div className="space-y-4">
                            {jobData.matches.map((match, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">
                                                {match.freelancer.name}
                                            </h4>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {match.freelancer.expertise_level} • {match.freelancer.experience_years} years experience
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${getMatchScoreColor(match.score)}`}>
                                                {match.score}%
                                            </div>
                                            <div className="text-sm text-gray-500">Match Score</div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                        <p className="text-sm text-gray-600">{match.reason}</p>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Link
                                            href={route('freelancer.profile', match.freelancer.id)}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    🤖 AI-Powered Matches
                </h2>
            }
        >
            <Head title="AI Recommendations" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {isFreelancer ? 'Jobs Matched to Your Profile' : 'Matching Freelancers for Your Jobs'}
                            </h3>
                            <p className="text-gray-600">
                                {isFreelancer 
                                    ? 'Our AI has analyzed your profile and found these jobs that match your skills and experience.'
                                    : 'Here are freelancers that best match the requirements of your open jobs.'
                                }
                            </p>
                        </div>
                    </div>

                    {isFreelancer 
                        ? renderFreelancerRecommendations()
                        : renderEmployerRecommendations()
                    }
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
