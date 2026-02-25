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

    // Keep stable refs to avoid stale-closure / dep-array churn
    const inertiaFormRef = useRef(inertiaForm);
    inertiaFormRef.current = inertiaForm;

    const filePreviewsRef = useRef(filePreviews);
    filePreviewsRef.current = filePreviews;

    const storageKeyRef = useRef(storageKey);
    storageKeyRef.current = storageKey;

    const enablePersistenceRef = useRef(enablePersistence);
    enablePersistenceRef.current = enablePersistence;

    // ── Helpers ──────────────────────────────────────────────────────────────

    const getStorageKey = useCallback(() => {
        return storageKeyRef.current || 'onboarding_form_data';
    }, []); // storageKey read from ref – no deps needed

    const isStorageExpired = useCallback((timestamp) => {
        if (!timestamp) return true;
        return (Date.now() - timestamp) > STORAGE_EXPIRATION;
    }, [STORAGE_EXPIRATION]);

    const clearStorage = useCallback(() => {
        try {
            localStorage.removeItem(getStorageKey());
        } catch (error) {
            console.error('Failed to clear local storage:', error);
        }
    }, [getStorageKey]);

    const saveToStorage = useCallback((formData, fileRefs) => {
        if (!enablePersistenceRef.current) return;
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
    }, [getStorageKey]);

    const loadFromStorage = useCallback(() => {
        if (!enablePersistenceRef.current) return null;
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
    }, [getStorageKey, isStorageExpired, clearStorage]);

    // ── Restore from storage (runs ONCE after mount) ──────────────────────────
    useEffect(() => {
        if (isRestored) return;
        const storedData = loadFromStorage();
        if (storedData && storedData.data) {
            Object.keys(storedData.data).forEach(key => {
                const val = storedData.data[key];
                if (val !== null && val !== undefined) {
                    inertiaFormRef.current.setData(key, val);
                }
            });
        }
        // Mark restored regardless of whether there was data, so we never re-run
        setIsRestored(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally runs once on mount only

    // ── Persist form data after restore ──────────────────────────────────────
    // We only want to save when the serialised data string actually changes.
    const serialisedData = JSON.stringify(inertiaForm.data);
    const serialisedDataRef = useRef(serialisedData);

    useEffect(() => {
        if (!isRestored) return;
        // Avoid saving if data hasn't meaningfully changed
        if (serialisedData === serialisedDataRef.current && Object.keys(files).length === 0) {
            serialisedDataRef.current = serialisedData;
            return;
        }
        serialisedDataRef.current = serialisedData;

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
            saveToStorage(inertiaFormRef.current.data, fileRefs);
        }, 500);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serialisedData, files, isRestored]); // saveToStorage is stable, inertiaForm via ref

    // ── Cleanup object URLs on unmount only ──────────────────────────────────
    useEffect(() => {
        return () => {
            isMounted.current = false;
            // Read from ref so this cleanup doesn't re-register on every preview change
            Object.values(filePreviewsRef.current).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, []); // empty deps – runs cleanup only on unmount

    // ── File handling ─────────────────────────────────────────────────────────
    const handleFileChange = useCallback((fieldName, file) => {
        if (!file) {
            setFiles(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
            const preview = filePreviewsRef.current[fieldName];
            if (preview) URL.revokeObjectURL(preview);
            setFilePreviews(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
            inertiaFormRef.current.setData(fieldName, null);
            return;
        }

        setFiles(prev => ({ ...prev, [fieldName]: file }));

        if (file.type.startsWith('image/')) {
            const existingPreview = filePreviewsRef.current[fieldName];
            if (existingPreview) URL.revokeObjectURL(existingPreview);
            const previewUrl = URL.createObjectURL(file);
            setFilePreviews(prev => ({ ...prev, [fieldName]: previewUrl }));
        } else {
            const existingPreview = filePreviewsRef.current[fieldName];
            if (existingPreview) {
                URL.revokeObjectURL(existingPreview);
                setFilePreviews(prev => {
                    const updated = { ...prev };
                    delete updated[fieldName];
                    return updated;
                });
            }
        }

        inertiaFormRef.current.setData(fieldName, file);
    }, []); // no deps – reads everything from refs

    // ── Stable callbacks ──────────────────────────────────────────────────────
    const submit = useCallback((e) => {
        if (e) e.preventDefault();
        if (onSubmit) {
            onSubmit(inertiaFormRef.current.data, {
                clearStorage,
                ...inertiaFormRef.current
            });
        }
    }, [onSubmit, clearStorage]);

    const setData = useCallback((key, value) => {
        inertiaFormRef.current.setData(key, value);
    }, []);

    const getFile = useCallback((fieldName) => {
        return files[fieldName] || null;
    }, [files]);

    const getPreview = useCallback((fieldName) => {
        return filePreviewsRef.current[fieldName] || null;
    }, []); // reads from ref, no dep on filePreviews state

    const hasUnsavedChanges = useCallback(() => {
        const stored = loadFromStorage();
        if (!stored) return false;
        return JSON.stringify(stored.data) !== JSON.stringify(inertiaFormRef.current.data);
    }, [loadFromStorage]);

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
