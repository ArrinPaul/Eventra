import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testConnectivity() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    return;
  }

  console.log('Testing connectivity to:', url.split('@')[1]);

  const db = postgres(url, { 
    ssl: 'require', 
    connect_timeout: 10, 
    prepare: false 
  });

  try {
    const result = await db`select 1 as ok`;
    console.log('Success:', result);
  } catch (error) {
    console.error('FAILED:', error.message);
  } finally {
    await db.end();
  }
}

testConnectivity();
