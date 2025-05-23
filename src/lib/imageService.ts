import { promises as fs } from 'fs';
import path from 'path';
import { SupportedImageExtension, SUPPORTED_IMAGE_EXTENSIONS } from '@/types/image';

export class ImageService {
    private readonly imagesDir: string;

    constructor() {
        this.imagesDir = path.join(process.cwd(), 'public', 'images');
    }

    /**
     * Get the absolute path to the images directory
     */
    getImagesDir(): string {
        return this.imagesDir;
    }

    /**
     * Get the full path to a specific image file
     */
    getImagePath(filename: string): string {
        return path.join(this.imagesDir, filename);
    }

    /**
     * Check if the images directory exists
     */
    async directoryExists(): Promise<boolean> {
        try {
            await fs.access(this.imagesDir);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if a specific image file exists
     */
    async imageExists(filename: string): Promise<boolean> {
        try {
            const imagePath = this.getImagePath(filename);
            await fs.access(imagePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate if a filename is a supported image format
     */
    isValidImageFormat(filename: string): boolean {
        const ext = path.extname(filename).toLowerCase();
        return SUPPORTED_IMAGE_EXTENSIONS.includes(ext as SupportedImageExtension);
    }

    /**
     * Get list of all image files in the directory
     */
    async listImages(): Promise<string[]> {
        // Check if directory exists first
        if (!(await this.directoryExists())) {
            return [];
        }

        try {
            const files = await fs.readdir(this.imagesDir);

            // Filter and sort image files
            const imageFiles = files
                .filter(file => this.isValidImageFormat(file))
                .sort();

            return imageFiles;
        } catch (error) {
            console.error('Error reading images directory:', error);
            return [];
        }
    }

    /**
     * Get image file with stats
     */
    async getImageStats(filename: string) {
        if (!await this.imageExists(filename)) {
            throw new Error('Image not found');
        }

        if (!this.isValidImageFormat(filename)) {
            throw new Error('File is not a supported image format');
        }

        const imagePath = this.getImagePath(filename);
        const stats = await fs.stat(imagePath);

        return {
            filename,
            path: imagePath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
        };
    }

    /**
     * Read image file as buffer
     */
    async readImage(filename: string): Promise<Buffer> {
        if (!await this.imageExists(filename)) {
            throw new Error('Image not found');
        }

        if (!this.isValidImageFormat(filename)) {
            throw new Error('File is not a supported image format');
        }

        const imagePath = this.getImagePath(filename);
        return await fs.readFile(imagePath);
    }

    /**
     * Write image buffer to file
     */
    async writeImage(filename: string, buffer: Buffer): Promise<void> {
        if (!this.isValidImageFormat(filename)) {
            throw new Error('File is not a supported image format');
        }

        const imagePath = this.getImagePath(filename);
        await fs.writeFile(imagePath, buffer);
    }
}

// Export singleton instance
export const imageService = new ImageService(); 