"use client";
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const isFreelancer = user.user_type === 'freelancer';
    const isClient = user.user_type === 'client';

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

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
                                {/* Dashboard - Always visible */}
                                <Link
                                    href={route('dashboard')}
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('dashboard')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Dashboard
                                </Link>

                                {/* Jobs/Work - Role-specific labels */}
                                <Link
                                    href={route('jobs.index')}
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('jobs.*')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {isFreelancer ? 'Find Work' : 'My Jobs'}
                                </Link>

                                {/* Freelancer-only navigation */}
                                {isFreelancer && (
                                    <>
                                        <Link
                                            href={route('bids.index')}
                                            className={`text-sm font-medium transition-colors ${
                                                window.route.current('bids.*')
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            My Proposals
                                        </Link>
                                        <Link
                                            href={route('ai.recommendations')}
                                            className={`text-sm font-medium transition-colors ${
                                                window.route.current('ai.*')
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            AI Match
                                        </Link>
                                    </>
                                )}

                                {/* Client-only navigation */}
                                {isClient && (
                                    <Link
                                        href={route('jobs.create')}
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
                                    href={route('projects.index')}
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('projects.*')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Projects
                                </Link>
                                <Link
                                    href={route('messages.index')}
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('messages.*')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                     Messages
                                </Link>
                                <Link
                                    href={isClient ? route('client.wallet') : route('freelancer.wallet')}
                                    className={`text-sm font-medium transition-colors ${
                                        window.route.current('deposits.*') || window.route.current('payment.*') ||
                                        window.route.current('client.wallet') || window.route.current('freelancer.wallet')
                                            ? 'text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    💰 {isClient ? 'Wallet' : 'Earnings'}
                                </Link>
                            </div>
                        </div>

                        {/* User Menu - Right */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
                                </svg>
                            </button>

                            {/* Messages */}
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </button>

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
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profile Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link href={isClient ? route('client.wallet') : route('freelancer.wallet')}>
                                            💰 {isClient ? 'Wallet' : 'Earnings'}
                                        </Dropdown.Link>
                                        <Dropdown.Link href="/reports">
                                            🛡️ My Reports
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
                        {/* Dashboard - Always visible */}
                        <Link
                            href={route('dashboard')}
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('dashboard')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Dashboard
                        </Link>

                        {/* Jobs/Work - Role-specific */}
                        <Link
                            href={route('jobs.index')}
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('jobs.*')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {isFreelancer ? 'Find Work' : 'My Jobs'}
                        </Link>

                        {/* Freelancer-only mobile navigation */}
                        {isFreelancer && (
                            <>
                                <Link
                                    href={route('bids.index')}
                                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        window.route.current('bids.*')
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    My Proposals
                                </Link>
                                <Link
                                    href={route('ai.recommendations')}
                                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        window.route.current('ai.*')
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    AI Match
                                </Link>
                            </>
                        )}

                        {/* Client-only mobile navigation */}
                        {isClient && (
                            <Link
                                href={route('jobs.create')}
                                className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    window.route.current('jobs.create')
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                Post a Job
                            </Link>
                        )}

                        {/* Wallet - Role-specific */}
                        <Link
                            href={isClient ? route('client.wallet') : route('freelancer.wallet')}
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('deposits.*') || window.route.current('payment.*') ||
                                window.route.current('client.wallet') || window.route.current('freelancer.wallet')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            💰 {isClient ? 'Wallet' : 'Earnings'}
                        </Link>

                        {/* Common mobile navigation */}
                        <Link
                            href={route('projects.index')}
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('projects.*')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Projects
                        </Link>
                        <Link
                            href={route('messages.index')}
                            className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                window.route.current('messages.*')
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            Messages
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
        </div>
    );
}
