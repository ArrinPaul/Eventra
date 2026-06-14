'use server';

import { db } from '@/lib/db';
import { ai } from '@/lib/ai';
import { validateRole } from '@/lib/auth-utils';
import { sql } from 'drizzle-orm';

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unconfigured';

export type SystemHealth = {
  database: {
    status: ServiceStatus;
    latency: number;
  };
  ai: {
    status: ServiceStatus;
    model: string;
  };
  email: {
    status: ServiceStatus;
    provider: string;
  };
  storage: {
    status: ServiceStatus;
  };
};

export async function getSystemHealth(): Promise<SystemHealth> {
  await validateRole(['admin']);

  const health: SystemHealth = {
    database: { status: 'down', latency: 0 },
    ai: { status: 'unconfigured', model: 'gemini-1.5-flash' },
    email: { status: 'unconfigured', provider: 'Resend' },
    storage: { status: 'operational' }, // Local/DB storage is always up if DB is up
  };

  // 1. Check Database
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    health.database.status = 'operational';
    health.database.latency = Date.now() - start;
  } catch (e) {
    health.database.status = 'down';
  }

  // 2. Check AI (Google API Key)
  if (process.env.GOOGLE_API_KEY) {
    health.ai.status = 'operational';
  } else {
    health.ai.status = 'unconfigured';
  }

  // 3. Check Email (Resend API Key)
  if (process.env.RESEND_API_KEY) {
    health.email.status = 'operational';
  } else {
    health.email.status = 'unconfigured';
  }

  return health;
}
