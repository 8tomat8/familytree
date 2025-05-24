import { NextRequest, NextResponse } from 'next/server';
import { dbImageService, logger } from '@/lib';

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const filename = params.filename;

        logger.logApiRequest('GET', `/api/images/${filename}`, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const image = await dbImageService.getImage(filename);

        if (!image) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            image: {
                filename: image.filename,
                originalName: image.originalName,
                size: image.size,
                width: image.width,
                height: image.height,
                mimeType: image.mimeType,
                checksum: image.checksum,
                tags: image.tags || [],
                description: image.description,
                isActive: image.isActive,
                createdAt: image.createdAt,
                updatedAt: image.updatedAt
            }
        });

    } catch (error) {
        logger.logServerError(
            `Failed to get image ${params.filename}`,
            error as Error,
            {
                method: 'GET',
                url: `/api/images/${params.filename}`,
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to get image' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const filename = params.filename;
        const body = await request.json();

        logger.logApiRequest('PATCH', `/api/images/${filename}`, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Check if image exists
        const existingImage = await dbImageService.getImage(filename);
        if (!existingImage) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        let updated = false;

        // Update tags if provided
        if (body.tags !== undefined) {
            if (!Array.isArray(body.tags)) {
                return NextResponse.json(
                    { error: 'Tags must be an array of strings' },
                    { status: 400 }
                );
            }

            const success = await dbImageService.updateImageTags(filename, body.tags);
            if (success) updated = true;
        }

        // Update description if provided
        if (body.description !== undefined) {
            const success = await dbImageService.updateImageDescription(filename, body.description);
            if (success) updated = true;
        }

        if (!updated) {
            return NextResponse.json(
                { error: 'No valid fields provided for update' },
                { status: 400 }
            );
        }

        // Get updated image
        const updatedImage = await dbImageService.getImage(filename);

        return NextResponse.json({
            success: true,
            message: 'Image updated successfully',
            image: {
                filename: updatedImage!.filename,
                tags: updatedImage!.tags || [],
                description: updatedImage!.description,
                updatedAt: updatedImage!.updatedAt
            }
        });

    } catch (error) {
        logger.logServerError(
            `Failed to update image ${params.filename}`,
            error as Error,
            {
                method: 'PATCH',
                url: `/api/images/${params.filename}`,
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to update image' },
            { status: 500 }
        );
    }
} 