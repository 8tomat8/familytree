import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { db, images, Image, NewImage } from '@/lib/db';
import { eq, desc, count, sum } from 'drizzle-orm';
import { SupportedImageExtension, SUPPORTED_IMAGE_EXTENSIONS } from '@shared/types';

export class ImageService {
    private readonly imagesDir: string;

    constructor() {
        this.imagesDir = path.join(process.cwd(), 'public', 'images');
    }

    // ========== FILESYSTEM OPERATIONS ==========

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
    async listFilesystemImages(): Promise<string[]> {
        if (!(await this.directoryExists())) {
            return [];
        }

        try {
            const files = await fs.readdir(this.imagesDir);
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

    // ========== DATABASE OPERATIONS ==========

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
     * Register a single image in the database
     */
    async registerImage(filename: string): Promise<Image | null> {
        const imagePath = this.getImagePath(filename);

        try {
            const stats = await fs.stat(imagePath);
            const buffer = await fs.readFile(imagePath);

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
                .orderBy(
                    desc(images.dateTaken),
                    desc(images.createdAt),
                );
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
     * Get image by ID from database
     */
    async getImageById(id: string): Promise<Image | null> {
        try {
            const result = await db.select()
                .from(images)
                .where(eq(images.id, id))
                .limit(1);

            return result[0] || null;
        } catch (error) {
            console.error(`Error getting image by ID ${id}:`, error);
            return null;
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
     * Update image date taken and precision
     */
    async updateImageDate(filename: string, dateTaken: string | null, datePrecision: string | null): Promise<boolean> {
        try {
            const updateData: Partial<typeof images.$inferInsert> = {
                updatedAt: new Date()
            };

            if (dateTaken !== undefined) {
                updateData.dateTaken = dateTaken ? new Date(dateTaken) : null;
            }

            if (datePrecision !== undefined) {
                updateData.datePrecision = datePrecision;
            }

            await db.update(images)
                .set(updateData)
                .where(eq(images.filename, filename));

            return true;
        } catch (error) {
            console.error(`Error updating date for ${filename}:`, error);
            return false;
        }
    }

    /**
     * Update image date taken and precision by ID
     */
    async updateImageDateById(id: string, dateTaken: string | null, datePrecision: string | null): Promise<boolean> {
        try {
            const updateData: Partial<typeof images.$inferInsert> = {
                updatedAt: new Date()
            };

            if (dateTaken !== undefined) {
                updateData.dateTaken = dateTaken ? new Date(dateTaken) : null;
            }

            if (datePrecision !== undefined) {
                updateData.datePrecision = datePrecision;
            }

            await db.update(images)
                .set(updateData)
                .where(eq(images.id, id));

            return true;
        } catch (error) {
            console.error(`Error updating date for image ID ${id}:`, error);
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
            const allImages = await db.select({
                totalImages: count(),
                activeImages: count(images.isActive),
                totalSize: sum(images.size),
            }).from(images);

            return {
                totalImages: allImages[0].totalImages,
                activeImages: allImages[0].activeImages,
                totalSize: Number(allImages[0].totalSize) || 0,
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { totalImages: 0, activeImages: 0, totalSize: 0 };
        }
    }

    /**
     * Update image tags by ID
     */
    async updateImageTagsById(id: string, tags: string[]): Promise<boolean> {
        try {
            await db.update(images)
                .set({
                    tags: tags,
                    updatedAt: new Date()
                })
                .where(eq(images.id, id));

            return true;
        } catch (error) {
            console.error(`Error updating tags for image ID ${id}:`, error);
            return false;
        }
    }

    /**
     * Update image description by ID
     */
    async updateImageDescriptionById(id: string, description: string): Promise<boolean> {
        try {
            await db.update(images)
                .set({
                    description,
                    updatedAt: new Date()
                })
                .where(eq(images.id, id));

            return true;
        } catch (error) {
            console.error(`Error updating description for image ID ${id}:`, error);
            return false;
        }
    }

    // TODO: rotate image
}

// Export singleton instance
export const imageService = new ImageService(); 