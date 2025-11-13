import { useForm } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';

export default function useOnboardingForm({ 
    initialData = {}, 
    storageKey, 
    onSubmit,
    enablePersistence = true 
}) {
    const inertiaForm = useForm(initialData);
    const [files, setFiles] = useState({});
    const [filePreviews, setFilePreviews] = useState({});
    const [isRestored, setIsRestored] = useState(false);
    const isMounted = useRef(true);
    const STORAGE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

    const getStorageKey = useCallback(() => {
        return storageKey || 'onboarding_form_data';
    }, [storageKey]);

    const isStorageExpired = useCallback((timestamp) => {
        if (!timestamp) return true;
        const now = Date.now();
        return (now - timestamp) > STORAGE_EXPIRATION;
    }, []);

    const saveToStorage = useCallback((formData, fileRefs) => {
        if (!enablePersistence) return;
        try {
            const storageData = {
                version: '1.0',
                timestamp: Date.now(),
                data: formData,
                fileReferences: fileRefs
            };
            localStorage.setItem(getStorageKey(), JSON.stringify(storageData));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }, [enablePersistence, getStorageKey]);

    const loadFromStorage = useCallback(() => {
        if (!enablePersistence) return null;
        try {
            const stored = localStorage.getItem(getStorageKey());
            if (!stored) return null;
            const storageData = JSON.parse(stored);
            if (isStorageExpired(storageData.timestamp)) {
                clearStorage();
                return null;
            }
            return storageData;
        } catch (error) {
            console.error('Failed to load from local storage:', error);
            return null;
        }
    }, [enablePersistence, getStorageKey, isStorageExpired]);

    const clearStorage = useCallback(() => {
        try {
            localStorage.removeItem(getStorageKey());
        } catch (error) {
            console.error('Failed to clear local storage:', error);
        }
    }, [getStorageKey]);

    useEffect(() => {
        if (isRestored) return;
        const storedData = loadFromStorage();
        if (storedData && storedData.data) {
            Object.keys(storedData.data).forEach(key => {
                if (storedData.data[key] !== null && storedData.data[key] !== undefined) {
                    inertiaForm.setData(key, storedData.data[key]);
                }
            });
            setIsRestored(true);
        }
    }, [isRestored, loadFromStorage]);

    useEffect(() => {
        if (!isRestored) return;
        const fileRefs = {};
        Object.keys(files).forEach(key => {
            if (files[key]) {
                fileRefs[key] = {
                    name: files[key].name,
                    size: files[key].size,
                    type: files[key].type
                };
            }
        });
        const timeoutId = setTimeout(() => {
            saveToStorage(inertiaForm.data, fileRefs);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inertiaForm.data, files, isRestored, saveToStorage]);

    const handleFileChange = useCallback((fieldName, file) => {
        if (!file) {
            setFiles(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
            if (filePreviews[fieldName]) {
                URL.revokeObjectURL(filePreviews[fieldName]);
            }
            setFilePreviews(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
            inertiaForm.setData(fieldName, null);
            return;
        }
        setFiles(prev => ({ ...prev, [fieldName]: file }));
        if (file.type.startsWith('image/')) {
            if (filePreviews[fieldName]) {
                URL.revokeObjectURL(filePreviews[fieldName]);
            }
            const previewUrl = URL.createObjectURL(file);
            setFilePreviews(prev => ({ ...prev, [fieldName]: previewUrl }));
        } else {
            if (filePreviews[fieldName]) {
                URL.revokeObjectURL(filePreviews[fieldName]);
                setFilePreviews(prev => {
                    const updated = { ...prev };
                    delete updated[fieldName];
                    return updated;
                });
            }
        }
        inertiaForm.setData(fieldName, file);
    }, [filePreviews, inertiaForm]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            Object.values(filePreviews).forEach(url => {
                if (url) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [filePreviews]);

    const submit = useCallback((e) => {
        if (e) {
            e.preventDefault();
        }
        if (onSubmit) {
            onSubmit(inertiaForm.data, {
                clearStorage,
                ...inertiaForm
            });
        }
    }, [onSubmit, inertiaForm, clearStorage]);

    const setData = useCallback((key, value) => {
        inertiaForm.setData(key, value);
    }, [inertiaForm]);

    const getFile = useCallback((fieldName) => {
        return files[fieldName] || null;
    }, [files]);

    const getPreview = useCallback((fieldName) => {
        return filePreviews[fieldName] || null;
    }, [filePreviews]);

    const hasUnsavedChanges = useCallback(() => {
        const stored = loadFromStorage();
        if (!stored) return false;
        return JSON.stringify(stored.data) !== JSON.stringify(inertiaForm.data);
    }, [loadFromStorage, inertiaForm.data]);

    return {
        data: inertiaForm.data,
        setData,
        errors: inertiaForm.errors,
        processing: inertiaForm.processing,
        progress: inertiaForm.progress,
        wasSuccessful: inertiaForm.wasSuccessful,
        recentlySuccessful: inertiaForm.recentlySuccessful,
        files,
        filePreviews,
        handleFileChange,
        getFile,
        getPreview,
        submit,
        reset: inertiaForm.reset,
        clearErrors: inertiaForm.clearErrors,
        setError: inertiaForm.setError,
        clearStorage,
        hasUnsavedChanges,
        post: inertiaForm.post,
        put: inertiaForm.put,
        patch: inertiaForm.patch,
        delete: inertiaForm.delete,
        transform: inertiaForm.transform,
    };
}
