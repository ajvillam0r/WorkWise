/**
 * Error Handling Utilities
 * 
 * Provides utilities for handling and categorizing errors in the application
 */

/**
 * Error codes for client-side validation
 */
export const ERROR_CODES = {
    // File upload errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    
    // Validation errors
    REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    MIN_LENGTH: 'MIN_LENGTH',
    MAX_LENGTH: 'MAX_LENGTH',
    MIN_VALUE: 'MIN_VALUE',
    MAX_VALUE: 'MAX_VALUE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_URL: 'INVALID_URL',
    
    // Server errors
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
};

/**
 * Determines if an error is client-side or server-side
 * @param {string} errorCode - The error code
 * @returns {string} 'client' or 'server'
 */
export function getErrorType(errorCode) {
    const clientErrorCodes = [
        ERROR_CODES.FILE_TOO_LARGE,
        ERROR_CODES.INVALID_FILE_TYPE,
        ERROR_CODES.REQUIRED_FIELD_MISSING,
        ERROR_CODES.VALIDATION_FAILED,
        ERROR_CODES.MIN_LENGTH,
        ERROR_CODES.MAX_LENGTH,
        ERROR_CODES.MIN_VALUE,
        ERROR_CODES.MAX_VALUE,
        ERROR_CODES.INVALID_FORMAT,
        ERROR_CODES.INVALID_EMAIL,
        ERROR_CODES.INVALID_URL,
    ];
    
    return clientErrorCodes.includes(errorCode) ? 'client' : 'server';
}

/**
 * Maps field names to step numbers for navigation
 * @param {string} fieldName - The field name with error
 * @param {Object} stepMapping - Custom step mapping (optional)
 * @returns {number|null} Step number or null if not found
 */
export function getStepForField(fieldName, stepMapping = {}) {
    // Default mapping for GigWorker onboarding
    const defaultGigWorkerMapping = {
        // Step 1: Basic Info
        professional_title: 1,
        hourly_rate: 1,
        bio: 1,
        profile_picture: 1,
        
        // Step 2: Skills
        broad_category: 2,
        specific_services: 2,
        skills_with_experience: 2,
        
        // Step 3: Portfolio
        portfolio_link: 3,
        resume_file: 3,
    };
    
    // Default mapping for Employer onboarding
    const defaultEmployerMapping = {
        // Step 1: Company Info
        company_name: 1,
        company_size: 1,
        industry: 1,
        company_website: 1,
        company_description: 1,
        profile_picture: 1,
        
        // Step 2: Hiring Preferences
        primary_hiring_needs: 2,
        typical_project_budget: 2,
        typical_project_duration: 2,
        preferred_experience_level: 2,
        hiring_frequency: 2,
        
        // Step 3: Verification
        business_registration_document: 3,
        tax_id: 3,
    };
    
    const mapping = Object.keys(stepMapping).length > 0 
        ? stepMapping 
        : { ...defaultGigWorkerMapping, ...defaultEmployerMapping };
    
    return mapping[fieldName] || null;
}

/**
 * Formats field names for display
 * @param {string} fieldName - The field name
 * @returns {string} Formatted field name
 */
export function formatFieldName(fieldName) {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Gets the first error field and its step
 * @param {Object} errors - Error object
 * @param {Object} stepMapping - Custom step mapping (optional)
 * @returns {Object} { fieldName, step, message }
 */
export function getFirstError(errors, stepMapping = {}) {
    const errorEntries = Object.entries(errors);
    if (errorEntries.length === 0) {
        return null;
    }
    
    const [fieldName, message] = errorEntries[0];
    const step = getStepForField(fieldName, stepMapping);
    
    return {
        fieldName,
        step,
        message: Array.isArray(message) ? message[0] : message,
    };
}

/**
 * Groups errors by step
 * @param {Object} errors - Error object
 * @param {Object} stepMapping - Custom step mapping (optional)
 * @returns {Object} Errors grouped by step number
 */
export function groupErrorsByStep(errors, stepMapping = {}) {
    const grouped = {};
    
    Object.entries(errors).forEach(([fieldName, message]) => {
        const step = getStepForField(fieldName, stepMapping);
        if (step !== null) {
            if (!grouped[step]) {
                grouped[step] = [];
            }
            grouped[step].push({
                fieldName,
                message: Array.isArray(message) ? message[0] : message,
            });
        }
    });
    
    return grouped;
}

/**
 * Creates a user-friendly error message
 * @param {Object} errors - Error object
 * @param {Object} errorCodes - Error codes object (optional)
 * @returns {string} Formatted error message
 */
export function createErrorMessage(errors, errorCodes = {}) {
    const errorEntries = Object.entries(errors);
    
    if (errorEntries.length === 0) {
        return '';
    }
    
    if (errorEntries.length === 1) {
        const [fieldName, message] = errorEntries[0];
        return `${formatFieldName(fieldName)}: ${Array.isArray(message) ? message[0] : message}`;
    }
    
    let message = `Please fix the following ${errorEntries.length} errors:\n\n`;
    errorEntries.forEach(([fieldName, error]) => {
        const errorMsg = Array.isArray(error) ? error[0] : error;
        message += `• ${formatFieldName(fieldName)}: ${errorMsg}\n`;
    });
    
    return message;
}

/**
 * Support contact information for critical errors
 */
export const SUPPORT_CONTACT = {
    email: 'support@workwise.ph',
    phone: '+63 (2) 8123-4567',
    hours: 'Monday-Friday, 9:00 AM - 6:00 PM (PHT)',
};

/**
 * Gets support message for critical errors
 * @param {string} errorCode - The error code
 * @returns {string} Support message
 */
export function getSupportMessage(errorCode) {
    const criticalErrors = [
        ERROR_CODES.SERVER_ERROR,
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.FILE_UPLOAD_FAILED,
    ];
    
    if (criticalErrors.includes(errorCode)) {
        return `If this problem persists, please contact our support team at ${SUPPORT_CONTACT.email} or call ${SUPPORT_CONTACT.phone} (${SUPPORT_CONTACT.hours}).`;
    }
    
    return '';
}
