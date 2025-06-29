import { describe, expect } from 'vitest'
import { testWithDb } from '../helpers/test-context'
import { testApiRoute, createTestImageData, createTestPersonData, mockUUID } from '../helpers/api-test'

describe('People Link API', () => {
  describe('POST /api/people/link-to-image', () => {
    testWithDb('links person to image successfully', async ({ db, seedData }) => {
      // Create test data
      const [image] = await seedData.createImage(createTestImageData())
      const [person] = await seedData.createPerson(createTestPersonData())

      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: person.id,
          imageId: image.id
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('successfully linked')
    })

    testWithDb('links with bounding box coordinates', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData({
        width: 800,
        height: 600
      }))
      const [person] = await seedData.createPerson(createTestPersonData())

      const boundingBox = {
        x: 100,
        y: 150,
        width: 200,
        height: 250
      }

      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: person.id,
          imageId: image.id,
          boundingBox
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    testWithDb('returns 404 for invalid person', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())
      const fakePersonId = mockUUID()

      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: fakePersonId,
          imageId: image.id
        }
      })
      
      expect(response.status).toBe(404)
      expect(response.body.error).toContain('Person not found')
    })

    testWithDb('returns 404 for invalid image', async ({ db, seedData }) => {
      const [person] = await seedData.createPerson(createTestPersonData())
      const fakeImageId = mockUUID()

      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: person.id,
          imageId: fakeImageId
        }
      })
      
      expect(response.status).toBe(404)
      expect(response.body.error).toContain('Image not found')
    })

    testWithDb('returns 409 for duplicate link', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())
      const [person] = await seedData.createPerson(createTestPersonData())

      // Create initial link
      await seedData.linkPersonToImage({
        imageId: image.id,
        personId: person.id,
        boundingBoxX: null,
        boundingBoxY: null,
        boundingBoxWidth: null,
        boundingBoxHeight: null
      })

      // Try to create duplicate link
      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: person.id,
          imageId: image.id
        }
      })
      
      expect(response.status).toBe(409)
      expect(response.body.error).toContain('already linked')
    })

    testWithDb('validates bounding box within image dimensions', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData({
        width: 800,
        height: 600
      }))
      const [person] = await seedData.createPerson(createTestPersonData())

      const invalidBoundingBox = {
        x: 700,
        y: 500,
        width: 200, // This would extend beyond image width (700 + 200 > 800)
        height: 150
      }

      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: person.id,
          imageId: image.id,
          boundingBox: invalidBoundingBox
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('exceeds image dimensions')
    })

    testWithDb('returns 400 for missing required fields', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people/link-to-image', {
        body: {
          personId: mockUUID()
          // Missing imageId
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('required')
    })
  })

  describe('DELETE /api/people/link-to-image', () => {
    testWithDb('unlinks person from image successfully', async ({ db, seedData }) => {
      // Create and link
      const [image] = await seedData.createImage(createTestImageData())
      const [person] = await seedData.createPerson(createTestPersonData())
      
      await seedData.linkPersonToImage({
        imageId: image.id,
        personId: person.id,
        boundingBoxX: null,
        boundingBoxY: null,
        boundingBoxWidth: null,
        boundingBoxHeight: null
      })

      // Unlink
      const response = await testApiRoute('DELETE', '/api/people/link-to-image', {
        searchParams: {
          personId: person.id,
          imageId: image.id
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('successfully unlinked')
    })

    testWithDb('returns 404 when link does not exist', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())
      const [person] = await seedData.createPerson(createTestPersonData())

      const response = await testApiRoute('DELETE', '/api/people/link-to-image', {
        searchParams: {
          personId: person.id,
          imageId: image.id
        }
      })
      
      expect(response.status).toBe(404)
      expect(response.body.error).toContain('No link found')
    })

    testWithDb('returns 400 for missing parameters', async ({ db }) => {
      const response = await testApiRoute('DELETE', '/api/people/link-to-image', {
        searchParams: {
          personId: mockUUID()
          // Missing imageId
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('required')
    })
  })

  describe('GET /api/images/[id]/people', () => {
    testWithDb('returns empty array for image without people', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())

      const response = await testApiRoute('GET', `/api/images/${image.id}/people`)
      
      expect(response.status).toBe(200)
      expect(response.body.people).toEqual([])
      expect(response.body.count).toBe(0)
    })

    testWithDb('returns linked people with bounding boxes', async ({ db, seedData }) => {
      const [image] = await seedData.createImage(createTestImageData())
      const [person1] = await seedData.createPerson(createTestPersonData({
        name: 'Person One'
      }))
      const [person2] = await seedData.createPerson(createTestPersonData({
        name: 'Person Two'
      }))
      
      // Link both people to the image
      await seedData.linkPersonToImage({
        imageId: image.id,
        personId: person1.id,
        boundingBoxX: 100,
        boundingBoxY: 150,
        boundingBoxWidth: 200,
        boundingBoxHeight: 250
      })

      await seedData.linkPersonToImage({
        imageId: image.id,
        personId: person2.id,
        boundingBoxX: null,
        boundingBoxY: null,
        boundingBoxWidth: null,
        boundingBoxHeight: null
      })

      const response = await testApiRoute('GET', `/api/images/${image.id}/people`)
      
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(2)
      expect(response.body.people).toHaveLength(2)
      
      // Find person with bounding box
      const personWithBounds = response.body.people.find((p: any) => p.boundingBox.x !== null)
      expect(personWithBounds).toBeDefined()
      expect(personWithBounds.boundingBox).toMatchObject({
        x: 100,
        y: 150,
        width: 200,
        height: 250
      })

      // Find person without bounding box
      const personWithoutBounds = response.body.people.find((p: any) => p.boundingBox.x === null)
      expect(personWithoutBounds).toBeDefined()
      expect(personWithoutBounds.boundingBox).toMatchObject({
        x: null,
        y: null,
        width: null,
        height: null
      })
    })

    testWithDb('returns 404 for non-existent image', async ({ db }) => {
      const fakeImageId = mockUUID()

      const response = await testApiRoute('GET', `/api/images/${fakeImageId}/people`)
      
      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found')
    })
  })
})