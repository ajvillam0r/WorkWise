/**
 * Extract file name from a URL
 * @param {string|null} url - The URL to extract the file name from
 * @returns {string} - The extracted file name or a default value
 */
export function extractFileName(url) {
    // Handle null, undefined, or empty string
    if (!url || typeof url !== 'string') {
        return 'file';
    }

    try {
        // Remove query parameters and hash fragments
        const cleanUrl = url.split('?')[0].split('#')[0];
        
        // Extract the last segment of the path
        const segments = cleanUrl.split('/');
        const fileName = segments[segments.length - 1];
        
        // If we got a valid file name, decode it and return
        if (fileName && fileName.length > 0) {
            return decodeURIComponent(fileName);
        }
        
        return 'file';
    } catch (error) {
        // If any error occurs during parsing, return default
        console.warn('Error extracting file name from URL:', error);
        return 'file';
    }
}
