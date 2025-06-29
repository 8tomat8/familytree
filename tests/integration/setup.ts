import { config } from 'dotenv'
import { Pool } from 'pg'
import { resolve } from 'path'

// Load test environment variables FIRST (before any other imports)
config({ path: resolve(process.cwd(), '.env.test') })

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test'

console.log(`[SETUP] Test environment loaded - DB: ${process.env.POSTGRES_DB}, NODE_ENV: ${process.env.NODE_ENV}`)

// Global setup to ensure PostgreSQL is available
export async function setup() {
  // Verify PostgreSQL connection
  const adminPool = new Pool({
    user: process.env.POSTGRES_USER || 'familytree',
    password: process.env.POSTGRES_PASSWORD || 'familytree',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: 'postgres', // Connect to postgres database for admin operations
  })

  try {
    await adminPool.query('SELECT 1')
    console.log('✓ PostgreSQL connection verified')
  } catch (error) {
    console.error('✗ Failed to connect to PostgreSQL:', error)
    throw new Error('PostgreSQL is not available. Please ensure it is running.')
  } finally {
    await adminPool.end()
  }
}

export async function teardown() {
  // Global cleanup if needed
}