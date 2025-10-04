"use client";
import Dropdown from '@/Components/Dropdown';
import MiniChatModal from '@/Components/MiniChatModal';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Font Awesome icons for notifications
const NotificationIcon = ({ type, icon }) => {
    const iconMap = {
        'contract_signing': 'file-text',
        'bid_status': 'check-circle',
        'ai_recommendation': 'brain',
        'contract_fully_signed': 'check-circle',
        'bid_accepted_messaging': 'chat-bubble-left',
        'default': 'bell'
    };

    const iconClass = iconMap[type] || iconMap['default'];
    const colorMap = {
        'contract_signing': 'text-green-600',
        'bid_status': 'text-blue-600',
        'ai_recommendation': 'text-purple-600',
        'contract_fully_signed': 'text-green-600',
        'bid_accepted_messaging': 'text-blue-600',
        'default': 'text-gray-600'
    };

    return (
        <i className={`fas fa-${iconClass} ${colorMap[type] || colorMap['default']}`}></i>
    );
};

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const isGigWorker = user.user_type === 'gig_worker';
    const isEmployer = user.user_type === 'employer';

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showingNotificationsDropdown, setShowingNotificationsDropdown] =
        useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);


    // Real-time updates
    const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());
    const [lastMessageCheck, setLastMessageCheck] = useState(Date.now());

    // Messages modal removed; use MiniChatModal for all messaging
    const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);

    // Mini chat ref for controlling it from notifications
    const miniChatRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/notifications/api');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await axios.patch('/notifications/mark-all-read');
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString()
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        console.log('Notification clicked:', notification);
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        
        // Handle message-related notifications with MiniChat
        if (notification.type === 'bid_accepted_messaging') {
            const targetUserId = notification.data?.message_target_user_id;
            const userName = notification.data?.target_user_name;
            const userAvatar = notification.data?.target_user_avatar;
            
            if (targetUserId && miniChatRef.current) {
                miniChatRef.current.openConversation(targetUserId, userName, userAvatar);
                miniChatRef.current.expandChat();
            }
        } else if (notification.type === 'new_message' || notification.type === 'message_received') {
            // Handle regular message notifications - open MiniChat instead of redirecting
            const senderId = notification.data?.sender_id;
            const senderName = notification.data?.sender_name || 'User';
            const senderAvatar = notification.data?.sender_avatar;
            
            if (senderId && miniChatRef.current) {
                miniChatRef.current.openConversation(senderId, senderName, senderAvatar);
                miniChatRef.current.expandChat();
            }
        } else if (notification.action_url) {
            // For other notification types, use the action URL
            window.location.href = notification.action_url;
        }
        
        setShowingNotificationsDropdown(false);
    };

    // Handle message button click for notifications
    const handleMessageButtonClick = (e, notification) => {
        e.stopPropagation(); // Prevent notification click
        console.log('Message button clicked for notification:', notification);

        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Get the target user info from notification data
        const targetUserId = notification.data?.message_target_user_id;
        const userName = notification.data?.target_user_name;
        const userAvatar = notification.data?.target_user_avatar;
        
        if (targetUserId && miniChatRef.current) {
            // Open mini chat modal with the conversation
            miniChatRef.current.openConversation(targetUserId, userName, userAvatar);
            miniChatRef.current.expandChat();
        }

        setShowingNotificationsDropdown(false);
    };

    // Removed Quick Chat helpers; MiniChat widget is always visible

    // Handle notification button click
    const handleNotificationButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Notification button clicked, current state:', showingNotificationsDropdown);
        setShowingNotificationsDropdown(!showingNotificationsDropdown);
        if (!showingNotificationsDropdown) {
            fetchNotifications();
        }
    };

    // Load notifications on component mount
    useEffect(() => {
        fetchNotifications();
        fetchMessagesUnreadCount();
    }, []);


    // Fetch unread message count
    const fetchMessagesUnreadCount = async () => {
        try {
            const response = await axios.get('/messages/unread/count');
            setMessagesUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Error fetching messages unread count:', error);
        }
    };

    // Handle messages button click - expand MiniChat
    const handleMessagesButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Messages button clicked, expanding MiniChat');
        if (miniChatRef.current) {
            miniChatRef.current.expandChat();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showingNotificationsDropdown && !event.target.closest('.notifications-dropdown')) {
                setShowingNotificationsDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showingNotificationsDropdown]);


    // Real-time polling for notifications
    const checkForNewNotifications = async () => {
        try {
            const response = await axios.get('/notifications/api');
            const newUnreadCount = response.data.unread_count || 0;

            if (newUnreadCount > unreadCount) {
                // New notifications arrived, refresh the list
                setNotifications(response.data.notifications || []);
                setUnreadCount(newUnreadCount);
                setLastNotificationCheck(Date.now());

                // Show browser notification if supported
                if ('Notification' in window && Notification.permission === 'granted') {
                    const latestNotification = response.data.notifications?.[0];
                    if (latestNotification && !latestNotification.is_read) {
                        new Notification(latestNotification.title, {
                            body: latestNotification.message,
                            icon: '/favicon.ico'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error checking for new notifications:', error);
        }
    };

    // Real-time polling for messages
    const checkForNewMessages = async () => {
        try {
            const response = await axios.get('/messages/unread/count');
            const newMessageCount = response.data.count || 0;

            if (newMessageCount !== messagesUnreadCount) {
                // Update message count
                setMessagesUnreadCount(newMessageCount);
                setLastMessageCheck(Date.now());

                // Show browser notification if supported and count increased
                if (newMessageCount > messagesUnreadCount && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Message', {
                        body: `You have ${newMessageCount} unread messages`,
                        icon: '/favicon.ico'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    };

    // Set up polling intervals
    useEffect(() => {
        const notificationInterval = setInterval(checkForNewNotifications, 10000); // Check every 10 seconds
        const messageInterval = setInterval(checkForNewMessages, 5000); // Check every 5 seconds

        return () => {
            clearInterval(notificationInterval);
            clearInterval(messageInterval);
        };
    }, [unreadCount, messagesUnreadCount]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-200 bg-white">
                <div className="mx-auto" style={{ paddingLeft: '0.45in', paddingRight: '0.45in' }}>
                    <div className="flex h-16 justify-between items-center">
                        {/* Logo - Left */}
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center">
                                <span className="text-2xl font-bold text-blue-600">WorkWise</span>
                            </Link>
                        </div>

                        {/* Navigation - Center */}
                        <div className="flex-1 flex justify-center">
                            <div className="hidden md:flex space-x-6">
                                {/* Jobs/Work - Role-specific labels */}
                                <Link
                                    href="/jobs"
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('jobs.*')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {isGigWorker ? 'Find Work' : 'My Jobs'}
                                </Link>

                                {/* Gig Worker-only navigation */}
                                {isGigWorker && (
                                    <Link
                                        href="/bids"
                                        className={`text-sm font-medium transition-colors ${
                                            window.route.current('bids.*')
                                                ? 'text-blue-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        My Proposals
                                    </Link>
                                )}

                                {/* Employer-only navigation */}
                                {isEmployer && (
                                    <Link
                                        href="/jobs/create"
                                        className={`text-sm font-medium rounded-md transition-colors ${
                                            window.route.current('jobs.create')
                                                ? 'text-blue-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Post a Job
                                    </Link>
                                )}

                                {/* Common navigation */}
                                <Link
                                    href="/projects"
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('projects.*')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Projects
                                </Link>
                            </div>
                        </div>

                        {/* User Menu - Right */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={handleNotificationButtonClick}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showingNotificationsDropdown && (
                                    <div className="notifications-dropdown absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200">
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAllAsRead();
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {loading ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Loading...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    <i className="fas fa-bell-slash text-2xl mb-2 block"></i>
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`notification-item p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                                                            !notification.is_read ? 'unread' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                                    notification.type === 'contract_signing' ? 'bg-green-100' :
                                                                    notification.type === 'bid_status' ? 'bg-blue-100' :
                                                                    notification.type === 'ai_recommendation' ? 'bg-purple-100' :
                                                                    notification.type === 'bid_accepted_messaging' ? 'bg-blue-100' :
                                                                    'bg-gray-100'
                                                                }`}>
                                                                    <NotificationIcon type={notification.type} icon={notification.icon} />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex-shrink-0 ml-2">
                                                                {notification.data?.show_message_button && (
                                                                    <button
                                                                        onClick={(e) => handleMessageButtonClick(e, notification)}
                                                                        className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                        title="Start messaging"
                                                                    >
                                                                        <i className="fas fa-comments mr-1"></i>
                                                                        Message
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {!notification.is_read && (
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="p-3 border-t border-gray-100">
                                            <Link
                                                href="/notifications"
                                                className="block text-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                                onClick={() => setShowingNotificationsDropdown(false)}
                                            >
                                                <i className="fas fa-list mr-1"></i>
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Messages Button */}
                            {/* <div className="relative">
                                <button
                                    onClick={handleMessagesButtonClick}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {messagesUnreadCount > 0 && (
                                        <span className="notification-badge">
                                            {messagesUnreadCount > 99 ? '99+' : messagesUnreadCount}
                                        </span>
                                    )}
                                </button>
                            </div> */}

                            {/* User Dropdown */}
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="hidden md:block">{user.first_name || user.name}</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <div className="text-sm font-medium text-gray-900">{user.first_name ? `${user.first_name} ${user.last_name}` : user.name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{user.user_type}</div>
                                        </div>
                                        <Dropdown.Link href="/profile">
                                            Profile Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link href={isEmployer ? '/employer/wallet' : '/gig-worker/wallet'}>
                                              {isEmployer ? 'Wallet' : 'Earnings'}
                                        </Dropdown.Link>
                                        <Dropdown.Link href="/analytics">
                                             Analytics
                                        </Dropdown.Link>
                                        <Dropdown.Link href="/reports">
                                             My Reports
                                        </Dropdown.Link>
                                        <Dropdown.Link href="#">
                                            Help & Support
                                        </Dropdown.Link>
                                        <div className="border-t border-gray-100">
                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="md:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}>
                    <div className="px-4 py-2 space-y-1">
                        {/* Jobs/Work - Role-specific */}
                        <Link
                            href="/jobs"
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('jobs.*')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {isGigWorker ? 'Find Work' : 'My Jobs'}
                        </Link>

                        {/* Gig Worker-only mobile navigation */}
                        {isGigWorker && (
                            <Link
                                href="/bids"
                                className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    window.route.current('bids.*')
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                My Proposals
                            </Link>
                        )}

                        {/* Employer-only mobile navigation */}
                        {isEmployer && (
                            <Link
                                href="/jobs/create"
                                className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    window.route.current('jobs.create')
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Post a Job
                            </Link>
                        )}

                        {/* Common mobile navigation */}
                        <Link
                            href="/projects"
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('projects.*')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Projects
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">{user.first_name ? `${user.first_name} ${user.last_name}` : user.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{user.user_type}</div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <Link
                                href={route('profile.edit')}
                                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Profile Settings
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">{children}</main>

            {/* Messages Page Modal removed; MiniChatModal handles messaging */}

            {/* Mini Chat Modal - always present */}
            <MiniChatModal
                ref={miniChatRef}
                isOpen={true}
                unreadCount={messagesUnreadCount}
            />
        </div>
    );
}
