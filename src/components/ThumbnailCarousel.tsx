'use client';

import { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ThumbnailItem } from './ThumbnailItem';
import { ImageMetadata } from '@shared/types';

interface ThumbnailCarouselProps {
    images: ImageMetadata[];
    currentIndex: number;
    onImageSelect: (index: number) => void;
    imageRefreshKeys?: Record<string, number>;
}

export function ThumbnailCarousel({
    images,
    currentIndex,
    onImageSelect,
    imageRefreshKeys = {}
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
        imageRefreshKeys,
    };

    return (
        <div className="w-32 h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Virtualized thumbnail list */}
            <div className="flex-1">
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
            </div>
        </div>
    );
} 