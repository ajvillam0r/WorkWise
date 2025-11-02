import React from 'react';
import {
    CheckCircleIcon,
    ExclamationIcon,
    XCircleIcon,
    SparklesIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function MatchQualityWidget({ job, matchScore, matchFactors }) {
    // Color coding based on match score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-50';
        if (score >= 50) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    const getScoreBorderColor = (score) => {
        if (score >= 80) return 'border-green-200';
        if (score >= 50) return 'border-yellow-200';
        return 'border-red-200';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent Match';
        if (score >= 60) return 'Good Match';
        if (score >= 40) return 'Fair Match';
        return 'Poor Match';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return CheckCircleIcon;
        if (score >= 50) return ExclamationIcon;
        return XCircleIcon;
    };

    const ScoreIcon = getScoreIcon(matchScore);
    const circleRadius = 45;
    const circumference = 2 * Math.PI * circleRadius;
    const strokeDashoffset = circumference - (matchScore / 100) * circumference;

    return (
        <div className={`rounded-lg border-2 p-6 ${getScoreBgColor(matchScore)} ${getScoreBorderColor(matchScore)}`}>
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {job.title}
                </h3>
                <p className="text-sm text-gray-600">
                    Match Quality Assessment
                </p>
            </div>

            {/* Score Circle with Progress */}
            <div className="flex items-center gap-6 mb-6">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={circleRadius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-gray-300"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={circleRadius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`${getScoreColor(matchScore)} transition-all duration-500`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-3xl font-bold ${getScoreColor(matchScore)}`}>
                            {Math.round(matchScore)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Match</div>
                    </div>
                </div>

                {/* Score Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <ScoreIcon className={`w-6 h-6 ${getScoreColor(matchScore)}`} />
                        <span className={`text-lg font-semibold ${getScoreColor(matchScore)}`}>
                            {getScoreLabel(matchScore)}
                        </span>
                    </div>
                    
                    {matchScore >= 80 && (
                        <p className="text-sm text-gray-700 mb-3">
                            Excellent match! You have many well-matched candidates available.
                        </p>
                    )}
                    {matchScore >= 50 && matchScore < 80 && (
                        <p className="text-sm text-gray-700 mb-3">
                            Good match quality. Some well-suited candidates available.
                        </p>
                    )}
                    {matchScore < 50 && (
                        <p className="text-sm text-gray-700 mb-3">
                            Limited matches. Consider adjusting requirements or waiting for better candidates.
                        </p>
                    )}

                    <Link
                        href={route('worker-discovery.index')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                        Browse Workers
                        <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Matching Factors */}
            {matchFactors && (
                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Matching Factors
                    </h4>
                    <div className="space-y-3">
                        {/* Skill Match */}
                        {matchFactors.skills !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700">Skills Match</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {Math.round(matchFactors.skills)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${matchFactors.skills}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Experience Match */}
                        {matchFactors.experience !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700">Experience Level Match</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {Math.round(matchFactors.experience)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${matchFactors.experience}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Category Match */}
                        {matchFactors.category !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700">Category Match</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {Math.round(matchFactors.category)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${matchFactors.category}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Budget Compatibility */}
                        {matchFactors.budget !== undefined && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700">Budget Compatible</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {Math.round(matchFactors.budget)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${matchFactors.budget}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Job Details */}
            <div className="border-t mt-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Budget</span>
                        <p className="font-medium text-gray-900">
                            ${job.budget_min} - ${job.budget_max}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Duration</span>
                        <p className="font-medium text-gray-900">
                            {job.estimated_duration_days} days
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Status</span>
                        <p className="font-medium text-gray-900 capitalize">
                            {job.status}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Proposals</span>
                        <p className="font-medium text-gray-900">
                            {job.proposals_count || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
