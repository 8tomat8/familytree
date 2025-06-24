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

export async function POST(request: NextRequest) {
    try {
        logger.logApiRequest('POST', '/api/people', {
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        const body = await request.json();
        const { name, birthDate, deathDate, notes } = body;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Name is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        // Validate and parse dates if provided
        let parsedBirthDate: Date | undefined;
        let parsedDeathDate: Date | undefined;

        if (birthDate) {
            parsedBirthDate = new Date(birthDate);
            if (isNaN(parsedBirthDate.getTime())) {
                return NextResponse.json(
                    { error: 'Invalid birth date format' },
                    { status: 400 }
                );
            }
        }

        if (deathDate) {
            parsedDeathDate = new Date(deathDate);
            if (isNaN(parsedDeathDate.getTime())) {
                return NextResponse.json(
                    { error: 'Invalid death date format' },
                    { status: 400 }
                );
            }
        }

        // Validate that death date is after birth date if both are provided
        if (parsedBirthDate && parsedDeathDate && parsedDeathDate <= parsedBirthDate) {
            return NextResponse.json(
                { error: 'Death date must be after birth date' },
                { status: 400 }
            );
        }

        // Create person in database
        const newPerson = await peopleService.createPerson({
            name: name.trim(),
            birthDate: parsedBirthDate,
            deathDate: parsedDeathDate,
            notes: notes || undefined
        });

        return NextResponse.json({
            success: true,
            person: {
                id: newPerson.id,
                name: newPerson.name,
                birthDate: newPerson.birthDate?.toISOString(),
                deathDate: newPerson.deathDate?.toISOString(),
                notes: newPerson.notes,
                createdAt: newPerson.createdAt,
                updatedAt: newPerson.updatedAt
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating person:', error);

        const status = error.message?.includes('required') ? 400 : 500;
        return NextResponse.json(
            { error: error.message || 'Failed to create person' },
            { status }
        );
    }
}

