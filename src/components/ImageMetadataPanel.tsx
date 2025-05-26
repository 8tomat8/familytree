'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { ImageMetadata } from '@shared/types';
import { TagsInput } from './TagsInput';
import { appNotifications } from '../lib/notifications';

interface ImageMetadataPanelProps {
    image: ImageMetadata;
    onUpdate: (updatedImage: Partial<ImageMetadata>) => void;
}

export function ImageMetadataPanel({ image, onUpdate }: ImageMetadataPanelProps) {
    const [tags, setTags] = useState<string[]>(image.tags || []);
    const [description, setDescription] = useState(image.description || '');
    const [isSaving, setIsSaving] = useState(false);
    // Notifications are now handled via appNotifications utility

    const handleSave = async () => {
        setIsSaving(true);

        try {
            await onUpdate({
                filename: image.filename,
                description,
                tags,
            });
            appNotifications.metadataSaved();
        } catch (error) {
            appNotifications.metadataSaveError(error as string);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = description !== (image.description || '') ||
        JSON.stringify(tags) !== JSON.stringify(image.tags || [])

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Image Metadata
                </h3>
                <div className="flex gap-2">
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faSave} className="mr-1" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tags Section */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                </label>
                <TagsInput
                    tags={tags}
                    onTagsChange={setTags}
                    placeholder="Add new tag"
                />
            </div>

            {/* Description Section */}
            <div className="mb-4">
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