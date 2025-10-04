import React, { useState } from 'react';
import MiniChatModal from '@/Components/MiniChatModal';

export default function ChatButton({ userId, userName, userAvatar, className = '', children }) {
    const [showMiniChat, setShowMiniChat] = useState(false);

    const handleClick = () => {
        setShowMiniChat(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={`inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors ${className}`}
            >
                {children || (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Chat
                    </>
                )}
            </button>

            <MiniChatModal
                isOpen={showMiniChat}
                onClose={() => setShowMiniChat(false)}
                userId={userId}
                userName={userName}
                userAvatar={userAvatar}
            />
        </>
    );
}
