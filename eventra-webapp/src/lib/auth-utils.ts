import { UserRole } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { events, eventStaff, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Validates if the current session user has the required role.
 * Throws an error if unauthorized.
 */
export async function validateRole(requiredRoles: UserRole[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !requiredRoles.includes(user.role as UserRole)) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  return user as { id: string; role: UserRole; [key: string]: any };
}

/**
 * Validates if the current user is the owner of an event, a co-organizer, staff member, or an admin.
 */
export async function validateEventOwnership(eventId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  // Admins have override access
  if (user.role === 'admin') {
    return user;
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const isOwner = event.organizerId === user.id;
  const isCoOrganizer = event.coOrganizerIds?.includes(user.id);

  if (isOwner || isCoOrganizer) {
    return user;
  }

  // Check if user is a staff member with 'admin' or 'moderator' role for this event
  const staff = await db.query.eventStaff.findFirst({
    where: and(
      eq(eventStaff.eventId, eventId),
      eq(eventStaff.userId, user.id)
    ),
  });

  if (staff && (staff.role === 'admin' || staff.role === 'moderator')) {
    return user;
  }

  throw new Error('Unauthorized: You do not have ownership rights for this event');
}

/**
 * Validates if a user has a specific granular permission for an event (e.g., 'scan_tickets').
 * Useful for staff roles that aren't full owners.
 */
export async function validateStaffPermission(eventId: string, permission: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  // Admins have override access
  if (user.role === 'admin') {
    return user;
  }

  const staff = await db.query.eventStaff.findFirst({
    where: and(
      eq(eventStaff.eventId, eventId),
      eq(eventStaff.userId, user.id)
    ),
  });

  if (staff) {
    const permissions = staff.permissions as string[] | null;
    if (staff.role === 'admin' || (permissions && permissions.includes(permission))) {
      return user;
    }
  }

  // Also check if they are the owner/co-organizer as they have all permissions
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (event && (event.organizerId === user.id || event.coOrganizerIds?.includes(user.id))) {
    return user;
  }

  throw new Error(`Unauthorized: Missing permission '${permission}' for this event`);
}
