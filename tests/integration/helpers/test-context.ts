import { test as baseTest, vi } from 'vitest'
import { createTestDatabase, dropTestDatabase } from './test-db'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '@/lib/db/schema'
import type { NewImage, NewPerson, NewImagePerson } from '@/lib/db/schema'
import { promises as fs } from 'fs'
import { resolve } from 'path'
import sharp from 'sharp'

interface SeedHelpers {
  createImage: (data: Partial<NewImage> & Pick<NewImage, 'filename' | 'path' | 'size' | 'mimeType'>) => Promise<schema.Image[]>
  createImageWithFile: (data: Partial<NewImage> & Pick<NewImage, 'filename' | 'path' | 'size' | 'mimeType'>) => Promise<schema.Image[]>
  createPerson: (data: Partial<NewPerson> & Pick<NewPerson, 'name'>) => Promise<schema.Person[]>
  linkPersonToImage: (data: NewImagePerson) => Promise<schema.ImagePerson[]>
  cleanupFiles: () => Promise<void>
}

interface TestContext {
  db: ReturnType<typeof drizzle>
  dbName: string
  seedData: SeedHelpers
}

export const testWithDb = baseTest.extend<TestContext>({
  db: async ({ task }, use) => {
    // Create unique database for this test
    const { db, dbName, pool } = await createTestDatabase(task.name)

    // Use the database in test
    await use(db)

    // Cleanup: drop entire database
    await dropTestDatabase(dbName, pool)
  },

  dbName: async ({ db }, use) => {
    // This will be automatically available through the db fixture
    await use('')
  },

  seedData: async ({ db }, use) => {
    const createdFiles: string[] = []
    const imagesDir = resolve(process.cwd(), 'public/images')
    
    // Ensure images directory exists
    await fs.mkdir(imagesDir, { recursive: true })

    const helpers: SeedHelpers = {
      createImage: async (data) => {
        const imageData: NewImage = {
          filename: data.filename,
          path: data.path,
          size: data.size,
          mimeType: data.mimeType,
          originalName: data.originalName || null,
          width: data.width || null,
          height: data.height || null,
          checksum: data.checksum || null,
          isActive: data.isActive ?? true,
          description: data.description || null,
          tags: data.tags || null,
          dateTaken: data.dateTaken || null,
          datePrecision: data.datePrecision || null,
        }
        return db.insert(schema.images).values(imageData).returning()
      },

      createImageWithFile: async (data) => {
        // Create a test image file
        const width = data.width || 800
        const height = data.height || 600
        const filepath = resolve(imagesDir, data.filename)
        
        // Generate a simple test image using Sharp
        const imageBuffer = await sharp({
          create: {
            width: width,
            height: height,
            channels: 3,
            background: { r: 100, g: 150, b: 200 }
          }
        })
        .jpeg()
        .toBuffer()

        // Write the file
        await fs.writeFile(filepath, imageBuffer)
        createdFiles.push(filepath)

        // Create database record with accurate file info
        const stats = await fs.stat(filepath)
        const imageData: NewImage = {
          filename: data.filename,
          path: data.path,
          size: stats.size,
          mimeType: data.mimeType || 'image/jpeg',
          originalName: data.originalName || data.filename,
          width: width,
          height: height,
          checksum: data.checksum || null,
          isActive: data.isActive ?? true,
          description: data.description || null,
          tags: data.tags || null,
          dateTaken: data.dateTaken || null,
          datePrecision: data.datePrecision || null,
        }
        return db.insert(schema.images).values(imageData).returning()
      },

      createPerson: async (data) => {
        const personData: NewPerson = {
          name: data.name,
          birthDate: data.birthDate || null,
          deathDate: data.deathDate || null,
          notes: data.notes || null,
        }
        return db.insert(schema.people).values(personData).returning()
      },

      linkPersonToImage: async (data) => {
        return db.insert(schema.imagePeople).values(data).returning()
      },

      cleanupFiles: async () => {
        // Clean up any created test files
        for (const filepath of createdFiles) {
          try {
            await fs.unlink(filepath)
          } catch (error) {
            // Ignore errors - file might already be deleted
          }
        }
        createdFiles.length = 0
      },
    }

    await use(helpers)
    
    // Cleanup files after test
    await helpers.cleanupFiles()
  },
})