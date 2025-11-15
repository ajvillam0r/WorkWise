import { Link } from '@inertiajs/react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function IDVerificationBanner({ 
    message = "Complete your ID verification to unlock all features and build trust with clients.",
    buttonText = "Verify Your Identity",
    linkUrl = "/id-verification",
    variant = "warning", // 'warning' or 'info'
    dismissible = true,
    onDismiss = null
}) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) {
            onDismiss();
        }
    };

    if (!isVisible) return null;

    const variantStyles = {
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-600',
            text: 'text-yellow-800',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            text: 'text-blue-800',
            button: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const styles = variantStyles[variant] || variantStyles.warning;
    const Icon = variant === 'warning' ? ExclamationTriangleIcon : InformationCircleIcon;

    return (
        <div 
            className={`${styles.bg} ${styles.border} border rounded-lg p-4 mb-6 shadow-sm`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                    <Icon className={`w-6 h-6 ${styles.icon}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${styles.text}`}>
                        {message}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href={linkUrl}
                        className={`${styles.button} px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variant === 'warning' ? 'yellow' : 'blue'}-500 w-full sm:w-auto text-center`}
                    >
                        {buttonText}
                    </Link>
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className={`${styles.icon} hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variant === 'warning' ? 'yellow' : 'blue'}-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center`}
                            aria-label="Dismiss notification"
                            type="button"
                        >
                            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
