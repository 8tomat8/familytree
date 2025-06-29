import { NextRequest, NextResponse } from 'next/server';
import { peopleService, logger } from '@/lib';

export async function POST(request: NextRequest) {
    try {
        logger.logApiRequest('POST', '/api/people/link-to-image', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const body = await request.json();
        const { personId, imageId, boundingBox } = body;

        // Validate required fields
        if (!personId || !imageId) {
            return NextResponse.json(
                { error: 'personId and imageId are required' },
                { status: 400 }
            );
        }

        // Validate bounding box format if provided
        if (boundingBox) {
            const { x, y, width, height } = boundingBox;
            if (
                typeof x !== 'number' ||
                typeof y !== 'number' ||
                typeof width !== 'number' ||
                typeof height !== 'number'
            ) {
                return NextResponse.json(
                    { error: 'boundingBox must contain numeric x, y, width, height values' },
                    { status: 400 }
                );
            }
        }

        await peopleService.linkPersonToImage({
            personId,
            imageId,
            boundingBox
        });

        return NextResponse.json({
            success: true,
            message: 'Person successfully linked to image'
        });

    } catch (error: any) {
        console.error('Error linking person to image:', error);

        // Handle specific error types
        const status = error.message?.includes('not found') ? 404 :
            error.message?.includes('already linked') ? 409 :
                error.message?.includes('Invalid') || error.message?.includes('exceeds') ? 400 : 500;

        return NextResponse.json(
            { error: error.message || 'Failed to link person to image' },
            { status }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        logger.logApiRequest('DELETE', '/api/people/link-to-image', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const { searchParams } = new URL(request.url);
        const personId = searchParams.get('personId');
        const imageId = searchParams.get('imageId');

        if (!personId || !imageId) {
            return NextResponse.json(
                { error: 'personId and imageId query parameters are required' },
                { status: 400 }
            );
        }

        await peopleService.unlinkPersonFromImage(personId, imageId);

        return NextResponse.json({
            success: true,
            message: 'Person successfully unlinked from image'
        });

    } catch (error: any) {
        console.error('Error unlinking person from image:', error);
        
        // Handle specific error types
        const status = error.message?.includes('No link found') ? 404 : 500;
        
        return NextResponse.json(
            { error: error.message || 'Failed to unlink person from image' },
            { status }
        );
    }
} 