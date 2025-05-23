'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { Box, Typography, Card, CardActionArea } from '@mui/material';

interface ThumbnailGridProps {
    images: string[];
    currentIndex: number;
    onImageSelect: (index: number) => void;
}

interface GridItemProps {
    image: string;
    index: number;
    currentIndex: number;
    onImageSelect: (index: number) => void;
}

function GridItem({ image, index, currentIndex, onImageSelect }: GridItemProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Use intersection observer with buffer zone to load images ahead of time
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '100px 0px', // Load images 100px before they're visible
        threshold: 0.01,
    });

    const isSelected = index === currentIndex;

    return (
        <Card
            ref={ref}
            sx={{
                border: 2,
                borderColor: isSelected ? 'primary.main' : 'divider',
                boxShadow: isSelected ? 4 : 1,
                '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.02)',
                },
                transition: 'all 0.2s ease-in-out',
            }}
        >
            <CardActionArea onClick={() => onImageSelect(index)}>
                {/* Aspect ratio container for square thumbnails */}
                <Box
                    sx={{
                        aspectRatio: '1',
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {!inView ? (
                        <Typography variant="body2" color="text.disabled">•••</Typography>
                    ) : (
                        <>
                            <Image
                                src={`/images/${encodeURIComponent(image)}`}
                                alt={image}
                                fill
                                style={{
                                    objectFit: 'cover',
                                    opacity: isLoaded ? 1 : 0,
                                    transition: 'opacity 0.3s ease',
                                }}
                                onLoad={() => setIsLoaded(true)}
                                unoptimized
                            />
                            {!isLoaded && (
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    sx={{ position: 'absolute' }}
                                >
                                    Loading...
                                </Typography>
                            )}
                        </>
                    )}
                </Box>

                {/* Image number */}
                <Box sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                        {index + 1}
                    </Typography>
                </Box>
            </CardActionArea>
        </Card>
    );
}

export function ThumbnailGrid({
    images,
    currentIndex,
    onImageSelect
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
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            {/* Header with image count */}
            <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {images.length} image{images.length !== 1 ? 's' : ''} in grid view
                </Typography>
            </Box>

            {/* Responsive grid */}
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
            >
                {images.map((image, index) => (
                    <Box key={`${image}-${index}`} id={`grid-item-${index}`}>
                        <GridItem
                            image={image}
                            index={index}
                            currentIndex={currentIndex}
                            onImageSelect={onImageSelect}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
} 