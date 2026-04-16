import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function enableVector() {
  try {
    console.log('Enabling pgvector extension on Supabase...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('✅ Extension enabled successfully!');
  } catch (error) {
    console.error('Failed to enable extension:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

enableVector();
or();
