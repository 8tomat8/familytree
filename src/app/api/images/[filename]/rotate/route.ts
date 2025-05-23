import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { RotateImageRequest, VALID_DEGREES } from '@/types/image';
import { imageService } from '@/lib';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const { degrees }: RotateImageRequest = await request.json();

        // Validate rotation degrees
        if (!VALID_DEGREES.includes(degrees)) {
            return NextResponse.json(
                { error: 'Invalid rotation degrees. Must be 90, 180, or 270.' },
                { status: 400 }
            );
        }

        // Check if file exists and is valid format
        if (!await imageService.imageExists(filename)) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        if (!imageService.isValidImageFormat(filename)) {
            return NextResponse.json(
                { error: 'File is not a supported image format' },
                { status: 400 }
            );
        }

        // Read and rotate the image
        const imageBuffer = await imageService.readImage(filename);
        const rotatedBuffer = await sharp(imageBuffer)
            .rotate(degrees)
            .toBuffer();

        // Write the rotated image back
        await imageService.writeImage(filename, rotatedBuffer);

        return NextResponse.json({
            success: true,
            message: `Image rotated ${degrees} degrees`,
            filename
        });

    } catch (error) {
        console.error('Error rotating image:', error);
        return NextResponse.json(
            { error: 'Failed to rotate image' },
            { status: 500 }
        );
    }
} 