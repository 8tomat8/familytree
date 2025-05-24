'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

interface ThumbnailItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        images: string[];
        currentIndex: number;
        onImageSelect: (index: number) => void;
        imageRefreshKeys?: Record<string, number>;
    };
}

export function ThumbnailItem({ index, style, data }: ThumbnailItemProps) {
    const { images, currentIndex, onImageSelect, imageRefreshKeys = {} } = data;
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
    const refreshKey = imageRefreshKeys[image] || 0;
    const imageSrc = `/images/${encodeURIComponent(image)}${refreshKey > 0 ? `?v=${refreshKey}` : ''}`;

    return (
        <div style={style} className="p-2">
            <div
                ref={ref}
                className={`
                    border-2 rounded-lg transition-all duration-200 ease-in-out
                    ${isSelected
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 shadow-none'
                    }
                    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                    ${isSelected ? 'hover:border-blue-500' : ''}
                `}
            >
                <button
                    onClick={() => onImageSelect(index)}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg"
                >
                    {/* Image container */}
                    <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {!inView ? (
                            <span className="text-xs text-gray-400">•••</span>
                        ) : (
                            <>
                                {/* Image loads only when in view */}
                                <Image
                                    key={refreshKey}
                                    src={imageSrc}
                                    alt={image}
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

                    {/* Index label */}
                    <div className="p-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate block">
                            {index + 1}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
} 