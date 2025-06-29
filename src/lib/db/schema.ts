import { pgTable, uuid, varchar, timestamp, integer, boolean, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
    dateTaken: timestamp('date_taken'), // Full timestamp when known
    datePrecision: varchar('date_precision', { length: 20 }), // 'hour', 'day', 'month', 'year', 'decade'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export const people = pgTable('people', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    birthDate: timestamp('birth_date'),
    deathDate: timestamp('death_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const imagePeople = pgTable('image_people', {
    imageId: uuid('image_id').notNull().references(() => images.id, { onDelete: 'restrict' }),
    personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'restrict' }),
    // Bounding box coordinates for person selection on image
    boundingBoxX: integer('bounding_box_x'), // Top-left X coordinate
    boundingBoxY: integer('bounding_box_y'), // Top-left Y coordinate  
    boundingBoxWidth: integer('bounding_box_width'), // Width of the rectangle
    boundingBoxHeight: integer('bounding_box_height'), // Height of the rectangle
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    primaryKey({ columns: [table.imageId, table.personId] }),
]);

// Relations for relational queries
export const imagesRelations = relations(images, ({ many }) => ({
    imagePeople: many(imagePeople),
}));

export const peopleRelations = relations(people, ({ many }) => ({
    imagePeople: many(imagePeople),
}));

export const imagePeopleRelations = relations(imagePeople, ({ one }) => ({
    image: one(images, {
        fields: [imagePeople.imageId],
        references: [images.id],
    }),
    person: one(people, {
        fields: [imagePeople.personId],
        references: [people.id],
    }),
}));

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type ImagePerson = typeof imagePeople.$inferSelect;
export type NewImagePerson = typeof imagePeople.$inferInsert;

// Users table for authentication
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 