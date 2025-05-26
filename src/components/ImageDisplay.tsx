'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useDebounce } from '../hooks/useDebounce';
import { ValidDegrees } from '@shared/types';
import { api } from '../lib/api';

interface ImageDisplayProps {
    src: string;
    onImageRotated?: (filename: string) => void;
}

export function ImageDisplay({ src, onImageRotated }: ImageDisplayProps) {
    const [isRotating, setIsRotating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Serve images from static endpoint
    const imageSrc = `/images/${encodeURIComponent(src)}`;

    const handleRotation = async (degrees: ValidDegrees) => {
        if (isRotating) return;

        console.log(`[ImageDisplay] Starting rotation request: ${src} by ${degrees} degrees`);
        setIsRotating(true);

        try {
            await api.images.rotateImage(src, degrees);
            console.log(`[ImageDisplay] Successfully rotated ${src} by ${degrees} degrees`);

            // Force image reload by updating refresh key
            setRefreshKey(prev => prev + 1);

            // Notify parent component about rotation
            onImageRotated?.(src);
        } catch (error) {
            console.error(`[ImageDisplay] Error rotating image ${src}:`, error);
            if (error instanceof Error) {
                console.error(`[ImageDisplay] Error message: ${error.message}`);
                console.error(`[ImageDisplay] Error stack:`, error.stack);
            }
        } finally {
            setIsRotating(false);
            console.log(`[ImageDisplay] Rotation request completed for: ${src}`);
        }
    };

    // Create debounced rotation function - call useDebounce at component level
    const debouncedRotateLeft = useDebounce(() => handleRotation(270), 200);
    const debouncedRotateRight = useDebounce(() => handleRotation(90), 200);

    return (
        <div className="relative w-full h-full">
            {/* Rotation controls overlay */}
            <div className="absolute top-4 right-4 z-10 flex gap-1 bg-black bg-opacity-70 rounded-lg p-1">
                <button
                    onClick={debouncedRotateLeft}
                    disabled={isRotating}
                    title="Rotate Left (90°)"
                    className={`
                        p-2 text-white rounded hover:bg-white hover:bg-opacity-10 
                        transition-colors duration-200 
                        ${isRotating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-20'}
                        focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                    `}
                >
                    <FontAwesomeIcon icon={faRotateLeft} className="w-5 h-5" />
                </button>

                <button
                    onClick={debouncedRotateRight}
                    disabled={isRotating}
                    title="Rotate Right (90°)"
                    className={`
                        p-2 text-white rounded hover:bg-white hover:bg-opacity-10 
                        transition-colors duration-200 
                        ${isRotating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-20'}
                        focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                    `}
                >
                    <FontAwesomeIcon icon={faRotateRight} className="w-5 h-5" />
                </button>
            </div>

            <Image
                key={refreshKey}
                src={`${imageSrc}?v=${refreshKey}`}
                alt={src}
                fill
                className="object-contain"
                unoptimized // For compatibility with various formats
            />
        </div>
    );
} 