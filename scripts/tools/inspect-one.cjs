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
      tc.constraint_schema,
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      cc.constraint_schema as cc_schema,
      cc.check_clause
    from information_schema.table_constraints tc
    left join information_schema.check_constraints cc
      on cc.constraint_name = tc.constraint_name
    where tc.constraint_type = 'CHECK'
      and tc.table_schema = 'auth'
      and tc.table_name = 'custom_oauth_providers'
      and tc.constraint_name = 'custom_oauth_providers_authorization_url_https';
  `;
  console.log(JSON.stringify(rows, null, 2));
  await sql.end({ timeout: 5 });
})();
