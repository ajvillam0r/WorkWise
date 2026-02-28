import axios from 'axios';
import { refreshCsrfToken } from '@/utils/csrfRefresh';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set up CSRF token for axios
let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// On 419 (Page Expired), refresh CSRF token and retry the request once
window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 419 && !originalRequest._csrfRetried) {
            originalRequest._csrfRetried = true;
            const newToken = await refreshCsrfToken();
            if (newToken) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                return window.axios(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);

// Ziggy is included via @routes in app.blade.php
// We only need to ensure route.current works as expected for breadcrumbs/nav
if (window.route) {
    const originalCurrent = window.route.current;

    window.route.current = function (pattern) {
        if (!pattern) return window.location.pathname;

        // Handle wildcard patterns like 'jobs.*'
        if (pattern.includes('*')) {
            const basePattern = pattern.replace('.*', '');
            const routeMap = {
                'dashboard': '/dashboard',
                'jobs': '/jobs',
                'bids': '/bids',
                'projects': '/projects',
                'messages': '/messages',
                'ai': ['/ai/recommendations', '/ai/job-suggestions', '/ai/insights', '/aimatch/employer', '/aimatch/gig-worker', '/ai-recommendations/employer', '/ai-recommendations/gig-worker'],
                'payment': '/payment',
                'reports': '/reports',
                'profile': '/profile',
                'deposits': '/deposits',
                'contracts': '/contracts'
            };

            const paths = routeMap[basePattern];
            if (!paths) return originalCurrent ? originalCurrent(pattern) : false;

            const currentPath = window.location.pathname;
            if (Array.isArray(paths)) {
                return paths.some(path => currentPath.startsWith(path));
            }
            return currentPath.startsWith(paths);
        }

        // Exact matches
        const exactRouteMap = {
            'dashboard': '/dashboard',
            'jobs.index': '/jobs',
            'jobs.create': '/jobs/create',
            'profile.edit': '/profile',
            'bids.index': '/bids',
            'projects.index': '/projects',
            'messages.index': '/messages',
            'ai.recommendations': '/ai/recommendations',
            'ai.recommendations.employer': '/aimatch/employer',
            'ai.recommendations.gigworker': '/aimatch/gig-worker',
            'ai.recommendations.employer.quality': '/ai-recommendations/employer',
            'ai.recommendations.gigworker.quality': '/ai-recommendations/gig-worker',
            'payment.history': '/payment/history',
            'reports.index': '/reports',
            'deposits.index': '/deposits',
            'contracts.index': '/contracts'
        };

        if (exactRouteMap[pattern]) {
            return window.location.pathname === exactRouteMap[pattern];
        }

        return originalCurrent ? originalCurrent(pattern) : false;
    };
}
