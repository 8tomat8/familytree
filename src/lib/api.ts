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
    HealthCheckResponse,
    PeopleListResponse,
    PersonCreateRequest,
    PersonCreateResponse,
    PersonLinkRequest,
    PersonLinkResponse,
    PersonUnlinkResponse,
    ImagePeopleResponse
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
    async getImage(imageId: string): Promise<ImageDetailResponse> {
        const response = await apiClient.get<ImageDetailResponse>(`/api/images/${encodeURIComponent(imageId)}`);
        if (!response.ok) {
            throw new Error(response.error || 'Failed to fetch image details');
        }
        return response.data!;
    },

    // Update image metadata (tags and description)
    async updateImage(imageId: string, updates: ImageUpdateRequest): Promise<ImageUpdateResponse> {
        const response = await apiClient.patch<ImageUpdateResponse>(
            `/api/images/${encodeURIComponent(imageId)}`,
            updates
        );
        if (!response.ok) {
            throw new Error(response.error || 'Failed to update image metadata');
        }
        return response.data!;
    },

    // Rotate image
    async rotateImage(imageId: string, degrees: ValidDegrees): Promise<RotateImageResponse> {
        const request: RotateImageRequest = { degrees };
        const response = await apiClient.post<RotateImageResponse>(
            `/api/images/${encodeURIComponent(imageId)}/rotate`,
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

// People API
export const peopleApi = {
    // Get all people
    async getPeople(): Promise<PeopleListResponse> {
        const response = await apiClient.get<PeopleListResponse>('/api/people');
        if (!response.ok) {
            throw new Error(response.error || 'Failed to fetch people');
        }
        return response.data!;
    },

    // Create new person
    async createPerson(personData: PersonCreateRequest): Promise<PersonCreateResponse> {
        const response = await apiClient.post<PersonCreateResponse>('/api/people', personData);
        if (!response.ok) {
            throw new Error(response.error || 'Failed to create person');
        }
        return response.data!;
    },

    // Link person to image
    async linkToImage(request: PersonLinkRequest): Promise<PersonLinkResponse> {
        const response = await apiClient.post<PersonLinkResponse>('/api/people/link-to-image', request);
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('This person is already linked to this image');
            }
            throw new Error(response.error || 'Failed to link person to image');
        }
        return response.data!;
    },

    // Unlink person from image
    async unlinkFromImage(personId: string, imageId: string): Promise<PersonUnlinkResponse> {
        const response = await apiClient.delete<PersonUnlinkResponse>(
            `/api/people/link-to-image?personId=${personId}&imageId=${imageId}`
        );
        if (!response.ok) {
            throw new Error(response.error || 'Failed to unlink person from image');
        }
        return response.data!;
    },

    // Get people for specific image
    async getPeopleForImage(imageId: string): Promise<ImagePeopleResponse> {
        const response = await apiClient.get<ImagePeopleResponse>(`/api/images/${imageId}/people`);
        if (!response.ok) {
            throw new Error(response.error || 'Failed to get people for image');
        }
        return response.data!;
    }
};

// Export all APIs
export const api = {
    images: imagesApi,
    health: healthApi,
    people: peopleApi
}; 