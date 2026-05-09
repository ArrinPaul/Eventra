import { UserRole } from '@/types';

/**
 * AUTH BYPASS MODE (Development)
 * These utility functions always succeed and return a mock user.
 */
const MOCK_USER = {
  id: 'dev-admin-id',
  role: 'admin' as UserRole,
  name: 'Dev Admin',
  email: 'admin@eventra.local',
  onboardingCompleted: true,
};

export async function validateRole(requiredRoles: UserRole[]) {
  console.log(`Bypass mode: validateRole called for ${requiredRoles.join(', ')}`);
  return MOCK_USER;
}

export async function validateEventOwnership(eventId: string) {
  console.log(`Bypass mode: validateEventOwnership called for event ${eventId}`);
  return MOCK_USER;
}

export async function validateStaffPermission(eventId: string, permission: string) {
  console.log(`Bypass mode: validateStaffPermission called for ${permission} on ${eventId}`);
  return MOCK_USER;
}

/* --- ORIGINAL AUTH-UTILS (COMMENTED OUT FOR DEVELOPMENT) ---
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { events, eventStaff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Validates if the current session user has the required role.
 * Throws an error if unauthorized.
 *\/
export async function validateRole(requiredRoles: UserRole[]) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id || !requiredRoles.includes((user as any).role as UserRole)) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  return user as { id: string; role: UserRole; [key: string]: any };
}

/**
 * Validates if the current user is the owner of an event, a co-organizer, staff member, or an admin.
 *\/
export async function validateEventOwnership(eventId: string) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
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
 *\/
export async function validateStaffPermission(eventId: string, permission: string) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
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
*/
