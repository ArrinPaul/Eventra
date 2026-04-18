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
const roleName = 'eventra_migrator';
const rolePassword = 'EventraMigrator2026';
const batch = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${roleName}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '${roleName}', '${rolePassword}');
  END IF;
END
$$;
GRANT CONNECT ON DATABASE postgres TO ${roleName};
GRANT USAGE, CREATE ON SCHEMA public TO ${roleName};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleName};
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${roleName};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleName};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${roleName};
`;
(async () => {
  try {
    await sql.unsafe(batch);
    console.log('ROLE_READY');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
