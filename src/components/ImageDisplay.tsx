'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageDisplayProps {
    src: string;
    onImageRotated?: (filename: string) => void;
    refreshKey?: number;
    isCropping?: boolean;
    onPersonAdded?: (crop: Crop, personName: string) => void;
}

export function ImageDisplay({ src, refreshKey = 0, isCropping = false, onPersonAdded }: ImageDisplayProps) {
    // Serve images from static endpoint
    const imageSrc = `/images/${encodeURIComponent(src)}`;

    // Crop state - start with no initial crop
    const [crop, setCrop] = useState<Crop>();
    const [personName, setPersonName] = useState<string>('');
    const cropContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [inputPosition, setInputPosition] = useState({ left: '0px', top: '0px' });

    // Calculate input position based on crop
    useEffect(() => {
        if (crop && cropContainerRef.current && imageRef.current) {
            const container = cropContainerRef.current;
            const image = imageRef.current;

            const containerRect = container.getBoundingClientRect();
            const imageRect = image.getBoundingClientRect();

            // Calculate image position relative to container
            const imageLeft = imageRect.left - containerRect.left;
            const imageTop = imageRect.top - containerRect.top;

            // Calculate crop position in pixels relative to the image
            const cropCenterX = imageLeft + (crop.x / 100) * imageRect.width + (crop.width / 100) * imageRect.width / 2;
            const cropBottomY = imageTop + (crop.y / 100) * imageRect.height + (crop.height / 100) * imageRect.height + 10;

            setInputPosition({
                left: `${cropCenterX}px`,
                top: `${cropBottomY}px`
            });
        }
    }, [crop]);

    const handleSavePerson = () => {
        if (crop && personName.trim() && onPersonAdded) {
            onPersonAdded(crop, personName.trim());
            setPersonName(''); // Clear input after saving
            setCrop(undefined); // Clear crop after saving
        }
    };

    const imageElement = (
        <img
            ref={imageRef}
            key={refreshKey}
            src={`${imageSrc}?v=${refreshKey}`}
            alt={src}
            style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
            }}
        />
    );

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center" ref={cropContainerRef}>
                {isCropping ? (
                    <ReactCrop
                        crop={crop}
                        onChange={(newCrop) => setCrop(newCrop)}
                        style={{
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    >
                        {imageElement}
                    </ReactCrop>
                ) : (
                    imageElement
                )}
            </div>

            {/* Person name input - shows when cropping and crop exists */}
            {isCropping && crop && (
                <div
                    className="absolute bg-white p-2 rounded-lg shadow-lg border z-50"
                    style={{
                        left: inputPosition.left,
                        top: inputPosition.top,
                        // transform: 'translateX(-50%)'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            placeholder="Enter person's name"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSavePerson();
                                }
                            }}
                        />
                        <button
                            onClick={handleSavePerson}
                            disabled={!personName.trim()}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
} 