'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faRotateRight, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { ImageMetadata } from '@shared/types';
import { TagsInput } from './TagsInput';
import { DatePicker } from './DatePicker';
import { appNotifications } from '../lib/notifications';
import { api } from '../lib/api';

interface ImageMetadataPanelProps {
    image: ImageMetadata;
    onUpdate: (updatedImage: Partial<ImageMetadata>) => void;
    onImageRotated: (filename: string) => void;
}

export function ImageMetadataPanel({ image, onUpdate, onImageRotated }: ImageMetadataPanelProps) {
    const { t } = useTranslation();
    const [tags, setTags] = useState<string[]>(image.tags || []);
    const [description, setDescription] = useState(image.description || '');
    const [dateTaken, setDateTaken] = useState<string | undefined>(image.dateTaken);
    const [datePrecision, setDatePrecision] = useState<string | undefined>(image.datePrecision);
    const [isSaving, setIsSaving] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    // Update state when image prop changes
    useEffect(() => {
        setTags(image.tags || []);
        setDescription(image.description || '');
        setDateTaken(image.dateTaken);
        setDatePrecision(image.datePrecision);
    }, [image]);

    const handleDateChange = (newDateTaken?: string, newDatePrecision?: string) => {
        setDateTaken(newDateTaken);
        setDatePrecision(newDatePrecision);
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            await onUpdate({
                id: image.id,
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

    // Handle image rotation
    const handleRotate = async (degrees: 90 | 270) => {
        setIsRotating(true);
        try {
            await api.images.rotateImage(image.id, degrees);
            onImageRotated(image.filename);
        } catch (error) {
            appNotifications.imageRotateError(error as string);
        } finally {
            setIsRotating(false);
        }
    };

    const hasChanges = description !== (image.description || '') ||
        JSON.stringify(tags) !== JSON.stringify(image.tags || []) ||
        dateTaken !== image.dateTaken ||
        datePrecision !== image.datePrecision;

    // Helper function to format file size with translations
    const formatFileSize = (sizeInBytes: number): string => {
        const kb = sizeInBytes / 1024;
        if (kb < 1024) {
            return `${Math.round(kb)} ${t('units.kb')}`;
        }
        const mb = kb / 1024;
        if (mb < 1024) {
            return `${Math.round(mb * 10) / 10} ${t('units.mb')}`;
        }
        const gb = mb / 1024;
        return `${Math.round(gb * 100) / 100} ${t('units.gb')}`;
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('metadata.title')}
                </h3>
                <div className="flex gap-2">
                    {/* Rotation buttons */}
                    <button
                        onClick={() => handleRotate(270)}
                        disabled={isRotating}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                        title={t('metadata.rotateLeft')}
                    >
                        <FontAwesomeIcon icon={faRotateLeft} />
                    </button>
                    <button
                        onClick={() => handleRotate(90)}
                        disabled={isRotating}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                        title={t('metadata.rotateRight')}
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                    </button>
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faSave} className="mr-1" />
                            {isSaving ? t('metadata.saving') : t('metadata.save')}
                        </button>
                    )}
                </div>
            </div>

            {/* Date Taken Section */}
            <div className="mb-4">
                <DatePicker
                    dateTaken={dateTaken}
                    datePrecision={datePrecision}
                    onChange={handleDateChange}
                />
            </div>

            {/* Tags Section */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('metadata.tags')}
                </label>
                <TagsInput
                    tags={tags}
                    onTagsChange={setTags}
                    placeholder={t('tags.addNew')}
                />
            </div>

            {/* Description Section */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('metadata.description')}
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('metadata.description')}
                    rows={3}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200 resize-none"
                />
            </div>

            {/* Image Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                        <span className="font-medium">{t('metadata.size')}:</span> {formatFileSize(image.size)}
                    </div>
                    {image.width && image.height && (
                        <div>
                            <span className="font-medium">{t('metadata.dimensions')}:</span> {image.width} × {image.height}
                        </div>
                    )}
                    <div>
                        <span className="font-medium">{t('metadata.type')}:</span> {image.mimeType}
                    </div>
                    <div>
                        <span className="font-medium">{t('metadata.updated')}:</span> {new Date(image.updatedAt).toLocaleDateString()}
                    </div>
                    {image.dateTaken && (
                        <div className="col-span-2">
                            <span className="font-medium">{t('metadata.dateTaken')}:</span> {new Date(image.dateTaken).toLocaleDateString()}
                            {image.datePrecision && <span className="ml-1 text-gray-400">({t('metadata.precision', { precision: image.datePrecision })})</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 