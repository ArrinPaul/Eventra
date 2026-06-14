import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const DEFAULT_LIMIT = 120;
const DEFAULT_WINDOW_MS = 60_000;

async function getClientIdentifier(userId?: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim()
    ?? headerStore.get('x-real-ip')
    ?? 'unknown';

  if (userId) {
    return `user:${userId}:ip:${ip}`;
  }

  return `ip:${ip}`;
}

export async function enforceRateLimit(options?: {
  userId?: string;
  scope?: string;
  limit?: number;
  windowMs?: number;
}) {
  const {
    userId,
    scope = 'server-action',
    limit = DEFAULT_LIMIT,
    windowMs = DEFAULT_WINDOW_MS,
  } = options ?? {};

  const identifier = await getClientIdentifier(userId);
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const [row] = await db.insert(rateLimits)
    .values({
      identifier,
      scope,
      windowStart,
      count: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [rateLimits.identifier, rateLimits.scope, rateLimits.windowStart],
      set: {
        count: sql`${rateLimits.count} + 1`,
        updatedAt: now,
      },
    })
    .returning({
      count: rateLimits.count,
    });

  if (row?.count && row.count > limit) {
    throw new Error('Rate limit exceeded. Please slow down and try again.');
  }
}
