const fs = require('fs');
const postgres = require('postgres');
const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  env[key] = value;
}
const sql = postgres(env.DATABASE_URL, { ssl: 'require', prepare: false });
(async () => {
  try {
    await sql.unsafe(`
      REVOKE USAGE ON SCHEMA auth FROM postgres;
      REVOKE USAGE ON SCHEMA realtime FROM postgres;
    `);
    console.log('SCHEMA_REVOKED');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
