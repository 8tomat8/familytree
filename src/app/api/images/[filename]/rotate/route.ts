import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { RotateImageRequest, VALID_DEGREES } from '@/types/image';
import { imageService, logger } from '@/lib';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const apiPath = `/api/images/${filename}/rotate`;

    try {
        logger.logApiRequest('POST', apiPath, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const { degrees }: RotateImageRequest = await request.json();

        // Validate rotation degrees
        if (!VALID_DEGREES.includes(degrees)) {
            logger.logApiResponse('POST', apiPath, 400, {
                userAgent: request.headers.get('user-agent') || 'unknown'
            });
            return NextResponse.json(
                { error: 'Invalid rotation degrees. Must be 90, 180, or 270.' },
                { status: 400 }
            );
        }

        // Check if file exists and is valid format
        if (!await imageService.imageExists(filename)) {
            logger.logApiResponse('POST', apiPath, 404, {
                userAgent: request.headers.get('user-agent') || 'unknown'
            });
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        if (!imageService.isValidImageFormat(filename)) {
            logger.logApiResponse('POST', apiPath, 400, {
                userAgent: request.headers.get('user-agent') || 'unknown'
            });
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

        logger.logApiResponse('POST', apiPath, 200, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({
            success: true,
            message: `Image rotated ${degrees} degrees`,
            filename
        });

    } catch (error) {
        logger.logServerError(
            `Failed to rotate image: ${filename}`,
            error as Error,
            {
                method: 'POST',
                url: apiPath,
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to rotate image' },
            { status: 500 }
        );
    }
} 