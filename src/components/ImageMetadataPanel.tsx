'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ImageMetadata, ImageUpdateResponse } from '../types';

interface ImageMetadataPanelProps {
    image: ImageMetadata;
    onUpdate: (updatedImage: Partial<ImageMetadata>) => void;
}

export function ImageMetadataPanel({ image, onUpdate }: ImageMetadataPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tags, setTags] = useState<string[]>(image.tags || []);
    const [description, setDescription] = useState(image.description || '');
    const [newTag, setNewTag] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Image Metadata
                </h3>
            </div>

            {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Tags Section */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                </label>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add new tag"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add image description"
                    rows={3}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200 resize-none"
                />
            </div>

            {/* Image Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                        <span className="font-medium">Size:</span> {Math.round(image.size / 1024)} KB
                    </div>
                    {image.width && image.height && (
                        <div>
                            <span className="font-medium">Dimensions:</span> {image.width} × {image.height}
                        </div>
                    )}
                    <div>
                        <span className="font-medium">Type:</span> {image.mimeType}
                    </div>
                    <div>
                        <span className="font-medium">Updated:</span> {new Date(image.updatedAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
} 