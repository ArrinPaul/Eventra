import postgres from 'postgres';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

dotenv.config();

async function testDirect() {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    return;
  }

  // If it's a pooler URL, try to convert it to direct
  if (databaseUrl.includes(':6543')) {
    console.log('Converting pooler URL to direct (port 5432)...');
    databaseUrl = databaseUrl.replace(':6543', ':5432');
  }

  console.log('Testing connection to:', databaseUrl.split('@')[1]);

  const db = postgres(databaseUrl, {
    ssl: 'require',
    connect_timeout: 5,
    prepare: false,
  });

  try {
    const result = await db`select 1 as ok`;
    console.log('Connection OK:', result);
  } catch (error) {
    console.error('Connection FAILED:', error.message);
  } finally {
    await db.end();
  }
}

testDirect();
