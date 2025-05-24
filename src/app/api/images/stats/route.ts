import { NextRequest, NextResponse } from 'next/server';
import { dbImageService, logger } from '@/lib';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/images/stats', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const stats = await dbImageService.getStats();

        return NextResponse.json({
            success: true,
            stats: {
                totalImages: stats.totalImages,
                activeImages: stats.activeImages,
                totalSize: stats.totalSize,
                totalSizeMB: Math.round(stats.totalSize / (1024 * 1024) * 100) / 100,
                inactiveImages: stats.totalImages - stats.activeImages
            }
        });

    } catch (error) {
        logger.logServerError(
            'Failed to get image statistics',
            error as Error,
            {
                method: 'GET',
                url: '/api/images/stats',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to get image statistics' },
            { status: 500 }
        );
    }
} 