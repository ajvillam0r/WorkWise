import React from 'react';
import { Link } from '@inertiajs/react';

export default function ProfileCompletionBanner({ profileCompletion }) {
    // Don't show banner if profile is complete
    if (profileCompletion?.is_complete) {
        return null;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'almost_complete':
                return 'bg-blue-50 border-blue-400 text-blue-700';
            case 'in_progress':
                return 'bg-yellow-50 border-yellow-400 text-yellow-700';
            case 'incomplete':
                return 'bg-orange-50 border-orange-400 text-orange-700';
            default:
                return 'bg-yellow-50 border-yellow-400 text-yellow-700';
        }
    };

    const getIcon = (status) => {
        switch (status) {
            case 'almost_complete':
                return (
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getMessage = () => {
        const percentage = profileCompletion?.percentage || 0;
        const missingCount = profileCompletion?.missing_count || 0;

        if (percentage >= 75) {
            return `Your profile is ${percentage}% complete. Just ${missingCount} more ${missingCount === 1 ? 'field' : 'fields'} to go!`;
        } else if (percentage >= 50) {
            return `Your profile is ${percentage}% complete. Complete ${missingCount} more ${missingCount === 1 ? 'field' : 'fields'} to increase your visibility.`;
        } else {
            return `Complete your profile to increase your visibility to Employers. ${missingCount} ${missingCount === 1 ? 'field' : 'fields'} remaining.`;
        }
    };

    return (
        <div className={`border-l-4 p-4 mb-6 ${getStatusColor(profileCompletion?.status)}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    {getIcon(profileCompletion?.status)}
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm">
                        {getMessage()}
                        {' '}
                        <Link 
                            href="/profile" 
                            className="font-medium underline hover:opacity-80"
                        >
                            Go to profile
                        </Link>
                    </p>
                    {profileCompletion?.missing_fields && profileCompletion.missing_fields.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs font-medium mb-1">Missing:</p>
                            <ul className="text-xs list-disc list-inside space-y-0.5 opacity-90">
                                {profileCompletion.missing_fields.slice(0, 5).map((field, index) => (
                                    <li key={index}>{field}</li>
                                ))}
                                {profileCompletion.missing_fields.length > 5 && (
                                    <li>...and {profileCompletion.missing_fields.length - 5} more</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="ml-auto pl-3">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold">{profileCompletion?.percentage || 0}%</span>
                        <span className="text-xs opacity-75">Complete</span>
                    </div>
                </div>
            </div>
        </div>
    );
}




