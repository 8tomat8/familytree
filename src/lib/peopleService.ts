import { db, people, Person, imagePeople, NewImagePerson, images, NewPerson } from '@/lib/db';
import { count, desc, eq, and } from 'drizzle-orm';

export class PeopleService {
    /**
     * Get all people from the database
     */
    async listPeople(): Promise<Person[]> {
        try {
            const result = await db.select()
                .from(people)
                .orderBy(desc(people.createdAt));

            return result;
        } catch (error) {
            console.error('Error fetching people from database:', error);
            throw new Error('Failed to fetch people from database');
        }
    }

    /**
     * Create a new person in the database
     */
    async createPerson(personData: {
        name: string;
        birthDate?: Date;
        deathDate?: Date;
        notes?: string;
    }): Promise<Person> {
        try {
            // Validate required fields
            if (!personData.name || personData.name.trim() === '') {
                throw new Error('Name is required');
            }

            const newPerson: NewPerson = {
                name: personData.name.trim(),
                birthDate: personData.birthDate || null,
                deathDate: personData.deathDate || null,
                notes: personData.notes || null,
            };

            const result = await db.insert(people).values(newPerson).returning();

            if (result.length === 0) {
                throw new Error('Failed to create person');
            }

            return result[0];
        } catch (error) {
            console.error('Error creating person:', error);
            throw error;
        }
    }

    /**
     * Get people count statistics
     */
    async getStats(): Promise<{ totalPeople: number }> {
        try {
            const result = await db.select({
                totalPeople: count()
            }).from(people);
            return {
                totalPeople: result[0].totalPeople
            };
        } catch (error) {
            console.error('Error fetching people stats:', error);
            throw new Error('Failed to fetch people statistics');
        }
    }

    /**
     * Link a person to an image with optional bounding box coordinates
     */
    async linkPersonToImage(data: {
        personId: string;
        imageId: string;
        boundingBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }): Promise<void> {
        try {
            // Validate image exists and get its dimensions for coordinate validation
            const image = await db.select()
                .from(images)
                .where(eq(images.id, data.imageId))
                .limit(1);

            if (image.length === 0) {
                throw new Error('Image not found');
            }

            // Validate person exists
            const person = await db.select()
                .from(people)
                .where(eq(people.id, data.personId))
                .limit(1);

            if (person.length === 0) {
                throw new Error('Person not found');
            }

            // Validate bounding box coordinates if provided
            if (data.boundingBox) {
                const { x, y, width, height } = data.boundingBox;
                const imgWidth = image[0].width;
                const imgHeight = image[0].height;

                if (imgWidth && imgHeight) {
                    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
                        throw new Error('Invalid bounding box coordinates');
                    }
                    if (x + width > imgWidth || y + height > imgHeight) {
                        throw new Error('Bounding box exceeds image dimensions');
                    }
                }
            }

            // Check if link already exists
            const existingLink = await db.select()
                .from(imagePeople)
                .where(and(
                    eq(imagePeople.imageId, data.imageId),
                    eq(imagePeople.personId, data.personId)
                ))
                .limit(1);

            if (existingLink.length > 0) {
                throw new Error('Person is already linked to this image');
            }

            // Create the link
            const newLink: NewImagePerson = {
                imageId: data.imageId,
                personId: data.personId,
                boundingBoxX: data.boundingBox?.x ?? null,
                boundingBoxY: data.boundingBox?.y ?? null,
                boundingBoxWidth: data.boundingBox?.width ?? null,
                boundingBoxHeight: data.boundingBox?.height ?? null,
            };

            await db.insert(imagePeople).values(newLink);
        } catch (error) {
            console.error('Error linking person to image:', error);
            throw error;
        }
    }

    /**
     * Remove link between person and image
     */
    async unlinkPersonFromImage(personId: string, imageId: string): Promise<void> {
        try {
            const result = await db.delete(imagePeople)
                .where(and(
                    eq(imagePeople.imageId, imageId),
                    eq(imagePeople.personId, personId)
                ))
                .returning();

            if (result.length === 0) {
                throw new Error('No link found between this person and image');
            }

            return;
        } catch (error) {
            console.error('Error unlinking person from image:', error);
            throw error;
        }
    }

    /**
     * Get people linked to a specific image
     */
    async getPeopleForImage(imageId: string) {
        try {
            // First validate that the image exists
            const image = await db.select()
                .from(images)
                .where(eq(images.id, imageId))
                .limit(1);

            if (image.length === 0) {
                throw new Error('Image not found');
            }

            const result = await db.select({
                person: people,
                boundingBox: {
                    x: imagePeople.boundingBoxX,
                    y: imagePeople.boundingBoxY,
                    width: imagePeople.boundingBoxWidth,
                    height: imagePeople.boundingBoxHeight,
                }
            })
                .from(imagePeople)
                .innerJoin(people, eq(imagePeople.personId, people.id))
                .where(eq(imagePeople.imageId, imageId));

            return result;
        } catch (error) {
            console.error('Error fetching people for image:', error);
            throw error; // Re-throw to preserve the specific error message
        }
    }
}

export const peopleService = new PeopleService(); 