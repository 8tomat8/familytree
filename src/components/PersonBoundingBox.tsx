'use client';

import { Person, BoundingBox } from '@shared/types';
import { useState } from 'react';

interface PersonBoundingBoxProps {
    person: Person & { boundingBox?: BoundingBox };
    imageWidth: number;
    imageHeight: number;
    imageRef: React.RefObject<HTMLImageElement>;
    onEdit?: (person: Person) => void;
    onDelete?: (personId: string) => void;
}

export function PersonBoundingBox({ 
    person, 
    imageWidth, 
    imageHeight,
    imageRef,
    onEdit, 
    onDelete 
}: PersonBoundingBoxProps) {
    const [isHovered, setIsHovered] = useState(false);
    
    if (!person.boundingBox) return null;
    
    const { x, y, width, height } = person.boundingBox;
    
    // Get the actual displayed image dimensions
    const imageElement = imageRef.current;
    if (!imageElement) return null;
    
    const displayedWidth = imageElement.clientWidth;
    const displayedHeight = imageElement.clientHeight;
    
    // Calculate scale factors from natural to displayed size
    const scaleToDisplayX = displayedWidth / imageWidth;
    const scaleToDisplayY = displayedHeight / imageHeight;
    
    // Convert natural coordinates to display coordinates
    const scaledX = x * scaleToDisplayX;
    const scaledY = y * scaleToDisplayY;
    const scaledWidth = width * scaleToDisplayX;
    const scaledHeight = height * scaleToDisplayY;
    
    const style = {
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
    };
    
    
    return (
        <div
            className={`absolute transition-all duration-300 ease-out cursor-pointer ${
                isHovered 
                    ? 'border border-white/60 bg-white/5 shadow-lg backdrop-blur-[1px]' 
                    : 'border border-white/20 bg-transparent'
            }`}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Subtle corner indicators */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40" />
            
            {/* Person label - only on hover */}
            {isHovered && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-black/80 text-white backdrop-blur-[1px] whitespace-nowrap shadow-lg">
                    {person.name}
                </div>
            )}
            
            {/* Action button (shown on hover) */}
            {isHovered && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(person.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded flex items-center justify-center transition-colors duration-200 shadow-lg"
                    title={`Remove ${person.name}`}
                >
                    ×
                </button>
            )}
        </div>
    );
}