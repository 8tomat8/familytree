import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/health', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const response = NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            },
            { status: 200 }
        );

        logger.logApiResponse('GET', '/api/health', 200);
        return response;
    } catch (error) {
        logger.logServerError(
            'Health check failed',
            error as Error,
            {
                method: 'GET',
                url: '/api/health',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Health check failed' },
            { status: 500 }
        );
    }
} 