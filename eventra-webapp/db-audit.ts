import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function auditDatabase() {
  console.log('🔍 STARTING FULL DATABASE AUDIT...\n');
  
  const requiredTables = [
    'users', 'account', 'session', 'events', 'ticket_tiers', 'tickets', 
    'waitlist', 'communities', 'community_members', 'posts', 'comments', 
    'badges', 'user_badges', 'notifications', 'follows', 'chat_rooms', 
    'chat_participants', 'chat_messages', 'ai_chat_sessions', 'ai_chat_messages', 
    'feedback_templates', 'certificate_templates', 'event_feedback', 'activity_feed'
  ];

  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tables.map((t: any) => t.table_name);
    const missing = requiredTables.filter(t => !existingTables.includes(t));

    if (missing.length === 0) {
      console.log('✅ SCHEMA INTEGRITY: 100% - All tables present.');
    } else {
      console.error('❌ SCHEMA GAP FOUND! Missing tables:', missing.join(', '));
    }

    // Check critical columns added in Task 1 & 2
    console.log('\n🔍 Verifying critical columns...');
    
    const eventCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'events'`);
    const hasCoOrg = eventCols.some((c: any) => c.column_name === 'co_organizer_ids');
    const hasFTemp = eventCols.some((c: any) => c.column_name === 'feedback_template_id');
    
    console.log(hasCoOrg ? '✅ events.co_organizer_ids exists' : '❌ events.co_organizer_ids MISSING');
    console.log(hasFTemp ? '✅ events.feedback_template_id exists' : '❌ events.feedback_template_id MISSING');

    const ticketCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets'`);
    const hasQR = ticketCols.some((c: any) => c.column_name === 'qr_code');
    const hasMsg = ticketCols.some((c: any) => c.column_name === 'personalized_message');

    console.log(hasQR ? '✅ tickets.qr_code exists' : '❌ tickets.qr_code MISSING');
    console.log(hasMsg ? '✅ tickets.personalized_message exists' : '❌ tickets.personalized_message MISSING');

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    process.exit(0);
  }
}

auditDatabase();
