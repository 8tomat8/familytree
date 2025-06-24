'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { api } from '@/lib/api';
import { Person, BoundingBox } from '@shared/types';
import { PersonBoundingBox } from './PersonBoundingBox';

interface ImageDisplayProps {
    src: string;
    imageId: string;
    onImageRotated?: (filename: string) => void;
    refreshKey?: number;
    isCropping?: boolean;
}

export function ImageDisplay({ src, imageId, refreshKey = 0, isCropping = false }: ImageDisplayProps) {
    // Serve images from static endpoint
    const imageSrc = `/images/${encodeURIComponent(src)}`;

    // Crop state - start with no initial crop
    const [crop, setCrop] = useState<Crop>();
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [allPersons, setAllPersons] = useState<Person[]>([]);
    const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
    const [isLoadingPersons, setIsLoadingPersons] = useState<boolean>(false);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
    const [isLinking, setIsLinking] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [imagePeople, setImagePeople] = useState<Array<Person & { boundingBox?: BoundingBox }>>([]);
    const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);

    const cropContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [inputPosition, setInputPosition] = useState<{ left: string, top: string }>();

    // Fetch existing people linked to this image
    useEffect(() => {
        const fetchImagePeople = async () => {
            if (imageId) {
                try {
                    const response = await api.people.getPeopleForImage(imageId);
                    setImagePeople(response.people);
                } catch (error) {
                    console.error('Failed to fetch image people:', error);
                }
            }
        };
        
        fetchImagePeople();
    }, [imageId, successMessage]); // Re-fetch when successMessage changes (after linking)

    // Fetch all persons on component mount
    useEffect(() => {
        const fetchPersons = async () => {
            if (isCropping && allPersons.length === 0) {
                setIsLoadingPersons(true);
                try {
                    const response = await api.people.getPeople();
                    setAllPersons(response.people);
                } catch (error) {
                    console.error('Failed to fetch persons:', error);
                } finally {
                    setIsLoadingPersons(false);
                }
            }
        };

        fetchPersons();
    }, [isCropping, allPersons.length]);

    const handlePersonAdded = async (crop: Crop, personName: string) => {
        try {
            setIsCreatingNew(true);
            setError(null);
            
            // Create person
            const createResponse = await api.people.createPerson({
                name: personName,
            });
            
            // Convert crop coordinates (relative to displayed image) to natural image coordinates
            const displayedWidth = imageRef.current?.clientWidth || 1;
            const displayedHeight = imageRef.current?.clientHeight || 1;
            const naturalWidth = imageRef.current?.naturalWidth || 1;
            const naturalHeight = imageRef.current?.naturalHeight || 1;
            
            const scaleToNaturalX = naturalWidth / displayedWidth;
            const scaleToNaturalY = naturalHeight / displayedHeight;
            
            const naturalBoundingBox = {
                x: Math.round(crop.x * scaleToNaturalX),
                y: Math.round(crop.y * scaleToNaturalY),
                width: Math.round(crop.width * scaleToNaturalX),
                height: Math.round(crop.height * scaleToNaturalY)
            };
            
            console.log('Converting crop to natural coordinates:', {
                cropOriginal: crop,
                displayedSize: { displayedWidth, displayedHeight },
                naturalSize: { naturalWidth, naturalHeight },
                scale: { scaleToNaturalX, scaleToNaturalY },
                naturalBoundingBox
            });
            
            // Link to image
            await api.people.linkToImage({
                personId: createResponse.person.id,
                imageId,
                boundingBox: naturalBoundingBox
            });
            
            // Update UI state
            setSelectedPerson(createResponse.person);
            setSuccessMessage(`Created and linked ${personName}`);
            
            // Refresh image people
            const response = await api.people.getPeopleForImage(imageId);
            setImagePeople(response.people);
            
            // Clear states after success
            setTimeout(() => {
                setCrop(undefined);
                setInputValue('');
                setSelectedPerson(null);
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create person');
        } finally {
            setIsCreatingNew(false);
        }
    };

    const handlePersonLink = async (crop: Crop, person: Person) => {
        try {
            setIsLinking(true);
            setError(null);
            
            // Convert crop coordinates (relative to displayed image) to natural image coordinates
            const displayedWidth = imageRef.current?.clientWidth || 1;
            const displayedHeight = imageRef.current?.clientHeight || 1;
            const naturalWidth = imageRef.current?.naturalWidth || 1;
            const naturalHeight = imageRef.current?.naturalHeight || 1;
            
            const scaleToNaturalX = naturalWidth / displayedWidth;
            const scaleToNaturalY = naturalHeight / displayedHeight;
            
            const naturalBoundingBox = {
                x: Math.round(crop.x * scaleToNaturalX),
                y: Math.round(crop.y * scaleToNaturalY),
                width: Math.round(crop.width * scaleToNaturalX),
                height: Math.round(crop.height * scaleToNaturalY)
            };
            
            await api.people.linkToImage({
                personId: person.id,
                imageId,
                boundingBox: naturalBoundingBox
            });
            
            setSuccessMessage(`Linked ${person.name} to image`);
            
            // Refresh image people
            const response = await api.people.getPeopleForImage(imageId);
            setImagePeople(response.people);
            
            // Clear states after success
            setTimeout(() => {
                setCrop(undefined);
                setInputValue('');
                setSelectedPerson(null);
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to link person');
        } finally {
            setIsLinking(false);
        }
    };

    // Calculate input position based on crop - center horizontally
    useEffect(() => {
        if (crop && cropContainerRef.current && imageRef.current && inputRef.current) {
            const containerRect = cropContainerRef.current.getBoundingClientRect();
            const imageRect = imageRef.current.getBoundingClientRect();
            const inputWidth = inputRef.current.offsetWidth;
            
            // Calculate offset of image within container
            const imageOffsetX = imageRect.left - containerRect.left;
            const imageOffsetY = imageRect.top - containerRect.top;
            
            // Calculate centered position relative to container
            const centerX = imageOffsetX + crop.x + (crop.width / 2) - (inputWidth / 2);
            const topY = imageOffsetY + crop.y + crop.height + 10;

            setInputPosition({
                left: `${centerX}px`,
                top: `${topY}px`
            });
        }
    }, [crop]);

    const handleSavePerson = async () => {
        if (!crop) return;
        
        if (selectedPerson) {
            // Link existing person
            await handlePersonLink(crop, selectedPerson);
        } else if (inputValue.trim()) {
            // Create new person
            await handlePersonAdded(crop, inputValue.trim());
        }
        
        setShowDropdown(false);
    };

    const handlePersonSelect = (person: Person) => {
        setSelectedPerson(person);
        setInputValue(person.name);
        setShowDropdown(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSelectedPerson(null); // Clear selection when typing
        
        if (value.trim()) {
            // TODO: Use some lib for searching per word, with ranking
            const filtered = allPersons.filter(p =>
                p.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredPersons(filtered);
            setShowDropdown(true);
        } else {
            setFilteredPersons([]);
            setShowDropdown(false);
        }
    };

    const handleInputFocus = () => {
        if (inputValue.trim() && filteredPersons.length > 0) {
            setShowDropdown(true);
        }
    };

    const handleInputBlur = () => {
        // Delay hiding dropdown to allow clicking on suggestions
        setTimeout(() => setShowDropdown(false), 150);
    };
    
    // Handle removing person from image
    const handleRemovePerson = async (personId: string) => {
        try {
            setError(null);
            await api.people.unlinkFromImage(personId, imageId);
            setSuccessMessage('Person removed from image');
            
            // Refresh image people
            const response = await api.people.getPeopleForImage(imageId);
            setImagePeople(response.people);
            
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to remove person');
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
            onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImageNaturalSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
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
                    <div className="relative inline-block">
                        {imageElement}
                        {/* Display existing person bounding boxes */}
                        {!isCropping && imageNaturalSize && imagePeople.map((person) => (
                            <PersonBoundingBox
                                key={person.id}
                                person={person}
                                imageWidth={imageNaturalSize.width}
                                imageHeight={imageNaturalSize.height}
                                imageRef={imageRef}
                                onDelete={handleRemovePerson}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Person name input - shows when cropping and crop exists */}
            {isCropping && crop && (
                <div
                    ref={inputRef}
                    className="absolute bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    hidden={!inputPosition}
                    style={{
                        left: inputPosition?.left,
                        top: inputPosition?.top,
                        minWidth: '200px'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                placeholder="Enter person's name"
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSavePerson();
                                    } else if (e.key === 'Escape') {
                                        setShowDropdown(false);
                                        setCrop(undefined);
                                    }
                                }}
                            />

                            {/* Dropdown suggestions */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-32 overflow-y-auto z-60">
                                    {filteredPersons.length === 0 && inputValue.trim() && (
                                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                            No matches found. Press Enter to create "{inputValue}"
                                        </div>
                                    )}
                                    {filteredPersons.map((person) => (
                                        <div
                                            key={person.id}
                                            className="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                            onMouseDown={() => handlePersonSelect(person)}
                                        >
                                            <div className="font-medium">{person.name}</div>
                                            {person.birthDate && (
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    Born: {new Date(person.birthDate).getFullYear()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSavePerson}
                            disabled={!selectedPerson && !inputValue.trim() || isCreatingNew || isLinking}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingNew || isLinking ? '...' : selectedPerson ? 'Link' : 'Create'}
                        </button>
                    </div>

                    {isLoadingPersons && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Loading persons...
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                            {error}
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                            {successMessage}
                        </div>
                    )}
                </div>
            )}
        </div >
    );
} 