import { useState, useEffect } from 'react';

export default function IdImageViewer({ frontImage, backImage }) {
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!enlargedImage) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setEnlargedImage(null);
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                handleZoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                setZoom(1);
            } else if (e.key === 'ArrowLeft' && imageIndex > 0) {
                switchImage(imageIndex - 1);
            } else if (e.key === 'ArrowRight' && imageIndex < (backImage ? 1 : 0)) {
                switchImage(imageIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enlargedImage, zoom, imageIndex, backImage]);

    const handleEnlarge = (image, index = 0) => {
        setEnlargedImage(image);
        setImageIndex(index);
        setZoom(1);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const resetZoom = () => {
        setZoom(1);
    };

    const switchImage = (index) => {
        if (index === 0 && frontImage) {
            handleEnlarge(frontImage, 0);
        } else if (index === 1 && backImage) {
            handleEnlarge(backImage, 1);
        }
    };

    const handleDownload = (imageUrl, filename) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasBackImage = !!backImage;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front Image */}
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-300">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            Front of ID
                        </h3>
                    </div>
                    <div className="p-4 bg-gray-50 min-h-48 flex items-center justify-center">
                        {frontImage ? (
                            <div className="relative group w-full">
                                <img
                                    src={frontImage}
                                    alt="Front of ID"
                                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-all duration-200 rounded"
                                    onClick={() => handleEnlarge(frontImage, 0)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 rounded flex items-center justify-center">
                                    <button
                                        onClick={() => handleEnlarge(frontImage, 0)}
                                        className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
                                        title="Click to view full size (or press Enter)"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 bg-gradient-to-b from-gray-200 to-gray-100 text-gray-400 rounded">
                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">No image available</p>
                            </div>
                        )}
                        {frontImage && (
                            <button
                                onClick={() => handleDownload(frontImage, 'id-front.jpg')}
                                className="mt-3 w-full px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                        )}
                    </div>
                </div>

                {/* Back Image */}
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-300">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                            Back of ID
                        </h3>
                    </div>
                    <div className="p-4 bg-gray-50 min-h-48 flex items-center justify-center">
                        {backImage ? (
                            <div className="relative group w-full">
                                <img
                                    src={backImage}
                                    alt="Back of ID"
                                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-all duration-200 rounded"
                                    onClick={() => handleEnlarge(backImage, 1)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 rounded flex items-center justify-center">
                                    <button
                                        onClick={() => handleEnlarge(backImage, 1)}
                                        className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
                                        title="Click to view full size"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 bg-gradient-to-b from-gray-200 to-gray-100 text-gray-400 rounded">
                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">No image available</p>
                            </div>
                        )}
                        {backImage && (
                            <button
                                onClick={() => handleDownload(backImage, 'id-back.jpg')}
                                className="mt-3 w-full px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div className="relative max-w-7xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                        {/* Top Controls */}
                        <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
                            {/* Info */}
                            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                                <p className="text-white text-sm font-medium">
                                    {imageIndex === 0 ? 'Front of ID' : 'Back of ID'} • {Math.round(zoom * 100)}%
                                </p>
                            </div>

                            {/* Zoom Controls */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                    title="Zoom Out (-)  "
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={resetZoom}
                                    className="bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                    title="Reset Zoom (0)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                    title="Zoom In (+)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setEnlargedImage(null)}
                                    className="bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                    title="Close (Esc)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Image Navigation (if multiple images) */}
                        {hasBackImage && (
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
                                <button
                                    onClick={() => switchImage(0)}
                                    disabled={imageIndex === 0}
                                    className="bg-white/90 hover:bg-white disabled:bg-gray-400 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-105"
                                    title="Previous Image (←)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => switchImage(1)}
                                    disabled={imageIndex === 1}
                                    className="bg-white/90 hover:bg-white disabled:bg-gray-400 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-105"
                                    title="Next Image (→)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Image Counter */}
                        {hasBackImage && (
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                                <p className="text-white text-xs font-medium">{imageIndex + 1} of 2</p>
                            </div>
                        )}

                        {/* Image Container */}
                        <div className="overflow-auto max-h-[90vh] max-w-full flex items-center justify-center">
                            <img
                                src={enlargedImage}
                                alt="Enlarged ID"
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                className="max-w-full h-auto"
                            />
                        </div>

                        {/* Help Text */}
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                            <p className="text-white text-xs text-right leading-relaxed">
                                <span className="block font-medium">Keyboard Shortcuts:</span>
                                <span className="block">Esc to close • +/- to zoom • 0 to reset</span>
                                {hasBackImage && <span className="block">← → to switch images</span>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Fade-in animation */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-in-out;
                }
            `}</style>
        </>
    );
}




