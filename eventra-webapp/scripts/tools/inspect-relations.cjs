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

const sql = postgres(env.DATABASE_URL, { ssl: 'require', prepare: false, connect_timeout: 10 });

(async () => {
  try {
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name;
    `;

    const fks = await sql`
      select
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column,
        tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
       and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = 'public'
      order by source_table, constraint_name;
    `;

    console.log('TABLE_COUNT=' + tables.length);
    console.log('FK_COUNT=' + fks.length);
    console.log('TABLES=' + tables.map(t => t.table_name).join(','));
    console.log('FKS_START');
    for (const fk of fks) {
      console.log(`${fk.source_table}.${fk.source_column} -> ${fk.target_table}.${fk.target_column} (${fk.constraint_name})`);
    }
    console.log('FKS_END');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
