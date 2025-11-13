/**
 * Client-side validation utilities for profile form
 */

export const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
};

export const validatePhone = (phone) => {
    if (!phone) return null; // Phone is optional
    // Allow international formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    if (phone.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
    return null;
};

export const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} is required`;
    }
    return null;
};

export const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
};

export const validateMaxLength = (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
        return `${fieldName} must not exceed ${maxLength} characters`;
    }
    return null;
};

export const validateHourlyRate = (rate) => {
    if (!rate) return 'Hourly rate is required';
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'Please enter a valid number';
    if (numRate < 5) return 'Hourly rate must be at least ₱5';
    if (numRate > 500) return 'Hourly rate must not exceed ₱500';
    return null;
};

export const validateArrayNotEmpty = (array, fieldName) => {
    if (!array || array.length === 0) {
        return `${fieldName} must have at least one item`;
    }
    return null;
};

export const validateUrl = (url) => {
    if (!url) return null; // URL is optional
    try {
        new URL(url);
        return null;
    } catch {
        return 'Please enter a valid URL';
    }
};

/**
 * Validate a section of the profile form
 * @param {Object} data - Form data object
 * @param {string} section - Section name ('basic', 'professional', 'availability')
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateSection = (data, section) => {
    const errors = {};

    if (section === 'basic') {
        const firstNameError = validateRequired(data.first_name, 'First name');
        if (firstNameError) errors.first_name = firstNameError;

        const lastNameError = validateRequired(data.last_name, 'Last name');
        if (lastNameError) errors.last_name = lastNameError;

        const emailError = validateEmail(data.email);
        if (emailError) errors.email = emailError;

        const phoneError = validatePhone(data.phone);
        if (phoneError) errors.phone = phoneError;

        const bioError = validateMaxLength(data.bio, 1000, 'Bio');
        if (bioError) errors.bio = bioError;
    }

    if (section === 'professional') {
        if (data.professional_title) {
            const titleError = validateRequired(data.professional_title, 'Professional title');
            if (titleError) errors.professional_title = titleError;
        }

        if (data.hourly_rate) {
            const rateError = validateHourlyRate(data.hourly_rate);
            if (rateError) errors.hourly_rate = rateError;
        }

        if (data.broad_category) {
            const categoryError = validateRequired(data.broad_category, 'Category');
            if (categoryError) errors.broad_category = categoryError;
        }

        if (data.specific_services) {
            const servicesError = validateArrayNotEmpty(data.specific_services, 'Specific services');
            if (servicesError) errors.specific_services = servicesError;
        }

        if (data.company_website) {
            const urlError = validateUrl(data.company_website);
            if (urlError) errors.company_website = urlError;
        }
    }

    if (section === 'availability') {
        // Validate working hours if provided
        if (data.working_hours) {
            const hasEnabledDay = Object.values(data.working_hours).some(day => day.enabled);
            if (!hasEnabledDay) {
                errors.working_hours = 'At least one day must be enabled';
            }
        }
    }

    return errors;
};

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateField = (fieldName, value) => {
    switch (fieldName) {
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'first_name':
        case 'last_name':
            return validateRequired(value, fieldName.replace('_', ' '));
        case 'hourly_rate':
            return validateHourlyRate(value);
        case 'bio':
            return validateMaxLength(value, 1000, 'Bio');
        case 'company_website':
            return validateUrl(value);
        default:
            return null;
    }
};

