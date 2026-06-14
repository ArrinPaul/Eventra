'use server';

import { db } from '@/lib/db';
import { eventStaff, users, events } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { validateEventOwnership } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

function sanitizeCollabError(error: any, fallback: string): never {
  const message = error?.message || '';
  const isBusinessError =
    message.includes('User not found') ||
    message.includes('already part of the staff') ||
    message.includes('Staff record not found') ||
    message.includes('Unauthorized') ||
    message.includes('Event not found');

  if (isBusinessError) {
    throw error;
  }
  throw new Error(fallback);
}

/**
 * Add a user to event staff
 */
export async function addEventStaff(eventId: string, email: string, role: string) {
  await validateEventOwnership(eventId);

  try {
    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      throw new Error('User not found with this email.');
    }

    // 2. Check if already staff
    const existing = await db.query.eventStaff.findFirst({
      where: and(
        eq(eventStaff.eventId, eventId),
        eq(eventStaff.userId, user.id)
      )
    });

    if (existing) {
      throw new Error('User is already part of the staff for this event.');
    }

    // 3. Add to staff
    const [newStaff] = await db
      .insert(eventStaff)
      .values({
        eventId,
        userId: user.id,
        role,
      })
      .returning();

    revalidatePath(`/organizer/collab/${eventId}`);
    return newStaff;
  } catch (error: any) {
    console.error('addEventStaff Error:', error);
    sanitizeCollabError(error, 'Failed to add staff');
  }
}

/**
 * Update a staff member's role or permissions
 */
export async function updateEventStaff(staffId: string, data: { role?: string, permissions?: string[] }) {
  try {
    const staff = await db.query.eventStaff.findFirst({
      where: eq(eventStaff.id, staffId)
    });

    if (!staff) throw new Error('Staff record not found');
    await validateEventOwnership(staff.eventId);

    const [updated] = await db
      .update(eventStaff)
      .set({
        role: data.role ?? staff.role,
        permissions: data.permissions ?? staff.permissions,
      })
      .where(eq(eventStaff.id, staffId))
      .returning();

    revalidatePath(`/organizer/collab/${staff.eventId}`);
    return updated;
  } catch (error: any) {
    console.error('updateEventStaff Error:', error);
    sanitizeCollabError(error, 'Failed to update staff');
  }
}

/**
 * Remove a user from event staff
 */
export async function removeEventStaff(staffId: string) {
  try {
    const staff = await db.query.eventStaff.findFirst({
      where: eq(eventStaff.id, staffId)
    });

    if (!staff) throw new Error('Staff record not found');
    
    await validateEventOwnership(staff.eventId);

    await db
      .delete(eventStaff)
      .where(eq(eventStaff.id, staffId));

    revalidatePath(`/organizer/collab/${staff.eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error('removeEventStaff Error:', error);
    sanitizeCollabError(error, 'Failed to remove staff');
  }
}

/**
 * Get all staff for an event
 */
export async function getEventStaff(eventId: string) {
  await validateEventOwnership(eventId);

  try {
    const result = await db
      .select({
        id: eventStaff.id,
        role: eventStaff.role,
        createdAt: eventStaff.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        }
      })
      .from(eventStaff)
      .innerJoin(users, eq(eventStaff.userId, users.id))
      .where(eq(eventStaff.eventId, eventId))
      .orderBy(desc(eventStaff.createdAt));

    return result;
  } catch (error) {
    console.error('getEventStaff Error:', error);
    return [];
  }
}
