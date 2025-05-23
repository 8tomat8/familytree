// Supported image file extensions (all support rotation)
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] as const;

// Valid rotation degrees
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

export interface ErrorResponse {
    error: string;
} 