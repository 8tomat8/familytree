'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, IconButton, Tooltip } from '@mui/material';
import { RotateLeft, RotateRight } from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';
import { ValidDegrees } from '../types/image';

interface ImageDisplayProps {
    src: string;
    onImageRotated?: (filename: string) => void;
}

export function ImageDisplay({ src, onImageRotated }: ImageDisplayProps) {
    const [isRotating, setIsRotating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Serve images from static endpoint
    const imageSrc = `/static/img/${encodeURIComponent(src)}`;

    const handleRotation = async (degrees: ValidDegrees) => {
        if (isRotating) return;

        console.log(`[ImageDisplay] Starting rotation request: ${src} by ${degrees} degrees`);
        setIsRotating(true);

        try {
            const url = `/api/images/${encodeURIComponent(src)}/rotate`;
            console.log(`[ImageDisplay] Making POST request to: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ degrees }),
            });

            console.log(`[ImageDisplay] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ImageDisplay] Server error: ${response.status} - ${errorText}`);
                throw new Error(`Failed to rotate image: ${response.status} ${response.statusText}`);
            }

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
            <Box
                position="absolute"
                top={16}
                right={16}
                zIndex={10}
                display="flex"
                gap={1}
                sx={{
                    bgcolor: 'rgba(0,0,0,0.7)',
                    borderRadius: 2,
                    p: 0.5,
                }}
            >
                <Tooltip title="Rotate Left (90°)">
                    <IconButton
                        onClick={debouncedRotateLeft}
                        disabled={isRotating}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                        size="small"
                    >
                        <RotateLeft />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Rotate Right (90°)">
                    <IconButton
                        onClick={debouncedRotateRight}
                        disabled={isRotating}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                        size="small"
                    >
                        <RotateRight />
                    </IconButton>
                </Tooltip>
            </Box>

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