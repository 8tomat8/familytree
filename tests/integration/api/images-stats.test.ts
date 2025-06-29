import { describe, expect } from 'vitest'
import { testWithDb } from '../helpers/test-context'
import { testApiRoute, createTestImageData } from '../helpers/api-test'

describe('Images Stats API', () => {
  describe('GET /api/images/stats', () => {
    testWithDb('returns correct stats for empty database', async ({ db }) => {
      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.stats).toMatchObject({
        totalImages: 0,
        activeImages: 0,
        totalSize: 0,
        totalSizeMB: 0,
        inactiveImages: 0
      })
    })

    testWithDb('calculates correct counts and sizes', async ({ db, seedData }) => {
      // Create active images
      await seedData.createImage(createTestImageData({
        size: 1024 * 1024, // 1MB
        isActive: true
      }))
      
      await seedData.createImage(createTestImageData({
        filename: 'test2.jpg',
        size: 2 * 1024 * 1024, // 2MB
        isActive: true
      }))
      
      // Create inactive image
      await seedData.createImage(createTestImageData({
        filename: 'test3.jpg',
        size: 512 * 1024, // 0.5MB
        isActive: false
      }))

      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.stats).toMatchObject({
        totalImages: 3,
        activeImages: 2,
        inactiveImages: 1,
        totalSize: 3.5 * 1024 * 1024, // 3.5MB in bytes
        totalSizeMB: 3.5
      })
    })

    testWithDb('correctly converts bytes to MB', async ({ db, seedData }) => {
      // Create an image with exact MB size for easy validation
      await seedData.createImage(createTestImageData({
        size: 5 * 1024 * 1024, // Exactly 5MB
        isActive: true
      }))

      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      expect(response.body.stats.totalSizeMB).toBe(5)
      expect(response.body.stats.totalSize).toBe(5 * 1024 * 1024)
    })

    testWithDb('handles fractional MB sizes correctly', async ({ db, seedData }) => {
      // Create image with fractional MB size
      await seedData.createImage(createTestImageData({
        size: 1.5 * 1024 * 1024, // 1.5MB
        isActive: true
      }))

      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      expect(response.body.stats.totalSizeMB).toBeCloseTo(1.5, 2)
    })

    testWithDb('distinguishes active from inactive images', async ({ db, seedData }) => {
      // Create multiple active and inactive images
      for (let i = 0; i < 3; i++) {
        await seedData.createImage(createTestImageData({
          filename: `active${i}.jpg`,
          isActive: true
        }))
      }
      
      for (let i = 0; i < 2; i++) {
        await seedData.createImage(createTestImageData({
          filename: `inactive${i}.jpg`,
          isActive: false
        }))
      }

      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      expect(response.body.stats).toMatchObject({
        totalImages: 5,
        activeImages: 3,
        inactiveImages: 2
      })
    })

    testWithDb('includes all images in total size calculation', async ({ db, seedData }) => {
      // Create both active and inactive images with known sizes
      await seedData.createImage(createTestImageData({
        filename: 'active.jpg',
        size: 1024 * 1024, // 1MB
        isActive: true
      }))
      
      await seedData.createImage(createTestImageData({
        filename: 'inactive.jpg',
        size: 1024 * 1024, // 1MB
        isActive: false
      }))

      const response = await testApiRoute('GET', '/api/images/stats')
      
      expect(response.status).toBe(200)
      // Total size should include both active and inactive images
      expect(response.body.stats.totalSizeMB).toBe(2)
      expect(response.body.stats.activeImages).toBe(1)
      expect(response.body.stats.inactiveImages).toBe(1)
    })
  })
})