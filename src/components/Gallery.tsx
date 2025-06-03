'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faTimes, faEdit } from '@fortawesome/free-solid-svg-icons';
// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, A11y, Virtual } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/keyboard';

import { ThumbnailCarousel } from './ThumbnailCarousel';
import { ThumbnailGrid } from './ThumbnailGrid';
import { ImageWithPeople } from './ImageWithPeople';
import { ImageMetadata } from '@shared/types';
import { ImageMetadataPanel } from './ImageMetadataPanel';
import { TopBar } from './TopBar';
import { api } from '../lib/api';

export function Gallery() {
    const [images, setImages] = useState<ImageMetadata[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGridOverlay, setShowGridOverlay] = useState(false);
    const [showMetadataPanel, setShowMetadataPanel] = useState(false);
    const [imageRefreshKeys, setImageRefreshKeys] = useState<Record<string, number>>({});

    const swiperRef = useRef<SwiperType>(null);

    // Handle image rotation refresh
    const handleImageRotated = useCallback((filename: string) => {
        setImageRefreshKeys(prev => ({
            ...prev,
            [filename]: (prev[filename] || 0) + 1
        }));
    }, []);

    // Handle image metadata update
    const handleImageUpdate = useCallback(async (updatedData: Partial<ImageMetadata>) => {
        if (!updatedData.id) return;

        try {
            const result = await api.images.updateImage(updatedData.id, {
                tags: updatedData.tags,
                description: updatedData.description,
                dateTaken: updatedData.dateTaken,
                datePrecision: updatedData.datePrecision,
            });

            // Update local state with the updated image data
            setImages(prev => prev.map(img =>
                img.id === updatedData.id
                    ? { ...img, ...updatedData, updatedAt: result.image.updatedAt }
                    : img
            ));
        } catch (error) {
            console.error('Error updating image metadata:', error);
            throw error; // Re-throw to let the component handle the error
        }
    }, []);

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
            // Handle escape key for closing overlay
            if (showGridOverlay && event.key === 'Escape') {
                setShowGridOverlay(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showGridOverlay]);

    // Optimized slide change handler that only updates state after transition
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        // Use requestAnimationFrame to defer state update until after animation
        requestAnimationFrame(() => {
            setCurrentIndex(swiper.activeIndex);
        });
    }, []);

    // Create virtual slides data for Swiper Virtual module
    const virtualSlides = useMemo(() => {
        return images.map((image, index) => ({
            index,
            image,
            refreshKey: imageRefreshKeys[image.filename] || 0
        }));
    }, [images, imageRefreshKeys]);

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
        setCurrentIndex(newIndex);
        swiperRef.current?.slideTo(newIndex);
        // Close overlay when image is selected
        if (showGridOverlay) {
            setShowGridOverlay(false);
        }
    }

    const currentImage = images[currentIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <TopBar
                centerText={`${currentIndex + 1} of ${images.length}`}
                rightActions={
                    <>
                        <button
                            onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                            className={`p-2 transition-colors ${showMetadataPanel
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            title="Toggle image metadata"
                        >
                            <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowGridOverlay(true)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            title="Show grid view"
                        >
                            <FontAwesomeIcon icon={faTh} className="w-5 h-5" />
                        </button>
                    </>
                }
            />

            {/* Main content area */}
            <div className="flex flex-1">
                {/* Image display with Swiper */}
                <div className="flex-1 relative overflow-hidden">
                    <Swiper
                        modules={[Navigation, Pagination, Keyboard, A11y, Virtual]}
                        spaceBetween={0}
                        slidesPerView={1}
                        virtual={{
                            slides: virtualSlides
                        }}
                        watchOverflow={true}
                        keyboard={{
                            enabled: true,
                        }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={handleSlideChange}
                        className="h-full"
                        allowTouchMove={true}
                        grabCursor={true}
                        followFinger={true}
                        longSwipesRatio={0.1}
                        resistance={true}
                        resistanceRatio={0.85}
                    >
                        {images.map((image) => (
                            <SwiperSlide key={image.filename} className="h-full">
                                <ImageWithPeople
                                    src={image.filename}
                                    imageId={image.id}
                                    refreshKey={imageRefreshKeys[image.filename] || 0}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* ThumbnailCarousel on the right */}
                <div className={`hidden md:block`}>
                    <ThumbnailCarousel
                        images={images}
                        currentIndex={currentIndex}
                        onImageSelect={handleImageSelect}
                        imageRefreshKeys={imageRefreshKeys}
                    />
                </div>
            </div>

            {/* Image Metadata Panel - Sliding from right */}
            <div className={`fixed top-12 right-0 h-[calc(100vh-3rem)] w-96 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${showMetadataPanel ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {currentImage && (
                    <ImageMetadataPanel
                        image={currentImage}
                        onUpdate={handleImageUpdate}
                        onImageRotated={handleImageRotated}
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
                                currentIndex={currentIndex}
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