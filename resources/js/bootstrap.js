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

// Enhanced route helper with current() functionality
window.route = function (name, params = {}) {
    const routes = {
        'dashboard': '/dashboard',
        'jobs.index': '/jobs',
        'jobs.create': '/jobs/create',
        'jobs.store': '/jobs',
        'jobs.show': (id) => `/jobs/${id}`,
        'jobs.edit': (id) => `/jobs/${id}/edit`,
        'jobs.update': (id) => `/jobs/${id}`,
        'jobs.destroy': (id) => `/jobs/${id}`,
        'profile.edit': '/profile',
        'profile.update': '/profile',
        'profile.destroy': '/profile',
        'gig-worker.profile': '/profile/gig-worker',
        'gig-worker.profile.edit': '/profile/gig-worker/edit',
        'gig-worker.profile.update': '/profile/gig-worker/edit',
        'bids.index': '/bids',
        'bids.store': '/bids',
        'bids.update': (id) => `/bids/${id}`,
        'bids.destroy': (id) => `/bids/${id}`,
        'projects.index': '/projects',
        'projects.show': (id) => `/projects/${id}`,
        'messages.index': '/messages',
        'messages.conversation': (user) => `/messages/${user}`,
        'ai.recommendations': '/ai/recommendations',
        'ai.job.suggestions': '/ai/job-suggestions',
        'ai.insights': '/ai/insights',
        'payment.history': '/payment/history',
        'reports.index': '/reports',
        'reports.create': '/reports/create',
        'deposits.index': '/deposits',
        'client.wallet': '/client/wallet',
        'freelancer.wallet': '/freelancer/wallet',
        'contracts.index': '/contracts',
        'contracts.show': (id) => `/contracts/${id}`,
        'contracts.sign': (id) => `/contracts/${id}/sign`,
        'contracts.processSignature': (id) => `/contracts/${id}/signature`,
        'contracts.downloadPdf': (id) => `/contracts/${id}/pdf`,
        'browse.freelancers': '/browse-freelancers',
        // Onboarding routes
        'gig-worker.onboarding': '/onboarding/gig-worker',
        'gig-worker.onboarding.store': '/onboarding/gig-worker',
        'gig-worker.onboarding.skip': '/onboarding/gig-worker/skip',
        'employer.onboarding': '/onboarding/employer',
        'employer.onboarding.store': '/onboarding/employer',
        'employer.onboarding.skip': '/onboarding/employer/skip',
        // ID Verification routes
        'id-verification.show': '/id-verification',
        'id-verification.upload': '/api/id-verification/upload',
        'id-verification.upload-front': '/api/id-verification/upload-front',
        'id-verification.upload-back': '/api/id-verification/upload-back',
        'id-verification.resubmit': '/api/id-verification/resubmit',
        // Admin routes
        'admin.dashboard': '/admin/dashboard',
        'admin.id-verifications.index': '/admin/id-verifications',
        'admin.id-verifications.show': (userId) => `/admin/id-verifications/${userId}`,
        'admin.id-verifications.approve': (userId) => `/admin/id-verifications/${userId}/approve`,
        'admin.id-verifications.reject': (userId) => `/admin/id-verifications/${userId}/reject`,
        'admin.id-verifications.requestResubmit': (userId) => `/admin/id-verifications/${userId}/request-resubmit`,
        // Employer routes
        'employer.dashboard': '/employer/dashboard',
        'employer.profile': '/profile/employer',
        'employer.profile.edit': '/profile/employer/edit',
        'employer.profile.update': '/profile/employer/edit',
        // Auth routes
        'login': '/login',
        'logout': '/logout',
        'register': '/register',
        'role.selection': '/join',
        'role.store': '/join'
    };

    if (typeof routes[name] === 'function') {
        return routes[name](params);
    }

    if (!routes[name]) {
        console.warn(`[route] Unknown route name: "${name}". Falling back to "#". Add it to bootstrap.js.`);
        // #region agent log
        fetch('http://127.0.0.1:7501/ingest/c1ee8a40-5240-4871-b19a-db022ef79a5e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'224090'},body:JSON.stringify({sessionId:'224090',runId:'post-fix',hypothesisId:'H-A',location:'bootstrap.js:112',message:'route fallback triggered',data:{routeName:name},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
    }

    return routes[name] || '#';
};

// Add current() method to route helper
window.route.current = function (pattern) {
    const currentPath = window.location.pathname;

    if (!pattern) {
        return currentPath;
    }

    // Handle wildcard patterns like 'jobs.*'
    if (pattern.includes('*')) {
        const basePattern = pattern.replace('.*', '');
        const routeMap = {
            'dashboard': '/dashboard',
            'jobs': '/jobs',
            'bids': '/bids',
            'projects': '/projects',
            'messages': '/messages',
            'ai': ['/ai/recommendations', '/ai/job-suggestions', '/ai/insights'],
            'payment': '/payment',
            'reports': '/reports',
            'profile': '/profile',
            'deposits': '/deposits',
            'contracts': '/contracts'
        };

        const paths = routeMap[basePattern];
        if (Array.isArray(paths)) {
            return paths.some(path => currentPath.startsWith(path));
        }
        return currentPath.startsWith(paths);
    }

    // Handle exact matches
    const routeMap = {
        'dashboard': '/dashboard',
        'jobs.index': '/jobs',
        'jobs.create': '/jobs/create',
        'profile.edit': '/profile',
        'bids.index': '/bids',
        'projects.index': '/projects',
        'messages.index': '/messages',
        'ai.recommendations': '/ai/recommendations',
        'payment.history': '/payment/history',
        'reports.index': '/reports',
        'deposits.index': '/deposits',
        'contracts.index': '/contracts'
    };

    return currentPath === routeMap[pattern];
};
