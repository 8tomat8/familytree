'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { api } from '@/lib/api';
import { Person } from '@shared/types';

interface ImagePersonSelectorProps {
    imageSrc: string;
    imageId: string;
    refreshKey?: number;
    onPersonLinked?: () => void;
}

export function ImagePersonSelector({
    imageSrc,
    imageId,
    refreshKey = 0,
    onPersonLinked
}: ImagePersonSelectorProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');
    const [isSelecting, setIsSelecting] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [showPeopleList, setShowPeopleList] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Load people list
    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const response = await api.people.getPeople();
                setPeople(response.people);
            } catch (error) {
                console.error('Error loading people:', error);
            }
        };
        fetchPeople();
    }, []);

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        imgRef.current = img;
    }, []);

    const onCropComplete = useCallback((crop: PixelCrop) => {
        setCompletedCrop(crop);
    }, []);

    const handleStartSelection = () => {
        setIsSelecting(true);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setShowPeopleList(false);
    };

    const handleCancelSelection = () => {
        setIsSelecting(false);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setShowPeopleList(false);
        setSelectedPersonId('');
    };

    const handleConfirmSelection = () => {
        if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
            setShowPeopleList(true);
        }
    };

    const handleLinkPerson = async () => {
        if (!selectedPersonId || !completedCrop) return;

        setIsLinking(true);
        try {
            await api.people.linkToImage({
                personId: selectedPersonId,
                imageId,
                boundingBox: {
                    x: Math.round(completedCrop.x),
                    y: Math.round(completedCrop.y),
                    width: Math.round(completedCrop.width),
                    height: Math.round(completedCrop.height)
                }
            });

            // Reset state
            handleCancelSelection();
            onPersonLinked?.();
        } catch (error) {
            console.error('Error linking person to image:', error);
        } finally {
            setIsLinking(false);
        }
    };

    const imageFullSrc = `/images/${encodeURIComponent(imageSrc)}?v=${refreshKey}`;

    return (
        <div className="relative w-full h-full">
            {!isSelecting ? (
                // Normal image display with overlay button
                <>
                    <img
                        ref={imgRef}
                        src={imageFullSrc}
                        alt={imageSrc}
                        className="w-full h-full object-contain"
                        onLoad={onImageLoad}
                    />
                    <button
                        onClick={handleStartSelection}
                        className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        Select Person Area
                    </button>
                </>
            ) : (
                // Crop selection mode
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 relative">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => onCropComplete(c)}
                            aspect={undefined}
                            minWidth={20}
                            minHeight={20}
                        >
                            <img
                                ref={imgRef}
                                src={imageFullSrc}
                                alt={imageSrc}
                                className="w-full h-full object-contain"
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>

                    {/* Control buttons */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelSelection}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
                                <button
                                    onClick={handleConfirmSelection}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                    Confirm Selection
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Person selection modal */}
            {showPeopleList && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Select Person</h3>

                        <div className="mb-4 max-h-60 overflow-y-auto">
                            {people.map(person => (
                                <label key={person.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input
                                        type="radio"
                                        name="person"
                                        value={person.id}
                                        checked={selectedPersonId === person.id}
                                        onChange={(e) => setSelectedPersonId(e.target.value)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium">{person.name}</div>
                                        {(person.birthDate || person.deathDate) && (
                                            <div className="text-sm text-gray-500">
                                                {person.birthDate && new Date(person.birthDate).getFullYear()}
                                                {person.birthDate && person.deathDate && ' - '}
                                                {person.deathDate && new Date(person.deathDate).getFullYear()}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelSelection}
                                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLinkPerson}
                                disabled={!selectedPersonId || isLinking}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLinking ? 'Linking...' : 'Link Person'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 