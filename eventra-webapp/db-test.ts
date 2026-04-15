import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing Supabase Connection...');
    const result = await db.execute(sql`SELECT 1 + 1 as result`);
    console.log('✅ Connection Successful:', result);
    
    console.log('Checking tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tables Found:', tables.map((t: any) => t.table_name).join(', '));
  } catch (error) {
    console.error('❌ Connection Failed:', error);
    process.exit(1);
  }
}

testConnection();
