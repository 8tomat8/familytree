import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const logEntry = await request.json();

        // Log the client-side error on the server
        console.log('[CLIENT_LOG]', JSON.stringify({
            ...logEntry,
            serverTimestamp: new Date().toISOString(),
            clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
        }, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.logServerError(
            'Failed to process client log entry',
            error as Error,
            {
                method: 'POST',
                url: '/api/logs',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        );

        return NextResponse.json(
            { error: 'Failed to process log entry' },
            { status: 500 }
        );
    }
} 