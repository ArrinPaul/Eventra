const postgres = require('postgres');
const sql = postgres('postgresql://eventra_migrator:EventraMigrator2026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require', prepare: false });
(async () => {
  const schemas = await sql`select distinct table_schema from information_schema.tables order by 1`;
  const checks = await sql`select distinct table_schema from information_schema.table_constraints where constraint_type='CHECK' order by 1`;
  console.log('SCHEMAS', JSON.stringify(schemas, null, 2));
  console.log('CHECK_SCHEMAS', JSON.stringify(checks, null, 2));
  await sql.end({ timeout: 5 });
})();
