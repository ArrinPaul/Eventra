import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
async function check() {
  const rooms = await sql`select count(*) from chat_rooms`;
  console.log('Room count:', rooms[0].count);
  await sql.end();
}
check();
