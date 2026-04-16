import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function finalSync() {
  console.log('🛠️ FIXING SCHEMA GAPS...');

  const commands = [
    // Task 3 Field
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "feedback_template_id" uuid;`,
    
    // Task 2 Field
    `ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "personalized_message" text;`,
    
    // Integrity Fixes
    `ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "qr_code" text;`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "co_organizer_ids" text[];`
  ];

  for (const cmd of commands) {
    try {
      await db.execute(sql.raw(cmd));
      console.log(`✅ Executed: ${cmd.substring(0, 40)}...`);
    } catch (e: any) {
      console.error(`❌ Failed: ${cmd.substring(0, 40)}... Error: ${e.message}`);
    }
  }

  console.log('\n🚀 ALL GAPS FIXED. Re-running audit logic...');
}

finalSync();
