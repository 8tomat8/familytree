import { NextRequest, NextResponse } from 'next/server';
import { dbImageService, logger } from '@/lib';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/images', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Get images from database
        const images = await dbImageService.listImages();

        const response = NextResponse.json({
            images: images.map(img => ({
                filename: img.filename,
                size: img.size,
                width: img.width,
                height: img.height,
                mimeType: img.mimeType,
                tags: img.tags || [],
                description: img.description,
                createdAt: img.createdAt,
                updatedAt: img.updatedAt
            })),
            count: images.length,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to read images from database' },
            { status: 500 }
        );
    }
} 