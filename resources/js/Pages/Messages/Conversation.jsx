import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function Conversation({ user, messages, currentUser }) {
    const [messageList, setMessageList] = useState(messages);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const { data, setData, post, processing, reset, errors } = useForm({
        receiver_id: user.id,
        message: '',
        attachment: null
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messageList]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!data.message.trim() && !data.attachment) {
            return;
        }

        const formData = new FormData();
        formData.append('receiver_id', data.receiver_id);
        formData.append('message', data.message);
        if (data.attachment) {
            formData.append('attachment', data.attachment);
        }

        // Get CSRF token safely
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        if (!csrfToken) {
            console.error('CSRF token not found');
            return;
        }

        fetch('/messages', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setMessageList(prev => [...prev, data.message]);
                reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        })
        .catch(console.error);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('attachment', file);
        }
    };

    const getUserAvatar = (messageUser) => {
        if (messageUser.profile_photo) {
            return (
                <img
                    src={`/storage/${messageUser.profile_photo}`}
                    alt={`${messageUser.first_name} ${messageUser.last_name}`}
                    className="h-8 w-8 rounded-full object-cover"
                />
            );
        }
        
        const initials = `${messageUser.first_name[0]}${messageUser.last_name[0]}`.toUpperCase();
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
        ];
        const colorIndex = messageUser.id % colors.length;
        
        return (
            <div className={`h-8 w-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-semibold`}>
                {initials}
            </div>
        );
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) { // 7 days
            return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    };

    const renderMessage = (message) => {
        const isOwnMessage = message.sender_id === currentUser.id;
        
        return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                    <div className="flex-shrink-0">
                        {getUserAvatar(message.sender)}
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                        isOwnMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-900'
                    }`}>
                        {message.type === 'file' ? (
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">📎</span>
                                <div>
                                    <div className="font-medium">{message.attachment_name}</div>
                                    <a 
                                        href={`/messages/${message.id}/download`}
                                        className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-blue-600'} hover:underline`}
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap">{message.message}</div>
                        )}
                        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                            {formatMessageTime(message.created_at)}
                            {message.is_read && isOwnMessage && (
                                <span className="ml-1">✓</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            {getUserAvatar(user)}
                        </div>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                {user.first_name} {user.last_name}
                            </h2>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    user.user_type === 'client' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {user.user_type === 'client' ? '👤 Client' : '💼 Freelancer'}
                                </span>
                                {user.professional_title && (
                                    <span>• {user.professional_title}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <a
                            href={`/reports/create?user_id=${user.id}`}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            🚨 Report
                        </a>
                    </div>
                </div>
            }
        >
            <Head title={`Chat with ${user.first_name} ${user.last_name}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-6 border-b border-gray-200">
                            {messageList.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2"></div>
                                        <p className="text-gray-600">No messages yet. Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {messageList.map(renderMessage)}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="flex items-end space-x-4">
                                <div className="flex-1">
                                    <textarea
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Type your message..."
                                        rows={3}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (!processing && (data.message.trim() || data.attachment)) {
                                                    handleSubmit(e);
                                                }
                                            }
                                        }}
                                    />
                                    {data.attachment && (
                                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                                            <span>📎</span>
                                            <span>{data.attachment.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('attachment', null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Attach file"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        disabled={processing || (!data.message.trim() && !data.attachment)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            'Send'
                                        )}
                                    </button>
                                </div>
                            </form>
                            
                            <div className="mt-2 text-xs text-gray-500">
                                Press Enter to send, Shift+Enter for new line. Max file size: 10MB
                            </div>
                        </div>
                    </div>

                    {/* User Info Sidebar */}
                    <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">About {user.first_name}</h3>
                            
                            <div className="space-y-4">
                                {user.bio && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Bio</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{user.bio}</dd>
                                    </div>
                                )}
                                
                                {user.skills && user.skills.length > 0 && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Skills</dt>
                                        <dd className="mt-1">
                                            <div className="flex flex-wrap gap-2">
                                                {user.skills.map((skill, index) => (
                                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </dd>
                                    </div>
                                )}
                                
                                {user.hourly_rate && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                                        <dd className="mt-1 text-sm text-gray-900">${user.hourly_rate}/hour</dd>
                                    </div>
                                )}
                                
                                {user.barangay && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{user.barangay}, Lapu-Lapu City</dd>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex space-x-3">
                                    <a
                                        href={`/reports/create?user_id=${user.id}`}
                                        className="flex-1 text-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        🚨 Report User
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
