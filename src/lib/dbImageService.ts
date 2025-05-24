import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { db, images, Image, NewImage } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { SupportedImageExtension, SUPPORTED_IMAGE_EXTENSIONS } from '@/types/image';

export class DatabaseImageService {
    private readonly imagesDir: string;

    constructor() {
        this.imagesDir = path.join(process.cwd(), 'public', 'images');
    }

    /**
     * Calculate SHA-256 checksum of file
     */
    private async calculateChecksum(buffer: Buffer): Promise<string> {
        return createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Get image metadata using Sharp
     */
    private async getImageMetadata(buffer: Buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                width: metadata.width || null,
                height: metadata.height || null,
                mimeType: `image/${metadata.format}` || 'application/octet-stream'
            };
        } catch (error) {
            console.error('Error getting image metadata:', error);
            return {
                width: null,
                height: null,
                mimeType: 'application/octet-stream'
            };
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
     * Get the full path to a specific image file
     */
    getImagePath(filename: string): string {
        return path.join(this.imagesDir, filename);
    }

    /**
     * Register a single image in the database
     */
    async registerImage(filename: string): Promise<Image | null> {
        const imagePath = this.getImagePath(filename);

        try {
            // Check if file exists
            const stats = await fs.stat(imagePath);
            const buffer = await fs.readFile(imagePath);

            // Get image metadata
            const metadata = await this.getImageMetadata(buffer);
            const checksum = await this.calculateChecksum(buffer);

            // Check if image already exists in DB
            const existingImage = await db.select()
                .from(images)
                .where(eq(images.filename, filename))
                .limit(1);

            if (existingImage.length > 0) {
                // Update existing record
                const [updatedImage] = await db.update(images)
                    .set({
                        size: stats.size,
                        width: metadata.width,
                        height: metadata.height,
                        mimeType: metadata.mimeType,
                        checksum,
                        updatedAt: new Date(),
                        isActive: true
                    })
                    .where(eq(images.filename, filename))
                    .returning();

                return updatedImage;
            } else {
                // Create new record
                const newImage: NewImage = {
                    filename,
                    originalName: filename,
                    path: imagePath,
                    size: stats.size,
                    width: metadata.width,
                    height: metadata.height,
                    mimeType: metadata.mimeType,
                    checksum,
                    isActive: true
                };

                const [createdImage] = await db.insert(images)
                    .values(newImage)
                    .returning();

                return createdImage;
            }
        } catch (error) {
            console.error(`Error registering image ${filename}:`, error);
            return null;
        }
    }

    /**
     * Sync all images from filesystem to database
     */
    async syncImages(): Promise<{ synced: number; errors: string[] }> {
        const errors: string[] = [];
        let synced = 0;

        if (!(await this.directoryExists())) {
            return { synced: 0, errors: ['Images directory does not exist'] };
        }

        try {
            const files = await fs.readdir(this.imagesDir);
            const imageFiles = files.filter(file => this.isValidImageFormat(file));

            // Mark all existing images as inactive first
            await db.update(images).set({ isActive: false });

            // Process each image file
            for (const filename of imageFiles) {
                const result = await this.registerImage(filename);
                if (result) {
                    synced++;
                } else {
                    errors.push(`Failed to register ${filename}`);
                }
            }

            console.log(`Synced ${synced} images, ${errors.length} errors`);
            return { synced, errors };
        } catch (error) {
            console.error('Error syncing images:', error);
            return { synced: 0, errors: [`Failed to sync images: ${error}`] };
        }
    }

    /**
     * Get list of all active images from database
     */
    async listImages(): Promise<Image[]> {
        try {
            return await db.select()
                .from(images)
                .where(eq(images.isActive, true))
                .orderBy(desc(images.createdAt));
        } catch (error) {
            console.error('Error listing images from database:', error);
            return [];
        }
    }

    /**
     * Get image by filename from database
     */
    async getImage(filename: string): Promise<Image | null> {
        try {
            const result = await db.select()
                .from(images)
                .where(eq(images.filename, filename))
                .limit(1);

            return result[0] || null;
        } catch (error) {
            console.error(`Error getting image ${filename}:`, error);
            return null;
        }
    }

    /**
     * Remove image from database (soft delete)
     */
    async removeImage(filename: string): Promise<boolean> {
        try {
            const result = await db.update(images)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(images.filename, filename));

            return true;
        } catch (error) {
            console.error(`Error removing image ${filename}:`, error);
            return false;
        }
    }

    /**
     * Update image tags
     */
    async updateImageTags(filename: string, tags: string[]): Promise<boolean> {
        try {
            await db.update(images)
                .set({
                    tags: tags,
                    updatedAt: new Date()
                })
                .where(eq(images.filename, filename));

            return true;
        } catch (error) {
            console.error(`Error updating tags for ${filename}:`, error);
            return false;
        }
    }

    /**
     * Update image description
     */
    async updateImageDescription(filename: string, description: string): Promise<boolean> {
        try {
            await db.update(images)
                .set({
                    description,
                    updatedAt: new Date()
                })
                .where(eq(images.filename, filename));

            return true;
        } catch (error) {
            console.error(`Error updating description for ${filename}:`, error);
            return false;
        }
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{
        totalImages: number;
        activeImages: number;
        totalSize: number;
    }> {
        try {
            // This would require aggregation functions - simplified for now
            const allImages = await db.select().from(images);
            const activeImages = allImages.filter(img => img.isActive);
            const totalSize = activeImages.reduce((sum, img) => sum + (img.size || 0), 0);

            return {
                totalImages: allImages.length,
                activeImages: activeImages.length,
                totalSize
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { totalImages: 0, activeImages: 0, totalSize: 0 };
        }
    }

    // TODO: rotate image
}

// Export singleton instance
export const dbImageService = new DatabaseImageService(); 