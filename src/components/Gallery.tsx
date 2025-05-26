'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useSwipeable } from 'react-swipeable';
import { ThumbnailCarousel } from './ThumbnailCarousel';
import { ThumbnailGrid } from './ThumbnailGrid';
import { ImageDisplay } from './ImageDisplay';
import { ImageMetadata } from '@shared/types';
import { ImageMetadataPanel } from './ImageMetadataPanel';
import { api } from '../lib/api';

export function Gallery() {
    const [images, setImages] = useState<ImageMetadata[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGridOverlay, setShowGridOverlay] = useState(false);
    const [showMetadataPanel, setShowMetadataPanel] = useState(false);
    const [imageRefreshKeys, setImageRefreshKeys] = useState<Record<string, number>>({});

    // Navigation functions
    const goToPrevious = useCallback(() => {
        if (images.length > 1) {
            setIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
        }
    }, [images.length]);

    const goToNext = useCallback(() => {
        if (images.length > 1) {
            setIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
        }
    }, [images.length]);

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

    // Handle image metadata update
    const handleImageUpdate = async (updatedData: Partial<ImageMetadata>) => {
        if (!updatedData.filename) return;

        try {
            const result = await api.images.updateImage(updatedData.filename, {
                tags: updatedData.tags,
                description: updatedData.description,
                dateTaken: updatedData.dateTaken,
                datePrecision: updatedData.datePrecision,
            });

            // Update local state with the updated image data
            setImages(prev => prev.map(img =>
                img.filename === updatedData.filename
                    ? { ...img, ...updatedData, updatedAt: result.image.updatedAt }
                    : img
            ));
        } catch (error) {
            console.error('Error updating image metadata:', error);
            throw error; // Re-throw to let the component handle the error
        }
    };

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const data = await api.images.getImages();
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
    }, [images.length, showGridOverlay, goToNext, goToPrevious]);

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
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with navigation and grid toggle */}
            <div className="flex items-center justify-between p-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20">
                <div className="flex-1"></div>

                <div className="flex items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {index + 1} of {images.length}
                    </p>
                </div>

                <div className="flex-1 flex justify-end gap-2">
                    <button
                        onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                        className={`p-2 transition-colors ${showMetadataPanel
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        title="Toggle image metadata"
                    >
                        <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowGridOverlay(true)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        title="Show grid view"
                    >
                        <FontAwesomeIcon icon={faTh} className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1" {...swipeHandlers}>
                {/* Image display */}
                <div className="flex-1 relative">
                    {currentImage && (
                        <ImageDisplay
                            src={currentImage.filename}
                            onImageRotated={handleImageRotated}
                        />
                    )}
                </div>

                {/* ThumbnailCarousel on the right */}
                <div className={`hidden md:block`}>
                    <ThumbnailCarousel
                        images={images}
                        currentIndex={index}
                        onImageSelect={handleImageSelect}
                        imageRefreshKeys={imageRefreshKeys}
                    />
                </div>
            </div>

            {/* Image Metadata Panel - Sliding from right */}
            <div className={`fixed top-12 right-0 h-[calc(100vh-3rem)] w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${showMetadataPanel ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {currentImage && (
                    <ImageMetadataPanel
                        image={currentImage}
                        onUpdate={handleImageUpdate}
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