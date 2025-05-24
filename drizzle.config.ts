import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

const DATABASE_URL = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dbCredentials: {
        url: DATABASE_URL,
    },
}); 