import React, { useEffect, useState } from 'react';

const ThankYouModal = ({ isOpen, onClose, message = "Thank you for your feedback!", duration = 3000 }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(() => {
                    onClose();
                }, 300); // Wait for fade out animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay with fade */}
                <div
                    className={`fixed inset-0 bg-gray-500 transition-opacity duration-300 ${
                        show ? 'bg-opacity-75' : 'bg-opacity-0'
                    }`}
                    onClick={() => {
                        setShow(false);
                        setTimeout(onClose, 300);
                    }}
                ></div>

                {/* Center modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>

                {/* Modal panel with scale and fade animation */}
                <div
                    className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ${
                        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                >
                    <div>
                        {/* Success icon with animation */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 animate-bounce">
                            <svg
                                className="h-10 w-10 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-2xl leading-6 font-bold text-gray-900">
                                Thank You!
                            </h3>
                            <div className="mt-2">
                                <p className="text-base text-gray-600">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setShow(false);
                                setTimeout(onClose, 300);
                            }}
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm transition-colors duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThankYouModal;
