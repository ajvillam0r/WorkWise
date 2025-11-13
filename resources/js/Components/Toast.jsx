import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
};

const styles = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-400',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-400',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-400',
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-400',
    },
};

export default function Toast({ message, type = 'info', isOpen, onClose, duration = 5000, position = 'top-right' }) {
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 300); // Wait for exit animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    };

    const Icon = icons[type] || icons.info;
    const style = styles[type] || styles.info;

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    };

    return (
        <Transition
            show={isVisible}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:translate-x-0"
            leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
        >
            <div className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full pointer-events-auto`}>
                <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Icon className={`h-6 w-6 ${style.icon}`} aria-hidden="true" />
                        </div>
                        <div className="ml-3 w-0 flex-1">
                            <p className={`text-sm font-medium ${style.text}`}>{message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                type="button"
                                className={`inline-flex ${style.text} hover:opacity-75 focus:outline-none`}
                                onClick={handleClose}
                            >
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    );
}

// Toast container to manage multiple toasts
export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    isOpen={true}
                    onClose={() => removeToast(toast.id)}
                    duration={toast.duration || 5000}
                    position={toast.position || 'top-right'}
                />
            ))}
        </div>
    );
}

