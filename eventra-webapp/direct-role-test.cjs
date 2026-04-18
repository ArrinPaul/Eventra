const postgres = require('postgres');
const sql = postgres('postgresql://eventra_migrator:EventraMigrator2026@db.cvdnmxemqeeqsjtmshyx.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
(async () => {
  try {
    const result = await sql`select current_user, current_schema()`;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
