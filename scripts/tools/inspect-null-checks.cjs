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
  const rows = await sql`
    select
      n.nspname as schema_name,
      c.relname as table_name,
      con.conname as constraint_name,
      pg_get_constraintdef(con.oid, true) as definition,
      con.conkey,
      con.conbin is null as conbin_is_null
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where con.contype = 'c'
    order by 1, 2, 3;
  `;
  const bad = rows.filter((r) => !r.definition || typeof r.definition !== 'string');
  console.log('BAD_COUNT', bad.length);
  console.log(JSON.stringify(bad, null, 2));
  await sql.end({ timeout: 5 });
})();
