import React, { useState, useRef } from 'react';

export default function AvatarUploadOverlay({ 
    currentImage, 
    onUpload, 
    onFileSelected, // New callback for confirmation flow
    userName = 'User',
    size = 'lg',
    className = '' 
}) {
    const [hovering, setHovering] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const sizes = {
        sm: 'h-12 w-12',
        md: 'h-16 w-16',
        lg: 'h-24 w-24',
        xl: 'h-32 w-32',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-8 w-8',
        xl: 'h-10 w-10',
    };

    const handleClick = () => {
        if (fileInputRef.current && !uploading) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // If onFileSelected is provided, use confirmation flow
            if (onFileSelected) {
                const previewUrl = URL.createObjectURL(file);
                onFileSelected(file, previewUrl);
                // Reset input to allow re-uploading the same file
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else if (onUpload) {
                // Otherwise use immediate upload (backwards compatibility)
                setUploading(true);
                try {
                    await onUpload(file);
                } catch (error) {
                    console.error('Upload failed:', error);
                } finally {
                    setUploading(false);
                    // Reset input to allow re-uploading the same file
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            }
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div 
            className={`relative group cursor-pointer ${className}`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={handleClick}
        >
            {/* Avatar Image or Initials */}
            {currentImage ? (
                <img 
                    src={currentImage} 
                    alt={userName}
                    className={`${sizes[size]} rounded-full object-cover ring-2 ring-gray-200 transition-all duration-200 ${hovering ? 'ring-blue-400' : ''}`}
                />
            ) : (
                <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200 transition-all duration-200 ${hovering ? 'ring-blue-400' : ''}`}>
                    <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-xl'}>
                        {getInitials(userName)}
                    </span>
                </div>
            )}
            
            {/* Hover Overlay */}
            <div 
                className={`absolute inset-0 bg-black rounded-full flex items-center justify-center transition-opacity duration-200 ${
                    hovering ? 'opacity-60' : 'opacity-0'
                }`}
            >
                {uploading ? (
                    <svg 
                        className={`${iconSizes[size]} text-white animate-spin`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                    >
                        <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                        />
                        <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg 
                        className={`${iconSizes[size]} text-white`}
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                        />
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                    </svg>
                )}
            </div>

            {/* Tooltip text */}
            {hovering && !uploading && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    Click to upload
                </div>
            )}
            
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
}




