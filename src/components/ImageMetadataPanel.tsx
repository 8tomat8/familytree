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

    // Parse existing dateTaken into year, month, day
    const parseExistingDate = () => {
        if (image.dateTaken) {
            const date = new Date(image.dateTaken);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1, // getMonth() returns 0-11
                day: date.getDate()
            };
        }
        return { year: 0, month: 0, day: 0 };
    };

    const [dateValues, setDateValues] = useState(parseExistingDate());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Construct dateTaken and datePrecision based on provided values
            let dateTaken: string | undefined;
            let datePrecision: string | undefined;

            if (dateValues.year > 0) {
                if (dateValues.month > 0 && dateValues.day > 0) {
                    // Full date provided
                    dateTaken = new Date(dateValues.year, dateValues.month - 1, dateValues.day).toISOString();
                    datePrecision = 'day';
                } else if (dateValues.month > 0) {
                    // Year and month provided
                    dateTaken = new Date(dateValues.year, dateValues.month - 1, 1).toISOString();
                    datePrecision = 'month';
                } else {
                    // Only year provided
                    dateTaken = new Date(dateValues.year, 0, 1).toISOString();
                    datePrecision = 'year';
                }
            }

            await onUpdate({
                filename: image.filename,
                description,
                tags,
                dateTaken,
                datePrecision,
            });
            appNotifications.metadataSaved();
        } catch (error) {
            appNotifications.metadataSaveError(error as string);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = description !== (image.description || '') ||
        JSON.stringify(tags) !== JSON.stringify(image.tags || []) ||
        JSON.stringify(dateValues) !== JSON.stringify(parseExistingDate());

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

            {/* Date Taken Section */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Taken
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
                        <input
                            type="number"
                            value={dateValues.year || ''}
                            onChange={(e) => setDateValues(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                            placeholder="YYYY"
                            min="1800"
                            max="2100"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Month</label>
                        <input
                            type="number"
                            value={dateValues.month || ''}
                            onChange={(e) => setDateValues(prev => ({ ...prev, month: parseInt(e.target.value) || 0 }))}
                            placeholder="MM"
                            min="0"
                            max="12"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Day</label>
                        <input
                            type="number"
                            value={dateValues.day || ''}
                            onChange={(e) => setDateValues(prev => ({ ...prev, day: parseInt(e.target.value) || 0 }))}
                            placeholder="DD"
                            min="0"
                            max="31"
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave as 0 for unknown values. Precision is determined by the most specific value provided.
                </p>
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
                    {image.dateTaken && (
                        <div className="col-span-2">
                            <span className="font-medium">Date Taken:</span> {new Date(image.dateTaken).toLocaleDateString()}
                            {image.datePrecision && <span className="ml-1 text-gray-400">({image.datePrecision} precision)</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 