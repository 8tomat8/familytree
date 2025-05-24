'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { ImageMetadata } from '../types';

interface ThumbnailGridProps {
    images: ImageMetadata[];
    currentIndex: number;
    onImageSelect: (index: number) => void;
    imageRefreshKeys?: Record<string, number>;
}

interface GridItemProps {
    image: ImageMetadata;
    index: number;
    currentIndex: number;
    onImageSelect: (index: number) => void;
    imageRefreshKeys?: Record<string, number>;
}

function GridItem({ image, index, currentIndex, onImageSelect, imageRefreshKeys = {} }: GridItemProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Use intersection observer with buffer zone to load images ahead of time
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '100px 0px', // Load images 100px before they're visible
        threshold: 0.01,
    });

    const isSelected = index === currentIndex;
    const refreshKey = imageRefreshKeys[image.filename] || 0;
    const imageSrc = `/images/${encodeURIComponent(image.filename)}${refreshKey > 0 ? `?v=${refreshKey}` : ''}`;

    return (
        <div
            ref={ref}
            className={`
                border-2 rounded-lg transition-all duration-200 ease-in-out
                ${isSelected
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200 dark:border-gray-700 shadow-sm'
                }
                hover:shadow-xl hover:scale-[1.02]
            `}
        >
            <button
                onClick={() => onImageSelect(index)}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg"
            >
                {/* Aspect ratio container for square thumbnails */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden rounded-t-lg">
                    {!inView ? (
                        <span className="text-sm text-gray-400">•••</span>
                    ) : (
                        <>
                            <Image
                                key={refreshKey}
                                src={imageSrc}
                                alt={image.filename}
                                fill
                                className={`
                                    object-cover transition-opacity duration-300 ease-in-out
                                    ${isLoaded ? 'opacity-100' : 'opacity-0'}
                                `}
                                onLoad={() => setIsLoaded(true)}
                                unoptimized
                            />
                            {!isLoaded && (
                                <span className="text-sm text-gray-400 absolute">
                                    Loading...
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Image info */}
                <div className="p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-1">
                        {index + 1}
                    </div>
                    {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                            {image.tags.slice(0, 3).map(tag => (
                                <span
                                    key={tag}
                                    className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs leading-none"
                                >
                                    {tag}
                                </span>
                            ))}
                            {image.tags.length > 3 && (
                                <span className="text-xs text-gray-400">+{image.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                    {image.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate text-center">
                            {image.description}
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

export function ThumbnailGrid({
    images,
    currentIndex,
    onImageSelect,
    imageRefreshKeys = {}
}: ThumbnailGridProps) {
    const [columns, setColumns] = useState(4); // Default columns

    // Responsive grid columns based on container width
    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width < 640) setColumns(2);      // sm: 2 columns
            else if (width < 768) setColumns(3); // md: 3 columns
            else if (width < 1024) setColumns(4); // lg: 4 columns
            else if (width < 1280) setColumns(5); // xl: 5 columns
            else setColumns(6);                   // 2xl: 6 columns
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Scroll to current image when it changes
    useEffect(() => {
        if (currentIndex >= 0 && images.length > 0) {
            const element = document.getElementById(`grid-item-${currentIndex}`);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [currentIndex, images.length]);

    return (
        <div className="p-4 bg-white dark:bg-gray-900">
            {/* Header with image count */}
            <div className="mb-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {images.length} image{images.length !== 1 ? 's' : ''} in grid view
                </p>
            </div>

            {/* Responsive grid */}
            <div
                className="grid gap-4"
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
            >
                {images.map((image, index) => (
                    <div key={`${image.filename}-${index}`} id={`grid-item-${index}`}>
                        <GridItem
                            image={image}
                            index={index}
                            currentIndex={currentIndex}
                            onImageSelect={onImageSelect}
                            imageRefreshKeys={imageRefreshKeys}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
} 