export interface ImageMetadata {
    filename: string;
    size: number;
    width?: number;
    height?: number;
    mimeType: string;
    tags: string[];
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SyncResult {
    synced: number;
    errors: string[];
}

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
        updatedAt: string;
    };
} 