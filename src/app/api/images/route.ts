import { NextResponse } from 'next/server';
import { imageService } from '@/lib';

export async function GET() {
    try {
        const images = await imageService.listImages();

        return NextResponse.json({
            images,
            count: images.length
        });
    } catch (error) {
        console.error('Error reading images directory:', error);
        return NextResponse.json(
            { error: 'Failed to read images directory' },
            { status: 500 }
        );
    }
} 