'use client';

import Image from 'next/image';

interface ImageDisplayProps {
    src: string;
    onImageRotated?: (filename: string) => void;
    refreshKey?: number;
}

export function ImageDisplay({ src, refreshKey = 0 }: ImageDisplayProps) {
    // Serve images from static endpoint
    const imageSrc = `/images/${encodeURIComponent(src)}`;

    return (
        <div className="relative w-full h-full">
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