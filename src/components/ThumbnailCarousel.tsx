'use client';

import { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ThumbnailItem } from './ThumbnailItem';
import { Box, Typography, Divider } from '@mui/material';

interface ThumbnailCarouselProps {
    images: string[];
    currentIndex: number;
    onImageSelect: (index: number) => void;
}

export function ThumbnailCarousel({
    images,
    currentIndex,
    onImageSelect
}: ThumbnailCarouselProps) {
    const listRef = useRef<List>(null);
    const [listHeight, setListHeight] = useState(600); // Default height
    const ITEM_HEIGHT = 90; // Height of each thumbnail item (image + text + padding)

    // Set list height based on window size
    useEffect(() => {
        const updateHeight = () => {
            setListHeight(window.innerHeight - 100);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Auto-scroll to current image when it changes
    useEffect(() => {
        if (listRef.current && images.length > 0) {
            listRef.current.scrollToItem(currentIndex, 'center');
        }
    }, [currentIndex, images.length]);

    const itemData = {
        images,
        currentIndex,
        onImageSelect,
    };

    return (
        <Box
            sx={{
                width: 128, // w-32 equivalent
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
            }}
        >
            {/* Header with image count */}
            <Box sx={{ p: 1, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                    {images.length} image{images.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            <Divider />

            {/* Virtualized thumbnail list */}
            <Box flex={1}>
                <List
                    ref={listRef}
                    height={listHeight}
                    itemCount={images.length}
                    itemSize={ITEM_HEIGHT}
                    itemData={itemData}
                    width="100%"
                >
                    {ThumbnailItem}
                </List>
            </Box>
        </Box>
    );
} 