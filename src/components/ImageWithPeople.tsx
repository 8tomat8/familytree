'use client';

import { useState, useEffect } from 'react';
import { ImagePersonSelector } from './ImagePersonSelector';
import { api } from '@/lib/api';
import { ImagePeopleResponse } from '@shared/types';

interface LinkedPerson {
    id: string;
    name: string;
    birthDate?: string;
    deathDate?: string;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

interface ImageWithPeopleProps {
    src: string;
    imageId: string;
    refreshKey?: number;
    showPersonSelector?: boolean;
}

export function ImageWithPeople({
    src,
    imageId,
    refreshKey = 0,
    showPersonSelector = true
}: ImageWithPeopleProps) {
    const [linkedPeople, setLinkedPeople] = useState<LinkedPerson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLinkedPeople = async () => {
        try {
            setIsLoading(true);
            const response = await api.people.getPeopleForImage(imageId);
            setLinkedPeople(response.people);
        } catch (error) {
            console.error('Error fetching linked people:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLinkedPeople();
    }, [imageId]);

    const handlePersonLinked = () => {
        // Refresh the linked people when a new person is linked
        fetchLinkedPeople();
    };

    const handleRemovePerson = async (personId: string) => {
        try {
            await api.people.unlinkFromImage(personId, imageId);
            await fetchLinkedPeople(); // Refresh the list
        } catch (error) {
            console.error('Error removing person from image:', error);
        }
    };

    if (showPersonSelector) {
        return (
            <div className="relative w-full h-full">
                <ImagePersonSelector
                    imageSrc={src}
                    imageId={imageId}
                    refreshKey={refreshKey}
                    onPersonLinked={handlePersonLinked}
                />

                {/* Overlay bounding boxes for linked people */}
                {!isLoading && linkedPeople.map((person) => (
                    person.boundingBox && (
                        <div
                            key={person.id}
                            className="absolute border-2 border-green-500 bg-green-500 bg-opacity-10"
                            style={{
                                left: `${person.boundingBox.x}px`,
                                top: `${person.boundingBox.y}px`,
                                width: `${person.boundingBox.width}px`,
                                height: `${person.boundingBox.height}px`,
                            }}
                        >
                            {/* Person label */}
                            <div className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                                {person.name}
                                <button
                                    onClick={() => handleRemovePerson(person.id)}
                                    className="ml-2 text-xs hover:text-red-200"
                                    title="Remove person"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )
                ))}
            </div>
        );
    }

    // Simple image display without person selector
    const imageFullSrc = `/images/${encodeURIComponent(src)}?v=${refreshKey}`;
    return (
        <div className="relative w-full h-full">
            <img
                src={imageFullSrc}
                alt={src}
                className="w-full h-full object-contain"
            />

            {/* Overlay bounding boxes for linked people */}
            {!isLoading && linkedPeople.map((person) => (
                person.boundingBox && (
                    <div
                        key={person.id}
                        className="absolute border-2 border-green-500 bg-green-500 bg-opacity-10"
                        style={{
                            left: `${person.boundingBox.x}px`,
                            top: `${person.boundingBox.y}px`,
                            width: `${person.boundingBox.width}px`,
                            height: `${person.boundingBox.height}px`,
                        }}
                    >
                        {/* Person label */}
                        <div className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                            {person.name}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
} 