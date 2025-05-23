import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const imagesDir = path.join(process.cwd(), 'public', 'images');

        // Check if images directory exists
        try {
            await fs.access(imagesDir);
        } catch {
            return NextResponse.json({ images: [] });
        }

        // Read directory contents
        const files = await fs.readdir(imagesDir);

        // Filter image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });

        // Sort files alphabetically
        imageFiles.sort();

        return NextResponse.json({
            images: imageFiles,
            count: imageFiles.length
        });
    } catch (error) {
        console.error('Error reading images directory:', error);
        return NextResponse.json(
            { error: 'Failed to read images directory' },
            { status: 500 }
        );
    }
} 