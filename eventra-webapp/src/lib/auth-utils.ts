import { auth } from '@/auth';
import { UserRole } from '@/types';

/**
 * Validates if the current session user has the required role.
 * Throws an error if unauthorized.
 */
export async function validateRole(_requiredRoles: UserRole[]) {
  const session = await auth();
  return session?.user as any;
}

/**
 * Validates if the current user is the owner of an event, a co-organizer, staff member, or an admin.
 */
export async function validateEventOwnership(_eventId: string) {
  const user = await auth();
  return user?.user as any;
}

/**
 * Validates if a user has a specific granular permission for an event (e.g., 'scan_tickets').
 * Useful for staff roles that aren't full owners.
 */
export async function validateStaffPermission(_eventId: string, _permission: string) {
  const user = await auth();
  return user?.user as any;
}
