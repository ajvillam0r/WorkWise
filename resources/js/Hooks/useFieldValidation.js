import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for real-time field validation with debouncing
 * @param {*} value - The field value to validate
 * @param {Array} rules - Array of validation rules
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @returns {Object} - Validation state and helpers
 */
export default function useFieldValidation(value, rules = [], debounceMs = 500) {
    const [validationState, setValidationState] = useState({
        isValid: null, // null = not validated yet, true = valid, false = invalid
        error: null,
        touched: false
    });

    const [debouncedValue, setDebouncedValue] = useState(value);

    // Debounce the value
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [value, debounceMs]);

    // Validate the debounced value
    useEffect(() => {
        if (!validationState.touched && value === '') {
            // Don't validate empty fields that haven't been touched
            return;
        }

        // Run validation rules
        for (const rule of rules) {
            const result = rule.validate(debouncedValue);
            if (!result.isValid) {
                setValidationState(prev => ({
                    ...prev,
                    isValid: false,
                    error: result.message
                }));
                return;
            }
        }

        // All rules passed
        setValidationState(prev => ({
            ...prev,
            isValid: true,
            error: null
        }));
    }, [debouncedValue, rules, value]);

    const markAsTouched = useCallback(() => {
        setValidationState(prev => ({ ...prev, touched: true }));
    }, []);

    const reset = useCallback(() => {
        setValidationState({
            isValid: null,
            error: null,
            touched: false
        });
    }, []);

    return {
        ...validationState,
        markAsTouched,
        reset
    };
}
