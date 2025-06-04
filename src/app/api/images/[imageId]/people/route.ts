import { NextRequest, NextResponse } from 'next/server';
import { peopleService, logger } from '@/lib';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    try {
        const { imageId } = await params;

        logger.logApiRequest('GET', `/api/images/${imageId}/people`, {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const result = await peopleService.getPeopleForImage(imageId);

        return NextResponse.json({
            people: result.map(item => ({
                id: item.person.id,
                name: item.person.name,
                birthDate: item.person.birthDate?.toISOString(),
                deathDate: item.person.deathDate?.toISOString(),
                notes: item.person.notes,
                boundingBox: (item.boundingBox.x !== null &&
                    item.boundingBox.y !== null &&
                    item.boundingBox.width !== null &&
                    item.boundingBox.height !== null) ? {
                    x: item.boundingBox.x,
                    y: item.boundingBox.y,
                    width: item.boundingBox.width,
                    height: item.boundingBox.height,
                } : null
            })),
            count: result.length
        });

    } catch (error: any) {
        console.error('Error fetching people for image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch people for image' },
            { status: 500 }
        );
    }
} 