import { describe, expect } from 'vitest'
import { testWithDb } from '../helpers/test-context'
import { testApiRoute, createTestImageData, mockUUID } from '../helpers/api-test'

describe('Images API', () => {
  describe('GET /api/images', () => {
    testWithDb('returns empty array when no images', async ({ db }) => {
      const response = await testApiRoute('GET', '/api/images')
      
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        images: [],
        count: 0
      })
    })

    testWithDb('returns all images with correct structure', async ({ db, seedData }) => {
      // Seed test data
      await seedData.createImage(createTestImageData({
        filename: 'test1.jpg',
        description: 'Test image 1',
        tags: ['family', 'vacation']
      }))
      
      await seedData.createImage(createTestImageData({
        filename: 'test2.jpg',
        description: 'Test image 2',
        tags: ['friends']
      }))

      const response = await testApiRoute('GET', '/api/images')
      
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(2)
      expect(response.body.images).toHaveLength(2)
      
      // Validate structure of first image
      const image = response.body.images[0]
      expect(image).toMatchObject({
        id: expect.any(String),
        filename: expect.any(String),
        size: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        mimeType: expect.any(String),
        tags: expect.any(Array),
        description: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })
  })

  describe('GET /api/images/[id]', () => {
    testWithDb('returns 404 for non-existent image', async ({ db }) => {
      const fakeId = mockUUID()
      const response = await testApiRoute('GET', `/api/images/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        error: expect.stringContaining('not found')
      })
    })

    testWithDb('returns image details with all fields', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData({
        description: 'Detailed test image',
        tags: ['test', 'detailed'],
        dateTaken: new Date('2023-01-15T10:30:00Z'),
        datePrecision: 'day'
      }))

      const response = await testApiRoute('GET', `/api/images/${image.id}`)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.image).toMatchObject({
        id: image.id,
        filename: image.filename,
        description: 'Detailed test image',
        tags: ['test', 'detailed'],
        datePrecision: 'day',
        isActive: true
      })
    })
  })

  describe('PATCH /api/images/[id]', () => {
    testWithDb('updates tags successfully', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())

      const response = await testApiRoute('PATCH', `/api/images/${image.id}`, {
        body: {
          tags: ['updated', 'tags']
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.image.tags).toEqual(['updated', 'tags'])
    })

    testWithDb('updates description', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())

      const response = await testApiRoute('PATCH', `/api/images/${image.id}`, {
        body: {
          description: 'Updated description'
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.image.description).toBe('Updated description')
    })

    testWithDb('validates date precision values', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())

      const response = await testApiRoute('PATCH', `/api/images/${image.id}`, {
        body: {
          datePrecision: 'invalid-precision'
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid date precision')
    })

    testWithDb('returns 404 for non-existent image', async ({ db }) => {
      const fakeId = mockUUID()
      
      const response = await testApiRoute('PATCH', `/api/images/${fakeId}`, {
        body: {
          description: 'New description'
        }
      })
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/images/[id]/rotate', () => {
    testWithDb('rotates image 90 degrees', async ({ db, seedData }) => {
      const [image] = await seedData.createImageWithFile(createTestImageData({
        width: 800,
        height: 600
      }))

      const response = await testApiRoute('POST', `/api/images/${image.id}/rotate`, {
        body: {
          degrees: 90
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe(image.filename)
    })

    testWithDb('returns 400 for invalid degrees', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())

      const response = await testApiRoute('POST', `/api/images/${image.id}/rotate`, {
        body: {
          degrees: 45 // Invalid - only 90, 180, 270 allowed
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('must be 90, 180, or 270')
    })

    testWithDb('returns 404 for non-existent image', async ({ db }) => {
      const fakeId = mockUUID()
      
      const response = await testApiRoute('POST', `/api/images/${fakeId}/rotate`, {
        body: {
          degrees: 90
        }
      })
      
      expect(response.status).toBe(404)
    })
  })
})