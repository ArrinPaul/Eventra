import { auth } from '@/auth';
import { UserRole } from '@/types';
import { db } from './db';
import { events, eventStaff } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Validates if the current session user has the required role.
 * Throws an error if unauthorized.
 */
export async function validateRole(requiredRoles: UserRole[]) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const userRole = (session.user as any).role as UserRole;

  if (!requiredRoles.includes(userRole)) {
    throw new Error(`Unauthorized: Requires ${requiredRoles.join(' or ')} role`);
  }

  return session.user;
}

/**
 * Validates if the current user is the owner of an event, a co-organizer, staff member, or an admin.
 */
export async function validateEventOwnership(eventId: string) {
  const user = await auth();
  
  if (!user?.user) {
    throw new Error('Authentication required');
  }

  const userId = user.user.id!;
  const userRole = (user.user as any).role as UserRole;

  // 1. Admins bypass ownership checks
  if (userRole === 'admin') return user.user;

  // 2. Fetch event and check direct ownership/co-organizer array
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizerId === userId || event.coOrganizerIds?.includes(userId)) {
    return user.user;
  }

  // 3. Check eventStaff table for granular roles
  const staff = await db.query.eventStaff.findFirst({
    where: and(
      eq(eventStaff.eventId, eventId),
      eq(eventStaff.userId, userId)
    )
  });

  if (!staff) {
    throw new Error('Forbidden: You do not have permission to manage this event');
  }

  return user.user;
}
