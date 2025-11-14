/**
 * Format currency values with Philippine Peso sign and proper comma separators
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    const number = Number(amount ?? 0);
    return `₱${number.toLocaleString('en-PH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
};

/**
 * Format number with comma separators
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
    const number = Number(value ?? 0);
    return number.toLocaleString('en-PH', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
};
