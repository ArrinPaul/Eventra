import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
async function check() {
  const users = await sql`select count(*) from users`;
  console.log('User count:', users[0].count);
  await sql.end();
}
check();
