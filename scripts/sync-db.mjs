import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}
const directUrl = connectionString;

console.log('Connecting to database...');

const sql = postgres(directUrl, { ssl: 'require' });

try {
  console.log('Executing DB synchronization queries...');
  
  // 1. Add missing event columns if they don't exist
  await sql`
    ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'native' NOT NULL,
    ADD COLUMN IF NOT EXISTS source_platform text,
    ADD COLUMN IF NOT EXISTS external_id text;
  `;
  console.log('✓ events table columns synced successfully');

  // 2. Remove deprecated NextAuth tables
  await sql`DROP TABLE IF EXISTS "account" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "session" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "verificationToken" CASCADE;`;
  console.log('✓ deprecated NextAuth tables dropped successfully');

  // 3. Drop unused ipAddress column for GDPR compliance
  await sql`
    ALTER TABLE feedback_responses 
    DROP COLUMN IF EXISTS ip_address;
  `;
  console.log('✓ feedback_responses ip_address column dropped successfully');

  console.log('Database synced successfully.');
  process.exit(0);
} catch (error) {
  console.error('Sync failed:', error);
  process.exit(1);
}
