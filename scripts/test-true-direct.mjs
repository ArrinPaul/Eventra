import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseDirect() {
  const url = "postgresql://postgres:Arrinpaul_11@db.cvdnmxemqeeqsjtmshyx.supabase.co:5432/postgres";
  console.log('Testing direct connection to Supabase host: db.cvdnmxemqeeqsjtmshyx.supabase.co');

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

testSupabaseDirect();
