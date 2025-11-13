/**
 * Get the appropriate icon name for a file based on its extension
 * @param {string} filename - The filename including extension
 * @returns {string} Icon name for the file type
 */
export function getFileIcon(filename) {
    if (!filename) {
        return 'file';
    }

    // Extract file extension
    const extension = filename.split('.').pop().toLowerCase();

    // Map extensions to icon names
    const iconMap = {
        // PDF files
        'pdf': 'file-pdf',
        
        // Word documents
        'doc': 'file-word',
        'docx': 'file-word',
        
        // Excel files
        'xls': 'file-excel',
        'xlsx': 'file-excel',
        
        // PowerPoint files
        'ppt': 'file-powerpoint',
        'pptx': 'file-powerpoint',
        
        // Images
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'bmp': 'image',
        'svg': 'image',
        'webp': 'image',
        
        // Text files
        'txt': 'file-text',
        'md': 'file-text',
        
        // Code files
        'js': 'file-code',
        'jsx': 'file-code',
        'ts': 'file-code',
        'tsx': 'file-code',
        'html': 'file-code',
        'css': 'file-code',
        'php': 'file-code',
        'py': 'file-code',
        'java': 'file-code',
        'cpp': 'file-code',
        'c': 'file-code',
        
        // Archives
        'zip': 'file-archive',
        'rar': 'file-archive',
        '7z': 'file-archive',
        'tar': 'file-archive',
        'gz': 'file-archive',
        
        // Video files
        'mp4': 'file-video',
        'avi': 'file-video',
        'mov': 'file-video',
        'wmv': 'file-video',
        'flv': 'file-video',
        'webm': 'file-video',
        
        // Audio files
        'mp3': 'file-audio',
        'wav': 'file-audio',
        'ogg': 'file-audio',
        'flac': 'file-audio',
    };

    // Return mapped icon or default file icon
    return iconMap[extension] || 'file';
}

/**
 * Check if a file is an image based on its extension
 * @param {string} filename - The filename including extension
 * @returns {boolean} True if the file is an image
 */
export function isImageFile(filename) {
    if (!filename) {
        return false;
    }

    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    
    return imageExtensions.includes(extension);
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
