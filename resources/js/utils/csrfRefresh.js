/**
 * CSRF Token Refresh Utility
 * 
 * Prevents 419 Page Expired errors by periodically refreshing the CSRF token
 * and updating the meta tag in the document head.
 */

/**
 * Refresh the CSRF token from the server
 * @returns {Promise<string|null>} The new CSRF token or null if failed
 */
export async function refreshCsrfToken() {
    try {
        const response = await fetch('/sanctum/csrf-cookie', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            // Extract CSRF token from cookie
            const csrfToken = getCsrfTokenFromCookie();
            
            if (csrfToken) {
                // Update the meta tag
                updateCsrfMetaTag(csrfToken);
                console.log('CSRF token refreshed successfully');
                return csrfToken;
            }
        }
        
        console.warn('Failed to refresh CSRF token');
        return null;
    } catch (error) {
        console.error('Error refreshing CSRF token:', error);
        return null;
    }
}

/**
 * Get CSRF token from cookie
 * @returns {string|null}
 */
function getCsrfTokenFromCookie() {
    const name = 'XSRF-TOKEN';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
        const token = parts.pop().split(';').shift();
        return decodeURIComponent(token);
    }
    
    return null;
}

/**
 * Update the CSRF meta tag in the document head
 * @param {string} token
 */
function updateCsrfMetaTag(token) {
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'csrf-token';
        document.head.appendChild(metaTag);
    }
    
    metaTag.content = token;
}

/**
 * Start periodic CSRF token refresh
 * @param {number} intervalMinutes - Refresh interval in minutes (default: 30)
 * @returns {number} Interval ID that can be used to stop the refresh
 */
export function startCsrfRefresh(intervalMinutes = 30) {
    // Refresh immediately on start
    refreshCsrfToken();
    
    // Then refresh periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(() => {
        refreshCsrfToken();
    }, intervalMs);
    
    console.log(`CSRF token refresh started (every ${intervalMinutes} minutes)`);
    
    return intervalId;
}

/**
 * Stop periodic CSRF token refresh
 * @param {number} intervalId - The interval ID returned by startCsrfRefresh
 */
export function stopCsrfRefresh(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('CSRF token refresh stopped');
    }
}

/**
 * React hook for CSRF token refresh
 * @param {boolean} enabled - Whether to enable auto-refresh
 * @param {number} intervalMinutes - Refresh interval in minutes
 */
export function useCsrfRefresh(enabled = true, intervalMinutes = 30) {
    if (typeof window === 'undefined') return;
    
    const { useEffect } = require('react');
    
    useEffect(() => {
        if (!enabled) return;
        
        const intervalId = startCsrfRefresh(intervalMinutes);
        
        return () => {
            stopCsrfRefresh(intervalId);
        };
    }, [enabled, intervalMinutes]);
}
