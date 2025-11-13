import React, { useState, useEffect, useRef, memo } from 'react';

/**
 * Reusable editable field component
 * Handles input, textarea, and select fields with consistent styling
 * Supports debouncing for performance optimization
 */
const EditableField = memo(function EditableField({
    label,
    id,
    type = 'text',
    value,
    onChange,
    disabled = false,
    required = false,
    placeholder = '',
    error = null,
    helpText = null,
    className = '',
    rows = null,
    options = null, // For select fields: [{value, label}]
    debounceMs = 0, // Debounce delay in ms (0 = no debouncing)
    ...props
}) {
    const [localValue, setLocalValue] = useState(value);
    const debounceTimerRef = useRef(null);

    // Sync local value when external value changes (e.g., after save/reset)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Handle input change with optional debouncing
    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (debounceMs > 0) {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            // Create a synthetic event with the new value
            debounceTimerRef.current = setTimeout(() => {
                const syntheticEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        value: newValue,
                    },
                };
                onChange(syntheticEvent);
            }, debounceMs);
        } else {
            onChange(e);
        }
    };

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const baseInputClasses = "w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
    
    const renderField = () => {
        if (type === 'textarea') {
            return (
                <textarea
                    id={id}
                    value={debounceMs > 0 ? localValue : value}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    rows={rows || 4}
                    placeholder={placeholder}
                    className={`${baseInputClasses} ${className}`}
                    {...props}
                />
            );
        }
        
        if (type === 'select') {
            return (
                <select
                    id={id}
                    value={debounceMs > 0 ? localValue : value}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    className={`${baseInputClasses} ${className}`}
                    {...props}
                >
                    {options && options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }
        
        return (
            <input
                type={type}
                id={id}
                value={debounceMs > 0 ? localValue : value}
                onChange={handleChange}
                disabled={disabled}
                required={required}
                placeholder={placeholder}
                className={`${baseInputClasses} ${className}`}
                {...props}
            />
        );
    };

    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {renderField()}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {helpText && !error && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}
        </div>
    );
});

export default EditableField;
