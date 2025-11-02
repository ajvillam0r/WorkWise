import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    StarIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    SparklesIcon,
    MapPinIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function RecommendedWorkersWidget({ job, workers }) {
    const { post, processing } = useForm();

    if (!workers || workers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recommended Workers
                </h3>
                <div className="text-center py-8">
                    <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                        No well-matched workers available yet
                    </p>
                    <Link
                        href={route('worker-discovery.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        Browse All Workers
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const handleInvite = (workerId) => {
        post(route('worker-discovery.invite', { user: workerId }), {
            data: { job_id: job.id }
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Recommended Workers
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {workers.length} matched
                </span>
            </div>

            {/* Workers List */}
            <div className="space-y-4">
                {workers.map((worker, index) => (
                    <div
                        key={worker.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm">
                                #{index + 1}
                            </div>
                        </div>

                        {/* Worker Info */}
                        <div className="flex-1 min-w-0">
                            {/* Name and Rating */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <Link
                                    href={route('worker-discovery.show', worker.id)}
                                    className="font-semibold text-gray-900 hover:text-blue-600 truncate"
                                >
                                    {worker.first_name} {worker.last_name}
                                </Link>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`w-3 h-3 ${
                                                i < Math.round(worker.rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                    <span className="text-xs text-gray-600 ml-1">
                                        {worker.rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Title and Category */}
                            <p className="text-sm text-gray-600 mb-2 truncate">
                                {worker.professional_title || worker.broad_category}
                            </p>

                            {/* Skills */}
                            {worker.skills_with_experience && worker.skills_with_experience.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                    {worker.skills_with_experience.slice(0, 2).map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {skill.skill}
                                        </span>
                                    ))}
                                    {worker.skills_with_experience.length > 2 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                                            +{worker.skills_with_experience.length - 2}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Location and Rate */}
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <MapPinIcon className="w-3 h-3" />
                                    <span>{worker.city || 'Remote'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CurrencyDollarIcon className="w-3 h-3" />
                                    <span>${worker.hourly_rate}/hr</span>
                                </div>
                            </div>
                        </div>

                        {/* Match Score and Action */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {/* Match Score */}
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                                <SparklesIcon className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">
                                    {Math.round(worker.match_score || 0)}%
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={route('worker-discovery.show', worker.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => handleInvite(worker.id)}
                                    disabled={processing}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Inviting...' : 'Invite'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t">
                <Link
                    href={route('worker-discovery.index', { job_id: job.id })}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                    Browse More Workers
                    <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
