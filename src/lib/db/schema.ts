import { pgTable, uuid, varchar, timestamp, integer, boolean, text } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
    id: uuid('id').defaultRandom().primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull().unique(),
    originalName: varchar('original_name', { length: 255 }),
    path: varchar('path', { length: 500 }).notNull(),
    size: integer('size').notNull(), // File size in bytes
    width: integer('width'),
    height: integer('height'),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    checksum: varchar('checksum', { length: 64 }), // SHA-256 hash
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),
    tags: text('tags').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert; 