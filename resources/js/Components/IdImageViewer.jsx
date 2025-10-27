import { useState } from 'react';

export default function IdImageViewer({ frontImage, backImage }) {
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [zoom, setZoom] = useState(1);

    const handleEnlarge = (image) => {
        setEnlargedImage(image);
        setZoom(1);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.5, 0.5));
    };

    const handleDownload = (imageUrl, filename) => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Front Image */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                        <h3 className="text-sm font-medium text-gray-700">Front of ID</h3>
                    </div>
                    <div className="p-4 bg-gray-50">
                        {frontImage ? (
                            <div className="relative group">
                                <img
                                    src={frontImage}
                                    alt="Front of ID"
                                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => handleEnlarge(frontImage)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleEnlarge(frontImage)}
                                        className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-3 shadow-lg transition-opacity"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-200 text-gray-500">
                                No image available
                            </div>
                        )}
                        {frontImage && (
                            <button
                                onClick={() => handleDownload(frontImage, 'id-front.jpg')}
                                className="mt-2 w-full px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                            >
                                Download
                            </button>
                        )}
                    </div>
                </div>

                {/* Back Image */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                        <h3 className="text-sm font-medium text-gray-700">Back of ID</h3>
                    </div>
                    <div className="p-4 bg-gray-50">
                        {backImage ? (
                            <div className="relative group">
                                <img
                                    src={backImage}
                                    alt="Back of ID"
                                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => handleEnlarge(backImage)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleEnlarge(backImage)}
                                        className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-3 shadow-lg transition-opacity"
                                    >
                                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-200 text-gray-500">
                                No image available
                            </div>
                        )}
                        {backImage && (
                            <button
                                onClick={() => handleDownload(backImage, 'id-back.jpg')}
                                className="mt-2 w-full px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                            >
                                Download
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div className="relative max-w-7xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                        {/* Controls */}
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                            <button
                                onClick={handleZoomOut}
                                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                title="Zoom Out"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleZoomIn}
                                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                title="Zoom In"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setEnlargedImage(null)}
                                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                title="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Zoom Level Indicator */}
                        <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                            <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                        </div>

                        {/* Image Container */}
                        <div className="overflow-auto max-h-[90vh] max-w-full">
                            <img
                                src={enlargedImage}
                                alt="Enlarged ID"
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                }}
                                className="max-w-full h-auto"
                            />
                        </div>

                        {/* Help Text */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-4 py-2 shadow-lg">
                            <p className="text-sm text-gray-600">Click outside to close • Use zoom buttons to adjust size</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}



