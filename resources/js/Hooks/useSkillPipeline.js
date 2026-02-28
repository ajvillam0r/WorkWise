import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Shared pipeline for dynamic skill validation, fuzzy matching, and ensure.
 *
 * Usage:
 *   const { validateAndAdd, suggestions, loadSuggestions, loadCategorySkills, isValidating, fuzzyPrompt, acceptFuzzy, rejectFuzzy, validationError } = useSkillPipeline();
 */
export default function useSkillPipeline() {
    const [suggestions, setSuggestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);

    // Fuzzy "Did you mean?" state
    const [fuzzyPrompt, setFuzzyPrompt] = useState(null); // { original, match, confidence, resolve }
    const fuzzyResolve = useRef(null);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const fetchJson = useCallback(async (url, opts = {}) => {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            ...opts,
        });
        let data = null;
        try {
            data = await res.json();
        } catch {
            // Response wasn't JSON (e.g. HTML error page)
        }
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}`);
            err.status = res.status;
            err.body = data;
            throw err;
        }
        return data;
    }, [csrfToken]);

    /**
     * Load verified suggestions (optionally filtered by search query).
     */
    const loadSuggestions = useCallback(async (query = '') => {
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            params.set('limit', '50');
            const data = await fetchJson(`/api/skills/suggestions?${params}`);
            setSuggestions(data.skills || []);
            if (data.categories?.length) setCategories(data.categories);
        } catch {
            // Keep whatever we had
        }
    }, [fetchJson]);

    /**
     * Load top skills for a specific category.
     */
    const loadCategorySkills = useCallback(async (category) => {
        try {
            const params = new URLSearchParams({ category, limit: '15' });
            const data = await fetchJson(`/api/skills/suggestions?${params}`);
            return data.skills || [];
        } catch {
            return [];
        }
    }, [fetchJson]);

    // Load initial suggestions + categories on mount
    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions]);

    /**
     * Accept fuzzy suggestion.
     */
    const acceptFuzzy = useCallback(() => {
        if (fuzzyResolve.current) fuzzyResolve.current('accept');
        setFuzzyPrompt(null);
    }, []);

    /**
     * Reject fuzzy suggestion (add original anyway).
     */
    const rejectFuzzy = useCallback(() => {
        if (fuzzyResolve.current) fuzzyResolve.current('reject');
        setFuzzyPrompt(null);
    }, []);

    /**
     * Dismiss fuzzy prompt without adding anything.
     */
    const dismissFuzzy = useCallback(() => {
        if (fuzzyResolve.current) fuzzyResolve.current('dismiss');
        setFuzzyPrompt(null);
    }, []);

    /**
     * Full pipeline: fuzzy first (for "Did you mean X?" on typos), then validate if needed, then ensure.
     * Returns { skill: 'canonical name', id: number } or null if rejected/invalid.
     */
    const validateAndAdd = useCallback(async (rawInput) => {
        const input = (rawInput || '').trim();
        if (!input) return null;

        setValidationError(null);
        setIsValidating(true);

        try {
            // 1. Fuzzy match first so typos get "Did you mean X?" before AI rejection
            const fuzzyResult = await fetchJson('/api/skills/suggest-match', {
                method: 'POST',
                body: JSON.stringify({ skill: input }),
            });

            let finalName = input;

            // Exact match (confidence 100) → use canonical name, skip validate
            if (fuzzyResult.match && fuzzyResult.confidence === 100) {
                finalName = fuzzyResult.match;
            }
            // High-confidence close match → show "Did you mean X?"
            else if (fuzzyResult.match && fuzzyResult.confidence >= 80 && fuzzyResult.match.toLowerCase() !== input.toLowerCase()) {
                const decision = await new Promise((resolve) => {
                    fuzzyResolve.current = resolve;
                    setFuzzyPrompt({
                        original: input,
                        match: fuzzyResult.match,
                        confidence: fuzzyResult.confidence,
                    });
                });

                if (decision === 'accept') {
                    finalName = fuzzyResult.match;
                    // Skip validate; matched name is from DB/taxonomy
                } else if (decision === 'dismiss') {
                    return null;
                } else {
                    // 'reject' → keep original input; validate before ensure
                    const valResult = await fetchJson('/api/skills/validate', {
                        method: 'POST',
                        body: JSON.stringify({ skill: input }),
                    });
                    if (!valResult.valid) {
                        setValidationError(valResult.message || 'Please enter a valid professional skill.');
                        return null;
                    }
                    finalName = input;
                }
            }
            // No high-confidence fuzzy match → validate with AI
            else {
                const valResult = await fetchJson('/api/skills/validate', {
                    method: 'POST',
                    body: JSON.stringify({ skill: input }),
                });
                if (!valResult.valid) {
                    setValidationError(valResult.message || 'Please enter a valid professional skill.');
                    return null;
                }
                finalName = input;
            }

            // Ensure skill in DB
            const ensured = await fetchJson('/api/skills/ensure', {
                method: 'POST',
                body: JSON.stringify({ skill: finalName }),
            });

            return { skill: ensured.skill, id: ensured.id };
        } catch (err) {
            let message = 'Unable to validate skill. Please try again.';
            if (err.body && typeof err.body === 'object') {
                if (typeof err.body.message === 'string' && err.body.message.trim()) {
                    message = err.body.message.trim();
                } else if (err.body.errors && typeof err.body.errors === 'object') {
                    const first = Object.values(err.body.errors).flat().filter(Boolean)[0];
                    if (typeof first === 'string') message = first;
                }
            }
            setValidationError(message);
            return null;
        } finally {
            setIsValidating(false);
        }
    }, [fetchJson]);

    return {
        suggestions,
        categories,
        loadSuggestions,
        loadCategorySkills,
        validateAndAdd,
        isValidating,
        validationError,
        setValidationError,
        fuzzyPrompt,
        acceptFuzzy,
        rejectFuzzy,
        dismissFuzzy,
    };
}
