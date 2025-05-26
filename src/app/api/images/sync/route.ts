import { NextRequest, NextResponse } from 'next/server';
import { imageService, logger } from '@/lib';

export async function POST(request: NextRequest) {
    try {
        logger.logApiRequest('POST', '/api/images/sync', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Force sync filesystem with database
        const syncResult = await imageService.syncImages();

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${syncResult.synced} images`,
            synced: syncResult.synced,
            errors: syncResult.errors
        });

    } catch (error) {
        logger.logServerError(
            'Failed to sync images',
            error as Error,
            {
                method: 'POST',
                url: '/api/images/sync',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to sync images',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 