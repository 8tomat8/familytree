import { describe, expect } from 'vitest'
import { testWithDb } from '../helpers/test-context'
import { testApiRoute, createTestPersonData } from '../helpers/api-test'

describe('People API', () => {
  describe('GET /api/people', () => {
    testWithDb('returns empty array when no people', async ({ db }) => {
      const response = await testApiRoute('GET', '/api/people')
      
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        people: [],
        count: 0
      })
    })

    testWithDb('returns all people with correct structure', async ({ db, seedData }) => {
      // Seed test data
      await seedData.createPerson(createTestPersonData({
        name: 'John Doe',
        notes: 'Test person 1'
      }))
      
      await seedData.createPerson(createTestPersonData({
        name: 'Jane Smith',
        birthDate: new Date('1990-05-15'),
        notes: 'Test person 2'
      }))

      const response = await testApiRoute('GET', '/api/people')
      
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(2)
      expect(response.body.people).toHaveLength(2)
      
      // Validate structure of first person
      const person = response.body.people[0]
      expect(person).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    testWithDb('sorts by creation date (most recent first)', async ({ db, seedData }) => {
      // Create people with slight delay to ensure different timestamps
      const [person1] = await seedData.createPerson(createTestPersonData({
        name: 'First Person'
      }))
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const [person2] = await seedData.createPerson(createTestPersonData({
        name: 'Second Person'
      }))

      const response = await testApiRoute('GET', '/api/people')
      
      expect(response.status).toBe(200)
      expect(response.body.people).toHaveLength(2)
      
      // Most recent should be first
      expect(response.body.people[0].name).toBe('Second Person')
      expect(response.body.people[1].name).toBe('First Person')
    })
  })

  describe('POST /api/people', () => {
    testWithDb('creates person with name only', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: 'Simple Person'
        }
      })
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.person).toMatchObject({
        id: expect.any(String),
        name: 'Simple Person',
        notes: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
      // Check null/undefined values  
      expect(response.body.person.birthDate).toBeNull()
      expect(response.body.person.deathDate).toBeNull()
    })

    testWithDb('creates person with all fields', async ({ db }) => {
      const birthDate = new Date('1985-12-25T00:00:00Z')
      const deathDate = new Date('2020-03-15T00:00:00Z')
      
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: 'Complete Person',
          birthDate: birthDate.toISOString(),
          deathDate: deathDate.toISOString(),
          notes: 'This person has all fields filled'
        }
      })
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.person).toMatchObject({
        name: 'Complete Person',
        notes: 'This person has all fields filled'
      })
      
      // Validate dates are properly stored
      expect(new Date(response.body.person.birthDate)).toEqual(birthDate)
      expect(new Date(response.body.person.deathDate)).toEqual(deathDate)
    })

    testWithDb('returns 400 for empty name', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: ''
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Name is required')
    })

    testWithDb('returns 400 for missing name', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          notes: 'Person without name'
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Name is required')
    })

    testWithDb('returns 400 for non-string name', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: 123
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('must be a non-empty string')
    })

    testWithDb('validates date formats', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: 'Test Person',
          birthDate: 'invalid-date'
        }
      })
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid birth date format')
    })

    testWithDb('trims whitespace from name', async ({ db }) => {
      const response = await testApiRoute('POST', '/api/people', {
        body: {
          name: '  Trimmed Name  '
        }
      })
      
      expect(response.status).toBe(201)
      expect(response.body.person.name).toBe('Trimmed Name')
    })
  })
})