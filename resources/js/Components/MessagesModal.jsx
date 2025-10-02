import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function MessagesModal({ isOpen, onClose, initialUserId = null }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/messages/recent/conversations');
            setConversations(response.data.conversations || []);

            // Auto-select conversation if initialUserId provided
            if (initialUserId) {
                const conversation = response.data.conversations?.find(
                    conv => conv.user.id === parseInt(initialUserId)
                );
                if (conversation) {
                    setSelectedConversation(conversation);
                    fetchMessages(conversation.user.id);
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for a specific user
    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(`/messages/conversation/${userId}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Send a message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            setSending(true);
            const response = await axios.post('/messages', {
                receiver_id: selectedConversation.user.id,
                message: newMessage,
                project_id: selectedConversation.project_id || null
            });

            setMessages(prev => [...prev, response.data.message]);
            setNewMessage('');

            // Refresh conversations to update unread counts
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Handle conversation selection
    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation.user.id);
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, initialUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex h-full" style={{ height: 'calc(100vh - 73px)' }}>
                    {/* Conversations List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        <div className="p-3 border-b border-gray-100">
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Loading...
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    <i className="fas fa-comments text-2xl mb-2 block"></i>
                                    No conversations yet
                                </div>
                            ) : (
                                conversations.map((conversation) => (
                                    <div
                                        key={conversation.user.id}
                                        onClick={() => handleConversationSelect(conversation)}
                                        className={`p-3 cursor-pointer transition-colors ${
                                            selectedConversation?.user.id === conversation.user.id
                                                ? 'bg-blue-50 border-r-2 border-blue-500'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {conversation.user.first_name ? conversation.user.first_name.charAt(0).toUpperCase() : conversation.user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {conversation.user.first_name ? `${conversation.user.first_name} ${conversation.user.last_name}` : conversation.user.name}
                                                    </p>
                                                    {conversation.unread_count > 0 && (
                                                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                            {conversation.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 truncate">
                                                    {conversation.latest_message.type === 'file' ? (
                                                        <><i className="fas fa-paperclip mr-1"></i>{conversation.latest_message.attachment_name}</>
                                                    ) : (
                                                        conversation.latest_message.message
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(conversation.last_activity).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Conversation Header */}
                                <div className="p-3 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                            {selectedConversation.user.first_name ? selectedConversation.user.first_name.charAt(0).toUpperCase() : selectedConversation.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedConversation.user.first_name ? `${selectedConversation.user.first_name} ${selectedConversation.user.last_name}` : selectedConversation.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                {selectedConversation.user.user_type}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender_id === selectedConversation.user.id ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                    message.sender_id === selectedConversation.user.id
                                                        ? 'bg-gray-100 text-gray-900'
                                                        : 'bg-blue-600 text-white'
                                                }`}
                                            >
                                                {message.type === 'file' ? (
                                                    <div className="flex items-center space-x-2">
                                                        <i className="fas fa-paperclip"></i>
                                                        <a
                                                            href={`/storage/${message.attachment_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline hover:no-underline"
                                                        >
                                                            {message.attachment_name}
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm">{message.message}</p>
                                                )}
                                                <p className={`text-xs mt-1 ${
                                                    message.sender_id === selectedConversation.user.id
                                                        ? 'text-gray-500'
                                                        : 'text-blue-100'
                                                }`}>
                                                    {new Date(message.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200">
                                    <form onSubmit={sendMessage} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {sending ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <i className="fas fa-paper-plane"></i>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <i className="fas fa-comments text-4xl mb-4 block"></i>
                                    <p className="text-lg font-medium">Select a conversation</p>
                                    <p className="text-sm">Choose a conversation from the list to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}