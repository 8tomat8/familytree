// Base image metadata interface
export interface ImageMetadata {
    filename: string;
    size: number;
    width?: number;
    height?: number;
    mimeType: string;
    tags: string[];
    description?: string;
    dateTaken?: string; // RFC3339 format
    datePrecision?: string; // 'hour', 'day', 'month', 'year', 'decade'
    createdAt: string;
    updatedAt: string;
}

// Sync operation result
export interface SyncResult {
    synced: number;
    errors: string[];
}

// API Response types
export interface ImageListResponse {
    images: ImageMetadata[];
    count: number;
    sync: SyncResult;
}

export interface ImageDetailResponse {
    success: boolean;
    image: ImageMetadata & {
        originalName?: string;
        checksum?: string;
        isActive: boolean;
    };
}

export interface ImageUpdateResponse {
    success: boolean;
    message: string;
    image: {
        filename: string;
        tags: string[];
        description?: string;
        dateTaken?: string;
        datePrecision?: string;
        updatedAt: string;
    };
}

// Image update request
export interface ImageUpdateRequest {
    tags?: string[];
    description?: string;
    dateTaken?: string;
    datePrecision?: string;
}

// Rotation types
export const VALID_DEGREES = [90, 180, 270] as const;
export type ValidDegrees = (typeof VALID_DEGREES)[number];

export interface RotateImageRequest {
    degrees: ValidDegrees;
}

export interface RotateImageResponse {
    success: boolean;
    message: string;
    filename: string;
}

// Image statistics
export interface ImageStatsResponse {
    success: boolean;
    stats: {
        totalImages: number;
        activeImages: number;
        totalSize: number;
        totalSizeMB: number;
        inactiveImages: number;
    };
}

// Health check
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    uptime: number;
}

// Error response
export interface ErrorResponse {
    error: string;
}

// Image file extensions
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] as const;
export type SupportedImageExtension = typeof SUPPORTED_IMAGE_EXTENSIONS[number]; 