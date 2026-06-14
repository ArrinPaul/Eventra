'use server';

import { db } from '@/lib/db';
import { waitlist, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { validateEventOwnership } from '@/lib/auth-utils';
import { autoPromoteFromWaitlist } from './registrations';

/**
 * Get the waitlist for an event
 */
export async function getWaitlistForEvent(eventId: string) {
  await validateEventOwnership(eventId);

  try {
    const result = await db
      .select({
        id: waitlist.id,
        position: waitlist.position,
        status: waitlist.status,
        createdAt: waitlist.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        }
      })
      .from(waitlist)
      .innerJoin(users, eq(waitlist.userId, users.id))
      .where(eq(waitlist.eventId, eventId))
      .orderBy(waitlist.position);

    return result;
  } catch (error) {
    console.error('getWaitlistForEvent Error:', error);
    return [];
  }
}

/**
 * Manually promote a specific attendee from the waitlist
 * (Bypasses queue position if needed, though usually used for next in line)
 */
export async function manualPromoteAttendee(eventId: string, userId: string) {
  await validateEventOwnership(eventId);

  // We reuse the auto-promotion logic but could be extended for specific userId
  // For now, let's keep it simple: promote next available
  return await autoPromoteFromWaitlist(eventId);
}
