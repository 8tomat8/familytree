import { apiClient } from './apiClient';
import {
    ImageListResponse,
    ImageUpdateResponse,
    ImageDetailResponse,
    ImageUpdateRequest,
    RotateImageRequest,
    RotateImageResponse,
    ValidDegrees,
    ImageStatsResponse,
    HealthCheckResponse
} from '@shared/types';

// Images API
export const imagesApi = {
    // Get all images
    async getImages(): Promise<ImageListResponse> {
        const response = await apiClient.get<ImageListResponse>('/api/images');
        if (!response.ok) {
            throw new Error(response.error || 'Failed to fetch images');
        }
        return response.data!;
    },

    // Get single image details
    async getImage(filename: string): Promise<ImageDetailResponse> {
        const response = await apiClient.get<ImageDetailResponse>(`/api/images/${encodeURIComponent(filename)}`);
        if (!response.ok) {
            throw new Error(response.error || 'Failed to fetch image details');
        }
        return response.data!;
    },

    // Update image metadata (tags and description)
    async updateImage(filename: string, updates: ImageUpdateRequest): Promise<ImageUpdateResponse> {
        const response = await apiClient.patch<ImageUpdateResponse>(
            `/api/images/${encodeURIComponent(filename)}`,
            updates
        );
        if (!response.ok) {
            throw new Error(response.error || 'Failed to update image metadata');
        }
        return response.data!;
    },

    // Rotate image
    async rotateImage(filename: string, degrees: ValidDegrees): Promise<RotateImageResponse> {
        const request: RotateImageRequest = { degrees };
        const response = await apiClient.post<RotateImageResponse>(
            `/api/images/${encodeURIComponent(filename)}/rotate`,
            request
        );
        if (!response.ok) {
            throw new Error(response.error || 'Failed to rotate image');
        }
        return response.data!;
    },

    // Get image statistics
    async getStats(): Promise<ImageStatsResponse> {
        const response = await apiClient.get<ImageStatsResponse>('/api/images/stats');
        if (!response.ok) {
            throw new Error(response.error || 'Failed to get image statistics');
        }
        return response.data!;
    }
};

// Health API
export const healthApi = {
    async check(): Promise<HealthCheckResponse> {
        const response = await apiClient.get<HealthCheckResponse>('/api/health');
        if (!response.ok) {
            throw new Error(response.error || 'Health check failed');
        }
        return response.data!;
    }
};

// Export all APIs
export const api = {
    images: imagesApi,
    health: healthApi
}; 