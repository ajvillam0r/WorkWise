import React from 'react';

/**
 * CharacterCounter component displays character count with color feedback
 * @param {number} current - Current character count
 * @param {number} min - Minimum required characters
 * @param {number} max - Maximum allowed characters (optional)
 * @param {boolean} showProgress - Whether to show progress bar
 */
export default function CharacterCounter({ current, min, max = null, showProgress = false }) {
    const percentage = min ? (current / min) * 100 : 0;
    const isValid = current >= min;
    const isNearMax = max && current > max * 0.9;
    const isOverMax = max && current > max;

    // Determine color based on status
    let colorClass = 'text-gray-500';
    let bgColorClass = 'bg-gray-200';
    let progressColorClass = 'bg-gray-400';

    if (isOverMax) {
        colorClass = 'text-red-600 font-semibold';
        bgColorClass = 'bg-red-100';
        progressColorClass = 'bg-red-600';
    } else if (isNearMax) {
        colorClass = 'text-yellow-600 font-medium';
        bgColorClass = 'bg-yellow-100';
        progressColorClass = 'bg-yellow-500';
    } else if (isValid) {
        colorClass = 'text-green-600 font-medium';
        bgColorClass = 'bg-green-100';
        progressColorClass = 'bg-green-600';
    } else if (current > 0) {
        colorClass = 'text-blue-600';
        bgColorClass = 'bg-blue-100';
        progressColorClass = 'bg-blue-500';
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className={colorClass}>
                    {current < min ? (
                        <>
                            {current}/{min} characters
                            <span className="ml-1 text-gray-500">
                                ({min - current} more needed)
                            </span>
                        </>
                    ) : (
                        <>
                            {current} characters
                            {isValid && (
                                <span className="ml-1">
                                    ✓
                                </span>
                            )}
                        </>
                    )}
                </span>
                {max && (
                    <span className={isOverMax ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                        Max: {max}
                    </span>
                )}
            </div>
            
            {showProgress && min && (
                <div className={`w-full h-1.5 rounded-full ${bgColorClass}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColorClass}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}
