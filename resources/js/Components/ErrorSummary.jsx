import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * ErrorSummary Component
 * 
 * Displays a summary of multiple errors at the top of a form
 * Distinguishes between client-side and server-side errors
 * Provides navigation to error fields
 * 
 * @param {Object} props
 * @param {Object} props.errors - Error object with field names as keys
 * @param {Object} props.errorCodes - Optional error codes for each field
 * @param {Function} props.onClose - Callback when summary is dismissed
 * @param {Function} props.onErrorClick - Callback when an error is clicked (for navigation)
 * @param {boolean} props.showErrorCodes - Whether to show error codes
 */
export default function ErrorSummary({ 
    errors = {}, 
    errorCodes = {}, 
    onClose, 
    onErrorClick,
    showErrorCodes = false 
}) {
    const errorEntries = Object.entries(errors);
    
    if (errorEntries.length === 0) {
        return null;
    }

    const getErrorType = (fieldName) => {
        const code = errorCodes[fieldName];
        if (!code) return 'server';
        
        // Client-side error codes
        const clientErrorCodes = [
            'FILE_TOO_LARGE',
            'INVALID_FILE_TYPE',
            'REQUIRED_FIELD_MISSING',
            'VALIDATION_FAILED',
            'MIN_LENGTH',
            'MAX_LENGTH',
            'MIN_VALUE',
            'MAX_VALUE',
            'INVALID_FORMAT'
        ];
        
        return clientErrorCodes.includes(code) ? 'client' : 'server';
    };

    const formatFieldName = (fieldName) => {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const handleErrorClick = (fieldName) => {
        if (onErrorClick) {
            onErrorClick(fieldName);
        }
    };

    return (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                        {errorEntries.length === 1 
                            ? 'There is 1 error that needs your attention' 
                            : `There are ${errorEntries.length} errors that need your attention`}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                            {errorEntries.map(([fieldName, errorMessage]) => {
                                const errorType = getErrorType(fieldName);
                                const errorCode = errorCodes[fieldName];
                                
                                return (
                                    <li key={fieldName} className="flex items-start">
                                        <span className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => handleErrorClick(fieldName)}
                                                className="hover:underline text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                                            >
                                                <span className="font-medium">{formatFieldName(fieldName)}:</span>{' '}
                                                {Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}
                                            </button>
                                            {showErrorCodes && errorCode && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    {errorCode}
                                                </span>
                                            )}
                                            <span className={`ml-2 text-xs ${
                                                errorType === 'client' ? 'text-orange-600' : 'text-red-600'
                                            }`}>
                                                ({errorType === 'client' ? 'Client-side' : 'Server-side'})
                                            </span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    {errorEntries.some(([fieldName]) => getErrorType(fieldName) === 'server') && (
                        <div className="mt-3 p-3 bg-red-100 rounded-md">
                            <p className="text-xs text-red-800 mb-2">
                                <strong>Server Error:</strong> These errors occurred on our server. Please try again.
                            </p>
                            <p className="text-xs text-red-700">
                                If the problem persists, contact our support team:
                            </p>
                            <ul className="text-xs text-red-700 mt-1 space-y-1">
                                <li>📧 Email: support@workwise.ph</li>
                                <li>📞 Phone: +63 (2) 8123-4567</li>
                                <li>🕐 Hours: Monday-Friday, 9:00 AM - 6:00 PM (PHT)</li>
                            </ul>
                        </div>
                    )}
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <span className="sr-only">Dismiss</span>
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
