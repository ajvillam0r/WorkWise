/**
 * Validation rules for form fields
 * Each rule returns { isValid: boolean, message: string }
 */

export const validationRules = {
    required: (fieldName) => ({
        validate: (value) => ({
            isValid: value !== null && value !== undefined && value !== '',
            message: `${fieldName} is required`
        })
    }),

    minLength: (min, fieldName) => ({
        validate: (value) => ({
            isValid: !value || value.length >= min,
            message: `${fieldName} must be at least ${min} characters`
        })
    }),

    maxLength: (max, fieldName) => ({
        validate: (value) => ({
            isValid: !value || value.length <= max,
            message: `${fieldName} must not exceed ${max} characters`
        })
    }),

    minValue: (min, fieldName) => ({
        validate: (value) => {
            const numValue = parseFloat(value);
            return {
                isValid: !value || (!isNaN(numValue) && numValue >= min),
                message: `${fieldName} must be at least ${min}`
            };
        }
    }),

    maxValue: (max, fieldName) => ({
        validate: (value) => {
            const numValue = parseFloat(value);
            return {
                isValid: !value || (!isNaN(numValue) && numValue <= max),
                message: `${fieldName} must not exceed ${max}`
            };
        }
    }),

    numeric: (fieldName) => ({
        validate: (value) => ({
            isValid: !value || !isNaN(parseFloat(value)),
            message: `${fieldName} must be a valid number`
        })
    }),

    url: (fieldName) => ({
        validate: (value) => {
            if (!value) return { isValid: true, message: '' };
            const urlPattern = /^https?:\/\/.+\..+/;
            return {
                isValid: urlPattern.test(value),
                message: `${fieldName} must be a valid URL starting with http:// or https://`
            };
        }
    }),

    email: (fieldName) => ({
        validate: (value) => {
            if (!value) return { isValid: true, message: '' };
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                isValid: emailPattern.test(value),
                message: `${fieldName} must be a valid email address`
            };
        }
    })
};
