'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { ImageMetadata } from '@shared/types';

interface ThumbnailItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        images: ImageMetadata[];
        currentIndex: number;
        onImageSelect: (index: number) => void;
        imageRefreshKeys?: Record<string, number>;
        disabled?: boolean;
    };
}

export const ThumbnailItem = memo(function ThumbnailItem({ index, style, data }: ThumbnailItemProps) {
    const { images, currentIndex, onImageSelect, imageRefreshKeys = {}, disabled = false } = data;
    const image = images[index];
    const [isLoaded, setIsLoaded] = useState(false);

    // Use intersection observer with buffer zone to load images ahead of time
    const { ref, inView } = useInView({
        triggerOnce: true, // Only trigger once when image comes into view
        rootMargin: '100px 0px', // Load images 100px before they're visible (buffer zone)
        threshold: 0.01, // Trigger when 1% of the element is visible
    });

    if (!image) return null;

    const isSelected = index === currentIndex;
    const refreshKey = imageRefreshKeys[image.filename] || 0;
    const imageSrc = `/images/${encodeURIComponent(image.filename)}${refreshKey > 0 ? `?v=${refreshKey}` : ''}`;

    return (
        <div ref={ref} style={style} className="px-2 py-1">
            <div
                className={`
                    border-2 rounded-lg transition-all duration-200 ease-in-out
                    ${isSelected
                        ? 'border-blue-500 shadow-xl'
                        : 'border-gray-200 dark:border-gray-700 shadow-sm'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'}
                `}
            >
                <button
                    onClick={() => !disabled && onImageSelect(index)}
                    disabled={disabled}
                    className={`w-full rounded-lg ${disabled ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'}`}
                >
                    <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {!inView ? (
                            <span className="text-xs text-gray-400">•••</span>
                        ) : (
                            <>
                                {/* Image loads only when in view */}
                                <Image
                                    key={refreshKey}
                                    src={imageSrc}
                                    alt={image.filename}
                                    width={112}
                                    height={112}
                                    className={`
                                        object-cover rounded-t-lg w-full h-20 absolute inset-0 
                                        transition-opacity duration-300 ease-in-out
                                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                                    `}
                                    onLoad={() => setIsLoaded(true)}
                                    unoptimized
                                />
                                {!isLoaded && (
                                    <span className="text-xs text-gray-400 absolute">
                                        Loading...
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Image info */}
                    <div className="p-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {index + 1}
                        </div>
                        {image.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {image.tags.slice(0, 2).map(tag => (
                                    <span
                                        key={tag}
                                        className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs leading-none"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {image.tags.length > 2 && (
                                    <span className="text-xs text-gray-400">+{image.tags.length - 2}</span>
                                )}
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}); 