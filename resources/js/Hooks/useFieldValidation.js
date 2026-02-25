import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for real-time field validation with debouncing.
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

    // Store latest rules in a ref so the validation effect doesn't need rules
    // as a dependency (callers often pass inline arrays that recreate each render).
    const rulesRef = useRef(rules);
    useEffect(() => {
        rulesRef.current = rules;
    });

    // Debounce the value
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [value, debounceMs]);

    // Validate the debounced value — uses ref for rules, no rules in dep array.
    useEffect(() => {
        if (!validationState.touched && debouncedValue === '') {
            // Don't validate empty fields that haven't been touched
            return;
        }

        const currentRules = rulesRef.current;

        // Run validation rules
        for (const rule of currentRules) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedValue]); // intentionally omits 'rules' – handled via rulesRef

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

