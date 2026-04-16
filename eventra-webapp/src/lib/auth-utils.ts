import { auth } from '@/auth';
import { UserRole } from '@/types';
import { db } from './db';
import { events } from './db/schema';
import { eq } from 'drizzle-orm';

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
 * Validates if the current user is the owner of an event or an admin.
 */
export async function validateEventOwnership(eventId: string) {
  const user = await auth();
  
  if (!user?.user) {
    throw new Error('Authentication required');
  }

  const userId = user.user.id;
  const userRole = (user.user as any).role as UserRole;

  // Admins bypass ownership checks
  if (userRole === 'admin') return user.user;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizerId !== userId && !(event.coOrganizerIds?.includes(userId))) {
    throw new Error('Forbidden: You do not have permission to manage this event');
  }

  return user.user;
}
