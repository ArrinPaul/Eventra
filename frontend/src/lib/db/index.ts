import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection for Server Components and Server Actions
 * Configured specifically for Supabase Transaction Pooler compatibility
 */
const connectionString = process.env.DATABASE_URL!;

// Use a singleton to prevent multiple connections in development (Next.js Hot Reloading)
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(connectionString, { 
  prepare: false, // REQUIRED for Supabase Transaction Pooler
  ssl: 'require',
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
