import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { imageService, logger } from '@/lib';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;

    // Validate imageId parameter
    const idValidation = z.string().uuid();
    if (!idValidation.safeParse(imageId).success) {
        return NextResponse.json({ error: 'Invalid imageId parameter. Must be a UUID.' }, { status: 400 });
    }

    try {
        logger.logApiRequest('GET', `/api/images/${imageId}`, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const image = await imageService.getImageById(imageId);

        if (!image) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            image: {
                id: image.id,
                filename: image.filename,
                originalName: image.originalName,
                size: image.size,
                width: image.width,
                height: image.height,
                mimeType: image.mimeType,
                checksum: image.checksum,
                tags: image.tags || [],
                description: image.description,
                dateTaken: image.dateTaken?.toISOString(),
                datePrecision: image.datePrecision,
                isActive: image.isActive,
                createdAt: image.createdAt,
                updatedAt: image.updatedAt
            }
        });

    } catch (error) {
        logger.logServerError(
            `Failed to get image ${imageId}`,
            error as Error,
            {
                method: 'GET',
                url: `/api/images/${imageId}`,
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
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;

    try {
        const body = await request.json();

        // Validate imageId parameter first
        const idValidation = z.string().uuid();
        if (!idValidation.safeParse(imageId).success) {
            return NextResponse.json({ error: 'Invalid imageId parameter. Must be a UUID.' }, { status: 400 });
        }

        // Validate request body using Zod
        const UpdateSchema = z.object({
            tags: z.array(z.string()).optional(),
            description: z.string().optional(),
            dateTaken: z.string().datetime({ offset: true }).optional().nullable(),
            datePrecision: z.enum(['hour','day','month','year','decade']).optional()
        }).strict();

        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            // Check for specific datePrecision validation error
            const precisionError = parsed.error.issues.find(issue => 
                issue.path.includes('datePrecision') && issue.code === 'invalid_enum_value'
            );
            if (precisionError) {
                return NextResponse.json({ 
                    error: 'Invalid date precision. Must be one of: hour, day, month, year, decade' 
                }, { status: 400 });
            }
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const validBody = parsed.data;

        logger.logApiRequest('PATCH', `/api/images/${imageId}`, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Check if image exists
        const existingImage = await imageService.getImageById(imageId);
        if (!existingImage) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        let updated = false;

        // Update tags if provided
        if (validBody.tags !== undefined) {
            if (!Array.isArray(body.tags)) {
                return NextResponse.json(
                    { error: 'Tags must be an array of strings' },
                    { status: 400 }
                );
            }

            const success = await imageService.updateImageTagsById(imageId, validBody.tags);
            if (success) updated = true;
        }

        // Update description if provided
        if (validBody.description !== undefined) {
            const success = await imageService.updateImageDescriptionById(imageId, validBody.description);
            if (success) updated = true;
        }

        // Update date taken and precision if provided
        if (validBody.dateTaken !== undefined || validBody.datePrecision !== undefined) {
            // Validate dateTaken format if provided
            if (validBody.dateTaken !== undefined && validBody.dateTaken !== null) {
                try {
                    new Date(body.dateTaken).toISOString(); // Validate RFC3339 format
                } catch {
                    return NextResponse.json(
                        { error: 'dateTaken must be in RFC3339 format (e.g., 2023-12-25T10:30:00Z)' },
                        { status: 400 }
                    );
                }
            }

            // Validate datePrecision if provided
            if (validBody.datePrecision !== undefined && validBody.datePrecision !== null) {
                const validPrecisions = ['hour', 'day', 'month', 'year', 'decade'];
                if (!validPrecisions.includes(body.datePrecision)) {
                    return NextResponse.json(
                        { error: 'datePrecision must be one of: hour, day, month, year, decade' },
                        { status: 400 }
                    );
                }
            }

            const success = await imageService.updateImageDateById(imageId, validBody.dateTaken!, validBody.datePrecision);
            if (success) updated = true;
        }

        if (!updated) {
            return NextResponse.json(
                { error: 'No valid fields provided for update' },
                { status: 400 }
            );
        }

        // Get updated image
        const updatedImage = await imageService.getImageById(imageId);

        return NextResponse.json({
            success: true,
            message: 'Image updated successfully',
            image: {
                id: updatedImage!.id,
                filename: updatedImage!.filename,
                tags: updatedImage!.tags || [],
                description: updatedImage!.description,
                dateTaken: updatedImage!.dateTaken?.toISOString(),
                datePrecision: updatedImage!.datePrecision,
                updatedAt: updatedImage!.updatedAt
            }
        });

    } catch (error) {
        logger.logServerError(
            `Failed to update image ${imageId}`,
            error as Error,
            {
                method: 'PATCH',
                url: `/api/images/${imageId}`,
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to update image' },
            { status: 500 }
        );
    }
} 