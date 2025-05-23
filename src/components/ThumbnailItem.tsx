'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { Box, Typography, Card, CardActionArea } from '@mui/material';

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
        <Box style={style} sx={{ p: 0.5 }}>
            <Card
                ref={ref}
                sx={{
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    boxShadow: isSelected ? 2 : 0,
                    '&:hover': {
                        boxShadow: 2,
                        borderColor: isSelected ? 'primary.main' : 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                <CardActionArea onClick={() => onImageSelect(index)}>
                    {/* Always show placeholder initially */}
                    <Box
                        sx={{
                            width: '100%',
                            height: 80, // h-20 equivalent
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {!inView ? (
                            <Typography variant="caption" color="text.disabled">•••</Typography>
                        ) : (
                            <>
                                {/* Image loads only when in view */}
                                <Image
                                    key={refreshKey}
                                    src={imageSrc}
                                    alt={image}
                                    width={112}
                                    height={112}
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        width: '100%',
                                        height: '80px',
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: isLoaded ? 1 : 0,
                                        transition: 'opacity 0.3s ease',
                                    }}
                                    onLoad={() => setIsLoaded(true)}
                                    unoptimized
                                />
                                {!isLoaded && (
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        sx={{ position: 'absolute' }}
                                    >
                                        Loading...
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                    <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {index + 1}
                        </Typography>
                    </Box>
                </CardActionArea>
            </Card>
        </Box>
    );
} 