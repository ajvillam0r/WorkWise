import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Syncs the CSRF token from Inertia page props to the meta tag and axios defaults
 * after every navigation (e.g. after login redirect), preventing 419 errors.
 */
export default function CsrfSync() {
    const { props } = usePage();

    useEffect(() => {
        const token = props.csrf_token;
        if (!token) return;

        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) {
            meta.setAttribute('content', token);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'csrf-token';
            newMeta.content = token;
            document.head.appendChild(newMeta);
        }

        if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
    }, [props.csrf_token]);

    return null;
}
