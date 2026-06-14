const fs = require('fs');
const postgres = require('postgres');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, '');
  env[key] = value;
}

const sql = postgres(env.DATABASE_URL, { ssl: 'require', prepare: false });

(async () => {
  try {
    await sql.unsafe(`
      drop schema if exists public cascade;
      create schema public;
      drop schema if exists drizzle cascade;
      create schema drizzle;
      create extension if not exists vector;
      grant all on schema public to postgres;
      grant all on schema drizzle to postgres;
    `);
    console.log('DB_RESET_READY');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
