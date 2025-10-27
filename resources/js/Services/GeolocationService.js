/**
 * Geolocation Service
 * 
 * Handles IP-based geolocation detection using ipapi.co
 */

/**
 * Detect user's country based on IP address
 * 
 * @returns {Promise<Object>} Object containing country information
 */
export const detectCountry = async () => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            country: data.country_name || 'Philippines',
            countryCode: data.country_code || 'PH',
            city: data.city || '', // For display only, not saved
            region: data.region || '', // For display only, not saved
            detected: true
        };
    } catch (error) {
        console.error('Geolocation detection failed:', error);
        
        // Return default values (Philippines) on error
        return {
            country: 'Philippines',
            countryCode: 'PH',
            city: '',
            region: '',
            detected: false
        };
    }
};

/**
 * Get list of common countries
 * 
 * @returns {Array} Array of country objects
 */
export const getCountryList = () => {
    return [
        { code: 'PH', name: 'Philippines' },
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'AU', name: 'Australia' },
        { code: 'SG', name: 'Singapore' },
        { code: 'MY', name: 'Malaysia' },
        { code: 'JP', name: 'Japan' },
        { code: 'KR', name: 'South Korea' },
        { code: 'IN', name: 'India' },
        { code: 'CN', name: 'China' },
        { code: 'ID', name: 'Indonesia' },
        { code: 'TH', name: 'Thailand' },
        { code: 'VN', name: 'Vietnam' },
        { code: 'NZ', name: 'New Zealand' },
        { code: 'AE', name: 'United Arab Emirates' },
        { code: 'SA', name: 'Saudi Arabia' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'IT', name: 'Italy' },
        { code: 'ES', name: 'Spain' },
        { code: 'BR', name: 'Brazil' },
        { code: 'MX', name: 'Mexico' },
    ].sort((a, b) => a.name.localeCompare(b.name));
};


