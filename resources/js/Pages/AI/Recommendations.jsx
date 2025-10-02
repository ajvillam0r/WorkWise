import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Recommendations({ recommendations, userType, hasError }) {
    const isGigWorker = userType === 'gig_worker';

    const getMatchScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 30) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const renderFreelancerRecommendations = () => {
        if (!recommendations || recommendations.length === 0) {
            return (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Job Matches Found
                        </h3>
                        <p className="text-gray-600">
                            We couldn't find any jobs matching your current skills and experience.
                            Try updating your profile with more skills or check back later for new opportunities.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {recommendations.map((match, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-l-4 border-blue-500">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">💼</span>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            <Link
                                                href={route('jobs.show', match.job.id)}
                                                className="hover:text-blue-600 transition-colors"
                                            >
                                                {match.job.title}
                                            </Link>
                                        </h3>
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-4">
                                        <span>
                                            Posted by: <span className="font-medium">
                                                {match.job.employer && `${match.job.employer.first_name} ${match.job.employer.last_name}`}
                                            </span>
                                        </span>
                                        {match.job.experience_level && (
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {match.job.experience_level.charAt(0).toUpperCase() + match.job.experience_level.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-bold ${getMatchScoreColor(match.score)}`}>
                                        {match.score}%
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {match.score >= 80 ? '🎯 Excellent' :
                                         match.score >= 60 ? '👍 Good' :
                                         match.score >= 40 ? '✓ Fair' : '⚠️ Weak'} Match
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <span>🤖</span> AI Analysis - Why this matches your profile:
                                </h4>
                                <p className="text-gray-700 leading-relaxed">{match.reason}</p>
                            </div>

                            {match.job.required_skills && match.job.required_skills.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Required Skills:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {match.job.required_skills.map((skill, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Budget:</span> {match.job.budget_display || `₱${match.job.budget_min || 0} - ₱${match.job.budget_max || 0}`}
                                    {match.job.budget_type && (
                                        <span className="text-xs text-gray-500 ml-1">({match.job.budget_type})</span>
                                    )}
                                </div>
                                <Link
                                    href={route('jobs.show', match.job.id)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    View Job Details →
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderEmployerRecommendations = () => (
        <div className="space-y-8">
            {Object.entries(recommendations).map(([jobId, jobData]) => (
                <div key={jobId} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Matches for: {jobData.job.title}
                        </h3>
                        
                        <div className="space-y-4">
                            {jobData.matches && jobData.matches.length > 0 ? (
                                (() => {
                                    const goodMatches = jobData.matches.filter(match => match.score >= 20);
                                    const fairMatches = jobData.matches.filter(match => match.score >= 10 && match.score < 20);
                                    const basicMatches = jobData.matches.filter(match => match.score > 0 && match.score < 10);

                                    return (
                                        <>
                                            {goodMatches.length > 0 && (
                                                <>
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-green-700 mb-2">🎯 Excellent Matches ({goodMatches.length})</h4>
                                                    </div>
                                                    {goodMatches.map((match, index) => (
                                                        <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {match.gig_worker.first_name} {match.gig_worker.last_name}
                                                                    </h4>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        {match.gig_worker.experience_level || 'Not specified'} • {match.gig_worker.professional_title || 'Gig Worker'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-2xl font-bold text-green-600`}>
                                                                        {match.score}%
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">Match Score</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-green-100 rounded-lg p-3 mt-3">
                                                                <p className="text-sm text-gray-700">{match.reason}</p>
                                                            </div>

                                                            <div className="mt-4 flex justify-end">
                                                                <button
                                                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 opacity-50 cursor-not-allowed"
                                                                    disabled
                                                                >
                                                                    View Profile (Coming Soon)
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {fairMatches.length > 0 && (
                                                <>
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-blue-700 mb-2">👍 Good Matches ({fairMatches.length})</h4>
                                                        <p className="text-xs text-gray-600">These gig workers have relevant skills and could be a good fit with some training.</p>
                                                    </div>
                                                    {fairMatches.map((match, index) => (
                                                        <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {match.gig_worker.first_name} {match.gig_worker.last_name}
                                                                    </h4>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        {match.gig_worker.experience_level || 'Not specified'} • {match.gig_worker.professional_title || 'Gig Worker'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-2xl font-bold text-blue-600`}>
                                                                        {match.score}%
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">Match Score</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-blue-100 rounded-lg p-3 mt-3">
                                                                <p className="text-sm text-gray-700">{match.reason}</p>
                                                            </div>

                                                            <div className="mt-4 flex justify-end">
                                                                <button
                                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 opacity-50 cursor-not-allowed"
                                                                    disabled
                                                                >
                                                                    View Profile (Coming Soon)
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {basicMatches.length > 0 && (
                                                <>
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-yellow-700 mb-2">🤔 Potential Matches ({basicMatches.length})</h4>
                                                        <p className="text-xs text-gray-600">These gig workers show some relevant background and could develop the needed skills.</p>
                                                    </div>
                                                    {basicMatches.map((match, index) => (
                                                        <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {match.gig_worker.name}
                                                                    </h4>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        {match.gig_worker.expertise_level} • {match.gig_worker.experience_years} years experience
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-2xl font-bold text-yellow-600`}>
                                                                        {match.score}%
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">Match Score</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-yellow-100 rounded-lg p-3 mt-3">
                                                                <p className="text-sm text-gray-700">{match.reason}</p>
                                                            </div>

                                                            <div className="mt-4 flex justify-end">
                                                                <button
                                                                    className="inline-flex items-center px-4 py-2 bg-yellow-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-700 opacity-50 cursor-not-allowed"
                                                                    disabled
                                                                >
                                                                    View Profile (Coming Soon)
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {goodMatches.length === 0 && fairMatches.length === 0 && basicMatches.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p>No matching gig workers found for this job.</p>
                                                    <p className="text-sm mt-2">Try adjusting your job requirements or wait for more gig workers to join the platform.</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No matching gig workers found for this job.</p>
                                    <p className="text-sm mt-2">Try adjusting your job requirements or wait for more gig workers to join the platform.</p>
                                </div>
                            )}
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden shadow-lg sm:rounded-lg mb-6">
                        <div className="p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">🤖</span>
                                <h3 className="text-xl font-bold">
                                    {isGigWorker ? 'AI-Powered Job Recommendations' : 'AI-Matched Gig Workers'}
                                </h3>
                            </div>
                            <p className="text-blue-100">
                                {isGigWorker
                                    ? 'Our AI analyzes your skills, experience, and professional background to find the best job opportunities for you. Match scores are based on skill compatibility and experience alignment.'
                                    : 'Our AI evaluates gig worker profiles against your job requirements, focusing on skills match and experience level to find the best candidates for your projects.'
                                }
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    80-100%: Excellent Match
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    60-79%: Good Match
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                    40-59%: Fair Match
                                </span>
                            </div>
                        </div>
                    </div>

                    {hasError ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Recommendations Temporarily Unavailable
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    We're experiencing high demand. Please try again in a few moments.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : (
                        isGigWorker
                            ? renderFreelancerRecommendations()
                            : renderEmployerRecommendations()
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
