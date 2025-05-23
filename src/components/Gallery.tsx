'use client';

import { useState, useEffect } from 'react';
import { ThumbnailCarousel } from './ThumbnailCarousel';
import { ThumbnailGrid } from './ThumbnailGrid';
import { ImageDisplay } from './ImageDisplay';
import { ImageListResponse } from '../types';
import { Box, Typography, Button, Modal, IconButton, Paper } from '@mui/material';
import { GridView, Close } from '@mui/icons-material';

export function Gallery() {
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGridOverlay, setShowGridOverlay] = useState(false);

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
                setIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
            } else if (event.key === 'ArrowLeft') {
                setIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, showGridOverlay]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography color="text.secondary">Loading images...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (images.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography color="text.secondary">
                    No images found in <Box component="code" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>public/images</Box>
                </Typography>
            </Box>
        );
    }

    function handleImageSelect(newIndex: number) {
        setIndex(newIndex);
        // Close overlay when image is selected
        if (showGridOverlay) {
            setShowGridOverlay(false);
        }
    }

    return (
        <Box display="flex" height="100vh" bgcolor="background.default">
            <ThumbnailCarousel
                images={images}
                currentIndex={index}
                onImageSelect={handleImageSelect}
            />

            <Box flex={1} position="relative">
                {/* Navigation controls overlay */}
                <Box
                    position="absolute"
                    top={2}
                    left="50%"
                    sx={{ transform: 'translateX(-50%)' }}
                    zIndex={10}
                    display="flex"
                    alignItems="center"
                    gap={2}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', px: 1, py: 0.5, borderRadius: 1 }}
                    >
                        Use ← → arrow keys to navigate
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<GridView />}
                        onClick={() => setShowGridOverlay(true)}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        Grid View
                    </Button>
                </Box>

                {/* Full-size image display */}
                <ImageDisplay src={images[index]} />

                {/* Image counter overlay */}
                <Box
                    position="absolute"
                    bottom={2}
                    left="50%"
                    sx={{ transform: 'translateX(-50%)' }}
                    zIndex={10}
                >
                    <Typography
                        variant="body2"
                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', px: 2, py: 1, borderRadius: 1 }}
                    >
                        {index + 1} / {images.length}
                    </Typography>
                </Box>
            </Box>

            {/* Grid Overlay Modal */}
            <Modal
                open={showGridOverlay}
                onClose={() => setShowGridOverlay(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Paper
                    sx={{
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Close button */}
                    <IconButton
                        onClick={() => setShowGridOverlay(false)}
                        sx={{
                            position: 'absolute',
                            top: 1,
                            right: 1,
                            zIndex: 10,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                        size="large"
                    >
                        <Close />
                    </IconButton>

                    {/* Grid content */}
                    <Box sx={{ overflow: 'auto', maxHeight: '90vh' }}>
                        <ThumbnailGrid
                            images={images}
                            currentIndex={index}
                            onImageSelect={handleImageSelect}
                        />
                    </Box>
                </Paper>
            </Modal>
        </Box>
    );
} 