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
    } catch (err) {
      console.error(`[auth-utils] Lazy sync failed for ${userId}:`, err);
      return null;
    }
  }

  return user;
}

/**
 * Get full auth context for the current user.
 */
export async function getAuthContext() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, clerkId: null, mongoUser: null, isAuthenticated: false };
  }
  const mongoUser = await getOrCreateUser(userId);
  return { userId, clerkId: userId, mongoUser, isAuthenticated: true };
}

/**
 * Get auth context scoped to a specific event (role, permissions, isOrganizer, canAccess).
 */
export async function getEventAuthContext(eventId: string) {
  const authCtx = await getAuthContext();
  if (!authCtx.isAuthenticated) {
    return { ...authCtx, role: null, permissions: [], isOrganizer: false, canAccess: false };
  }

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    return { ...authCtx, role: null, permissions: [], isOrganizer: false, canAccess: false };
  }

  const isOrganizer = event.organizerId === authCtx.userId || event.coOrganizerIds?.includes(authCtx.userId!);
  if (authCtx.mongoUser?.role === 'admin') {
    return { ...authCtx, role: 'admin', permissions: ['all'], isOrganizer: true, canAccess: true };
  }

  const staff = await db.query.eventStaff.findFirst({
    where: and(eq(eventStaff.eventId, eventId), eq(eventStaff.userId, authCtx.userId!)),
  });

  return {
    ...authCtx,
    role: staff?.role || (isOrganizer ? 'organizer' : null),
    permissions: staff?.permissions as string[] || (isOrganizer ? ['all'] : []),
    isOrganizer,
    canAccess: isOrganizer || !!staff,
  };
}

/**
 * Check if user can access event management (organizer, co-organizer, staff, or admin).
 */
export async function canAccessEventManagement(userId: string, eventId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return false;
  if (user.role === 'admin') return true;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return false;
  if (event.organizerId === userId || event.coOrganizerIds?.includes(userId)) return true;

  const staff = await db.query.eventStaff.findFirst({
    where: and(eq(eventStaff.eventId, eventId), eq(eventStaff.userId, userId)),
  });
  return !!staff;
}

/**
 * Check if user has a specific permission for an event.
 */
export async function hasEventPermission(userId: string, eventId: string, permission: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return false;
  if (user.role === 'admin') return true;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return false;
  if (event.organizerId === userId || event.coOrganizerIds?.includes(userId)) return true;

  const staff = await db.query.eventStaff.findFirst({
    where: and(eq(eventStaff.eventId, eventId), eq(eventStaff.userId, userId)),
  });
  if (!staff) return false;
  const permissions = staff.permissions as string[] | null;
  return staff.role === 'admin' || !!permissions?.includes(permission);
}

/**
 * Require authentication - throws if not authenticated.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: Authentication required');
  const user = await getOrCreateUser(userId);
  if (!user) throw new Error('Unauthorized: User profile not found');
  return user;
}

/**
 * Require access to a specific event - throws if no access.
 */
export async function requireEventAccess(eventId: string) {
  const user = await requireAuth();
  const hasAccess = await canAccessEventManagement(user.id, eventId);
  if (!hasAccess) throw new Error('Unauthorized: No access to this event');
  return user;
}

/**
 * Require a specific permission for an event - throws if missing.
 */
export async function requireEventPermission(eventId: string, permission: string) {
  const user = await requireAuth();
  const hasPermission = await hasEventPermission(user.id, eventId, permission);
  if (!hasPermission) throw new Error(`Unauthorized: Missing permission '${permission}'`);
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
    throw new Error('Unauthorized: User profile not found. Please complete onboarding.');
  }

  if (!requiredRoles.includes(user.role as UserRole)) {
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
