import { NextRequest, NextResponse } from 'next/server';
import { imageService, logger } from '@/lib';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/images', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Get images from database
        const images = await imageService.listImages();

        const response = NextResponse.json({
            images: images.map(img => ({
                id: img.id,
                filename: img.filename,
                size: img.size,
                width: img.width,
                height: img.height,
                mimeType: img.mimeType,
                tags: img.tags || [],
                description: img.description,
                dateTaken: img.dateTaken?.toISOString(),
                datePrecision: img.datePrecision,
                createdAt: img.createdAt,
                updatedAt: img.updatedAt
            })),
            count: images.length,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to read images from database:' + error },
            { status: 500 }
        );
    }
} 