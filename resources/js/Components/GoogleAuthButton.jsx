import React from 'react';
import { router } from '@inertiajs/react';

const GoogleAuthButton = ({ 
    action = 'login', 
    className = '', 
    disabled = false,
    children 
}) => {
    const handleGoogleAuth = () => {
        if (disabled) return;
        
        // Add CSRF token to the request
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Redirect to Google OAuth with action parameter
        window.location.href = route('auth.google', { action });
    };

    const defaultText = action === 'register' ? 'Sign up with Google' : 'Continue with Google';
    const buttonText = children || defaultText;

    
};

export default GoogleAuthButton;