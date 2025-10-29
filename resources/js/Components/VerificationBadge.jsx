import React from 'react';

export default function VerificationBadge({ type, verified = false, size = 'md', className = '' }) {
    if (!verified) {
        return null;
    }

    const badges = {
        email: {
            icon: '✉️',
            text: 'Email Verified',
            color: 'blue',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
        },
        id: {
            icon: '🆔',
            text: 'ID Verified',
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
        },
        address: {
            icon: '📍',
            text: 'Address Verified',
            color: 'purple',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
        },
    };

    const badge = badges[type];
    if (!badge) return null;

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span 
            className={`inline-flex items-center rounded-full font-medium border ${badge.bgColor} ${badge.textColor} ${badge.borderColor} ${sizes[size]} ${className}`}
            title={badge.text}
        >
            <span className="mr-1">{badge.icon}</span>
            <span>{badge.text}</span>
        </span>
    );
}

/**
 * Compact badge variant - shows only icon with tooltip
 */
export function VerificationBadgeCompact({ type, verified = false, className = '' }) {
    if (!verified) {
        return null;
    }

    const badges = {
        email: {
            icon: '✉️',
            text: 'Email Verified',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
        },
        id: {
            icon: '🆔',
            text: 'ID Verified',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
        },
        address: {
            icon: '📍',
            text: 'Address Verified',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
        },
    };

    const badge = badges[type];
    if (!badge) return null;

    return (
        <span 
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${badge.bgColor} ${badge.textColor} ${className}`}
            title={badge.text}
        >
            {badge.icon}
        </span>
    );
}

/**
 * Multiple badges container
 */
export function VerificationBadges({ user, size = 'sm', className = '' }) {
    const hasEmailVerified = user?.email_verified_at !== null;
    const hasIdVerified = user?.id_verification_status === 'verified';
    const hasAddressVerified = user?.address_verified_at !== null;

    if (!hasEmailVerified && !hasIdVerified && !hasAddressVerified) {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
            {hasEmailVerified && <VerificationBadge type="email" verified={true} size={size} />}
            {hasIdVerified && <VerificationBadge type="id" verified={true} size={size} />}
            {hasAddressVerified && <VerificationBadge type="address" verified={true} size={size} />}
        </div>
    );
}


