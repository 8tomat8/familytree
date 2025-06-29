import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Load environment variables conditionally
if (!process.env.POSTGRES_DB) {
    require('dotenv/config');
}

// Create PostgreSQL connection pool using environment variables
const DATABASE_URL = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

console.log(`[DB] Connecting to database: ${process.env.POSTGRES_DB} (NODE_ENV: ${process.env.NODE_ENV})`);

// Cache for database connections by schema
const connectionCache = new Map<string, ReturnType<typeof drizzle>>();

// Function to get database connection for current schema
function getDatabaseConnection(): ReturnType<typeof drizzle> {
    const currentSchema = process.env.NODE_ENV === 'test' && process.env.TEST_SCHEMA 
        ? process.env.TEST_SCHEMA 
        : 'public';

    // Check if we already have a connection for this schema
    if (connectionCache.has(currentSchema)) {
        return connectionCache.get(currentSchema)!;
    }

    console.log(`[DB] Creating new connection for schema: ${currentSchema}`);

    const pool = new Pool({
        connectionString: DATABASE_URL,
    });

    // Set search_path for test schemas
    if (currentSchema !== 'public') {
        pool.on('connect', async (client) => {
            console.log(`[DB] Setting search_path to schema: ${currentSchema}`);
            await client.query(`SET search_path TO "${currentSchema}", public`);
        });
    }

    const connection = drizzle({ client: pool, schema });
    connectionCache.set(currentSchema, connection);
    return connection;
}

// Export a getter property that always returns the correct connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(target, prop) {
        const connection = getDatabaseConnection();
        return connection[prop as keyof typeof connection];
    }
});

export * from './schema'; 