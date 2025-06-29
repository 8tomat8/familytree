import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { sql } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { readFileSync } from 'fs'
import { resolve } from 'path'

interface TestDatabase {
  db: ReturnType<typeof drizzle>
  dbName: string
  pool: Pool
}

export async function createTestDatabase(testName: string): Promise<TestDatabase> {
  // Create unique schema name for this test
  const timestamp = Date.now()
  const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30)
  const schemaName = `test_${sanitizedTestName}_${timestamp}`
  
  // Use production database but isolated schema
  const dbName = process.env.POSTGRES_DB || 'familytree'

  console.log(`[TEST] Creating isolated schema: ${schemaName} in database: ${dbName}`)

  // Connect to the main database
  const testPool = new Pool({
    user: process.env.POSTGRES_USER || 'familytree',
    password: process.env.POSTGRES_PASSWORD || 'familytree',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: dbName,
  })

  try {
    // Create isolated schema
    await testPool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    console.log(`[TEST] Created schema: ${schemaName}`)

    // Set search path to use our test schema
    await testPool.query(`SET search_path TO "${schemaName}", public`)

    const db = drizzle(testPool, { schema })

    // Run migrations in the test schema
    await runMigrations(db, schemaName)
    
    console.log(`[TEST] Schema ready: ${schemaName}`)

    // Set environment variable for API routes to use this schema
    process.env.TEST_SCHEMA = schemaName

    return { db, dbName: schemaName, pool: testPool }
  } catch (error) {
    await testPool.end()
    throw error
  }
}

export async function dropTestDatabase(schemaName: string, pool: Pool): Promise<void> {
  try {
    // Drop the entire test schema (CASCADE will remove all objects)
    await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
    console.log(`[TEST] Dropped schema: ${schemaName}`)
    
    // Clear the environment variable
    delete process.env.TEST_SCHEMA
    
    // Close the pool connection
    await pool.end()
  } catch (error) {
    console.error(`[TEST] Failed to cleanup schema ${schemaName}:`, error)
    // Don't throw - we want tests to continue even if cleanup fails
  }
}

async function runMigrations(db: ReturnType<typeof drizzle>, schemaName: string): Promise<void> {
  try {
    // For test schemas, we'll manually create the tables instead of using migrations
    // This ensures they are created in the correct schema
    console.log(`[TEST] Creating tables in schema: ${schemaName}`)
    
    // Create tables in the test schema
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        path VARCHAR(500) NOT NULL,
        size BIGINT NOT NULL,
        width INTEGER,
        height INTEGER,
        mime_type VARCHAR(100) NOT NULL,
        checksum VARCHAR(64),
        tags TEXT[],
        description TEXT,
        date_taken TIMESTAMP WITH TIME ZONE,
        date_precision VARCHAR(20),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `))
    
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".people (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        birth_date TIMESTAMP WITH TIME ZONE,
        death_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `))
    
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".image_people (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_id UUID NOT NULL REFERENCES "${schemaName}".images(id) ON DELETE CASCADE,
        person_id UUID NOT NULL REFERENCES "${schemaName}".people(id) ON DELETE CASCADE,
        bounding_box_x INTEGER,
        bounding_box_y INTEGER,
        bounding_box_width INTEGER,
        bounding_box_height INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(image_id, person_id)
      )
    `))
    
    console.log(`[TEST] Tables created in schema: ${schemaName}`)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}