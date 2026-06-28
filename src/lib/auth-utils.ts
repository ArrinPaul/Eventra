import { UserRole } from '@/types';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { events, eventStaff, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Internal helper to fetch user from DB, with lazy-sync from Clerk if missing.
 */
async function getOrCreateUser(userId: string) {
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    console.warn(`[auth-utils] User ${userId} missing from DB. Attempting lazy sync...`);
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.error(`[auth-utils] Clerk user not found for ID: ${userId}`);
      return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error(`[auth-utils] Clerk user ${userId} has no email address`);
      return null;
    }

    try {
      const [newlyCreated] = await db.insert(users)
        .values({
          id: userId,
          email: email,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
          image: clerkUser.imageUrl,
          role: 'attendee',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { updatedAt: new Date() }
        })
        .returning();
      
      user = newlyCreated;
      console.log(`[auth-utils] Lazy sync successful for ${userId}`);
    } catch (err) {
      console.error(`[auth-utils] Lazy sync failed for ${userId}:`, err);
      return null;
    }
  }

  return user;
}

/**
 * Validates if the current session user has the required role.
 */
export async function validateRole(requiredRoles: UserRole[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: Authentication required');

  const user = await getOrCreateUser(userId);
  if (!user) {
    console.error(`[auth-utils] validateRole failed: user ${userId} could not be found or synced`);
    throw new Error('Unauthorized: User profile not found. Please complete onboarding.');
  }

  if (!requiredRoles.includes(user.role as UserRole)) {
    console.error(`[auth-utils] Role mismatch for ${userId}. DB Role: ${user.role}, Required: [${requiredRoles.join(', ')}]`);
    throw new Error(`Unauthorized: Insufficient permissions (Role: ${user.role})`);
  }

  return user as { id: string; role: UserRole; [key: string]: any };
}

/**
 * Validates if the current user is the owner of an event, a co-organizer, staff member, or an admin.
 */
export async function validateEventOwnership(eventId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: Authentication required');

  const user = await getOrCreateUser(userId);
  if (!user) throw new Error('Unauthorized: User profile not found');

  if (user.role === 'admin') return user;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) throw new Error('Event not found');

  const isOwner = event.organizerId === user.id;
  const isCoOrganizer = event.coOrganizerIds?.includes(user.id);

  if (isOwner || isCoOrganizer) return user;

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
 * Validates if a user has a specific granular permission for an event.
 */
export async function validateStaffPermission(eventId: string, permission: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: Authentication required');

  const user = await getOrCreateUser(userId);
  if (!user) throw new Error('Unauthorized: User profile not found');

  if (user.role === 'admin') return user;

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

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (event && (event.organizerId === user.id || event.coOrganizerIds?.includes(user.id))) {
    return user;
  }

  throw new Error(`Unauthorized: Missing permission '${permission}' for this event`);
}
