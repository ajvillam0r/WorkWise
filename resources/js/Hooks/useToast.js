import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export default function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000, position = 'top-right') => {
        const id = ++toastIdCounter;
        const toast = { id, message, type, duration, position };
        setToasts((prev) => [...prev, toast]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message, duration, position) => {
        return addToast(message, 'success', duration, position);
    }, [addToast]);

    const error = useCallback((message, duration, position) => {
        return addToast(message, 'error', duration, position);
    }, [addToast]);

    const info = useCallback((message, duration, position) => {
        return addToast(message, 'info', duration, position);
    }, [addToast]);

    const warning = useCallback((message, duration, position) => {
        return addToast(message, 'warning', duration, position);
    }, [addToast]);

    const clear = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
        clear,
    };
}

