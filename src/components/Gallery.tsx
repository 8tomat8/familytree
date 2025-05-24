'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSwipeable } from 'react-swipeable';
import { ThumbnailCarousel } from './ThumbnailCarousel';
import { ThumbnailGrid } from './ThumbnailGrid';
import { ImageDisplay } from './ImageDisplay';
import { ImageListResponse, ImageMetadata } from '../types';
import { ImageMetadataPanel } from './ImageMetadataPanel';

export function Gallery() {
    const [images, setImages] = useState<ImageMetadata[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGridOverlay, setShowGridOverlay] = useState(false);
    const [imageRefreshKeys, setImageRefreshKeys] = useState<Record<string, number>>({});

    // Navigation functions
    const goToPrevious = () => {
        if (images.length > 1) {
            setIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
        }
    };

    const goToNext = () => {
        if (images.length > 1) {
            setIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
        }
    };

    // Swipe handlers - must be called before any conditional logic
    const swipeHandlers = useSwipeable({
        onSwipedLeft: goToNext,
        onSwipedRight: goToPrevious,
        trackMouse: true, // Also track mouse drags for desktop
        preventScrollOnSwipe: true,
        trackTouch: true,
        delta: 10, // Minimum distance to trigger swipe
        swipeDuration: 500, // Maximum time for a swipe gesture
        touchEventOptions: { passive: false }, // Allow preventDefault
    });

    // Handle image rotation refresh
    const handleImageRotated = (filename: string) => {
        setImageRefreshKeys(prev => ({
            ...prev,
            [filename]: (prev[filename] || 0) + 1
        }));
    };

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch('/api/images');
                if (!response.ok) {
                    throw new Error('Failed to fetch images');
                }
                const data: ImageListResponse = await response.json();
                setImages(data.images);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Arrow key navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (images.length < 2) return;

            // Don't handle keys when overlay is open
            if (showGridOverlay) {
                if (event.key === 'Escape') {
                    setShowGridOverlay(false);
                }
                return;
            }

            if (event.key === 'ArrowRight') {
                goToNext();
            } else if (event.key === 'ArrowLeft') {
                goToPrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, showGridOverlay]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Loading images...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen flex-col space-y-4">
                <p className="text-gray-500">
                    No images found in <code className="bg-gray-100 px-2 py-1 rounded dark:bg-gray-800">public/images</code>
                </p>
            </div>
        );
    }

    function handleImageSelect(newIndex: number) {
        setIndex(newIndex);
        // Close overlay when image is selected
        if (showGridOverlay) {
            setShowGridOverlay(false);
        }
    }

    const currentImage = images[index];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <div className="hidden md:block">
                <ThumbnailCarousel
                    images={images}
                    currentIndex={index}
                    onImageSelect={handleImageSelect}
                    imageRefreshKeys={imageRefreshKeys}
                />
            </div>

            {/* Main image area */}
            <div className="flex-1 flex flex-col" {...swipeHandlers}>
                {/* Header with navigation and grid toggle */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20">
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {index + 1} of {images.length}
                        </p>
                        {currentImage && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{currentImage.filename}</span>
                                {currentImage.size && (
                                    <span>{Math.round(currentImage.size / 1024)} KB</span>
                                )}
                                {currentImage.width && currentImage.height && (
                                    <span>{currentImage.width} × {currentImage.height}</span>
                                )}
                                {currentImage.tags.length > 0 && (
                                    <div className="flex gap-1">
                                        {currentImage.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowGridOverlay(true)}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            title="Show grid view"
                        >
                            <FontAwesomeIcon icon={faTh} className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Image display */}
                <div className="flex-1 relative">
                    {currentImage && (
                        <ImageDisplay
                            src={currentImage.filename}
                            onImageRotated={handleImageRotated}
                        />
                    )}
                </div>

                {/* Description area */}
                {currentImage?.description && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {currentImage.description}
                        </p>
                    </div>
                )}

                {/* Image Metadata Panel */}
                {currentImage && (
                    <ImageMetadataPanel
                        image={currentImage}
                        onUpdate={() => { }}
                    />
                )}
            </div>

            {/* Grid overlay for mobile */}
            {showGridOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] w-full relative overflow-hidden">
                        {/* Close button */}
                        <button
                            onClick={() => setShowGridOverlay(false)}
                            className="absolute top-2 right-2 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
                        </button>

                        {/* Grid content */}
                        <div className="overflow-auto max-h-[90vh]">
                            <ThumbnailGrid
                                images={images}
                                currentIndex={index}
                                onImageSelect={handleImageSelect}
                                imageRefreshKeys={imageRefreshKeys}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 