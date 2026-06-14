'use server';

import { db } from './index';
import { sql } from 'drizzle-orm';

export async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log('Database connection successful:', result);
    return { success: true };
  } catch (error: any) {
    console.error('CRITICAL: Database connection failed.');
    let errorMessage = error.message || 'Unknown error';
    
    if (errorMessage.includes('authentication failed')) {
      console.error('CAUSE: Password authentication failed. Please check your DATABASE_URL in .env');
    } else if (error.code === 'XX000' || errorMessage.includes('circuit breaker')) {
      console.error('CAUSE: Circuit breaker active. Too many failed attempts. Please wait or check Supabase status.');
    } else {
      console.error('ERROR DETAILS:', errorMessage);
    }
    
    return { success: false, error: errorMessage };
  }
}
