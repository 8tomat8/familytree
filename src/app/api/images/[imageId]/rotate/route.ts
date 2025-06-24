import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import { RotateImageRequest, VALID_DEGREES } from '@shared/types';
import { imageService, logger } from '@/lib';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;

    // Validate imageId parameter
    const idValidation = z.string().uuid();
    if (!idValidation.safeParse(imageId).success) {
        return NextResponse.json({ error: 'Invalid imageId parameter. Must be a UUID.' }, { status: 400 });
    }
    const apiPath = `/api/images/${imageId}/rotate`;

    try {
        logger.logApiRequest('POST', apiPath, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const body = await request.json();
        // Validate request body
        const RotateSchema = z.object({ degrees: z.union([z.literal(90), z.literal(180), z.literal(270)]) });
        const parseBody = RotateSchema.safeParse(body);
        if (!parseBody.success) {
            return NextResponse.json({ error: 'Invalid request body: degrees must be 90, 180, or 270' }, { status: 400 });
        }
        const { degrees }: RotateImageRequest = parseBody.data;

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

        // Get image from database
        const image = await imageService.getImageById(imageId);
        if (!image) {
            logger.logApiResponse('POST', apiPath, 404, {
                userAgent: request.headers.get('user-agent') || 'unknown'
            });
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        const filename = image.filename;

        // Check if file exists and is valid format
        if (!await imageService.imageExists(filename)) {
            logger.logApiResponse('POST', apiPath, 404, {
                userAgent: request.headers.get('user-agent') || 'unknown'
            });
            return NextResponse.json(
                { error: 'Image file not found' },
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

        // Update image metadata in database (dimensions change for 90° and 270° rotations)
        await imageService.registerImage(filename);

        logger.logApiResponse('POST', apiPath, 200, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({
            success: true,
            message: `Image rotated ${degrees} degrees`,
            filename: image.filename
        });

    } catch (error) {
        logger.logServerError(
            `Failed to rotate image: ${imageId}`,
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