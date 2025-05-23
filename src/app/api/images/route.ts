import { NextRequest, NextResponse } from 'next/server';
import { imageService, logger } from '@/lib';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/images', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const images = await imageService.listImages();

        const response = NextResponse.json({
            images,
            count: images.length
        });

        logger.logApiResponse('GET', '/api/images', 200, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        return response;
    } catch (error) {
        logger.logServerError(
            'Failed to read images directory',
            error as Error,
            {
                method: 'GET',
                url: '/api/images',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to read images directory' },
            { status: 500 }
        );
    }
} 