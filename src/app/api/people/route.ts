import { NextRequest, NextResponse } from 'next/server';
import { peopleService, logger } from '@/lib';

export async function GET(request: NextRequest) {
    try {
        logger.logApiRequest('GET', '/api/people', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Get people from database
        const people = await peopleService.listPeople();

        const response = NextResponse.json({
            people: people.map(person => ({
                id: person.id,
                name: person.name,
                birthDate: person.birthDate?.toISOString(),
                deathDate: person.deathDate?.toISOString(),
                notes: person.notes,
                createdAt: person.createdAt,
                updatedAt: person.updatedAt
            })),
            count: people.length,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to read people from database: ' + error },
            { status: 500 }
        );
    }
} 