import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function checkPooler() {
  const url = "postgresql://postgres.cvdnmxemqeeqsjtmshyx:Arrinpaul_11@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
  console.log('Testing pooler connection on port 6543...');

  const db = postgres(url, { 
    ssl: 'require', 
    connect_timeout: 10, 
    prepare: false 
  });

  try {
    const result = await db`select 1 as ok`;
    console.log('Pooler Success:', result);
  } catch (error) {
    console.error('Pooler FAILED:', error.message);
  } finally {
    await db.end();
  }
}

checkPooler();
