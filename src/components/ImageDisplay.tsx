'use client';

import Image from 'next/image';

interface ImageDisplayProps {
    src: string;
}

export function ImageDisplay({ src }: ImageDisplayProps) {
    // Serve images directly from public/images folder
    const imageSrc = `/images/${encodeURIComponent(src)}`;

    return (
        <div className="relative w-full h-full">
            <Image
                src={imageSrc}
                alt={src}
                fill
                className="object-contain"
                unoptimized // For compatibility with various formats
            />
        </div>
    );
} 