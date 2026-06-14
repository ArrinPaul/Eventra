import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: 'require',
  prepare: false,
});

async function testChat() {
  console.log('Testing Chat Backend...');
  
  try {
    // 1. Get a test user and room
    const userRes = await sql`select id from users limit 1`;
    const roomRes = await sql`select id from chat_rooms limit 1`;
    
    if (userRes.length === 0 || roomRes.length === 0) {
      console.log('Skipping chat test: Need at least one user and one room in DB.');
      return;
    }

    const userId = userRes[0].id;
    const roomId = roomRes[0].id;

    // 2. Insert a message
    const msgRes = await sql`
      insert into chat_messages (room_id, sender_id, content)
      values (${roomId}, ${userId}, 'Test message from backend probe')
      returning id, content
    `;

    console.log('Chat message inserted:', msgRes[0]);
    console.log('Backend CHAT logic is OPERATIONAL.');
  } catch (error) {
    console.error('Chat Backend Error:', error.message);
  } finally {
    await sql.end();
  }
}

testChat();
