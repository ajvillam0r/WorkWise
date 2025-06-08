import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesIndex({ conversations = [] }) {
    const { auth } = usePage().props;
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Fetch unread count
        fetch('/messages/unread/count')
            .then(response => response.json())
            .then(data => setUnreadCount(data.count))
            .catch(console.error);
    }, []);

    const getLastMessagePreview = (message) => {
        if (message.type === 'file') {
            return `📎 ${message.attachment_name || 'File attachment'}`;
        }
        return message.message.length > 50 
            ? message.message.substring(0, 50) + '...'
            : message.message;
    };

    const getUserAvatar = (user) => {
        if (user.profile_photo) {
            return (
                <img
                    src={`/storage/${user.profile_photo}`}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-12 w-12 rounded-full object-cover"
                />
            );
        }
        
        const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
        ];
        const colorIndex = user.id % colors.length;
        
        return (
            <div className={`h-12 w-12 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold`}>
                {initials}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Messages
                        </h2>
                        {unreadCount > 0 && (
                            <p className="text-sm text-blue-600 mt-1">
                                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="text-sm text-gray-600">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </div>
                </div>
            }
        >
            <Head title="Messages" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {conversations.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4"></div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No conversations yet
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Start a conversation by working on a project or browsing jobs.
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <Link
                                        href="/jobs"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Browse Jobs
                                    </Link>
                                    <Link
                                        href="/projects"
                                        className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        My Projects
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {conversations.map((conversation) => (
                                    <Link
                                        key={conversation.user.id}
                                        href={`/messages/${conversation.user.id}`}
                                        className="block hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0 relative">
                                                    {getUserAvatar(conversation.user)}
                                                    {conversation.unread_count > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                {conversation.user.first_name} {conversation.user.last_name}
                                                            </h3>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                conversation.user.user_type === 'client' 
                                                                    ? 'bg-blue-100 text-blue-800' 
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {conversation.user.user_type === 'client' ? '👤 Client' : '💼 Freelancer'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(conversation.last_activity))} ago
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-1">
                                                        <p className={`text-sm ${conversation.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                            {getLastMessagePreview(conversation.latest_message)}
                                                        </p>
                                                    </div>

                                                    {conversation.user.professional_title && (
                                                        <div className="mt-1">
                                                            <p className="text-xs text-gray-500">
                                                                {conversation.user.professional_title}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    {conversations.length > 0 && (
                        <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Link
                                        href="/projects"
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">📋</span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">View Projects</div>
                                            <div className="text-xs text-gray-600">Manage active projects</div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/jobs"
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">Browse Jobs</div>
                                            <div className="text-xs text-gray-600">Find new opportunities</div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/recommendations"
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">🤖</span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">AI Recommendations</div>
                                            <div className="text-xs text-gray-600">Smart job matching</div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips for Better Communication */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Communication Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                            <div>
                                <h4 className="font-medium mb-2">For Clients:</h4>
                                <ul className="space-y-1 text-blue-700">
                                    <li>• Be clear about project requirements</li>
                                    <li>• Provide timely feedback</li>
                                    <li>• Ask questions if anything is unclear</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">For Freelancers:</h4>
                                <ul className="space-y-1 text-blue-700">
                                    <li>• Update clients on progress regularly</li>
                                    <li>• Ask for clarification when needed</li>
                                    <li>• Share work samples and previews</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
