'use server';

import { db } from '@/lib/db';
import { eventUpdates, events } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

export async function createEventUpdate(data: {
  eventId: string;
  title: string;
  content: string;
  type?: string;
  sendEmail?: boolean;
}) {
  const user = await validateRole(['organizer', 'admin']);
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });

    if (!event) return { success: false, error: 'Event not found' };

    await db.insert(eventUpdates).values({
      eventId: data.eventId,
      title: data.title,
      content: data.content,
      type: data.type || 'general',
      status: 'published',
      publishedAt: new Date(),
      createdBy: user.id,
      sendEmail: data.sendEmail ?? true,
    });

    revalidatePath(`/events/${data.eventId}/notifications`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to create event update', error);
    return { success: false, error: 'Failed to create update' };
  }
}

export async function getEventUpdates(eventId: string) {
  try {
    const result = await db
      .select()
      .from(eventUpdates)
      .where(eq(eventUpdates.eventId, eventId))
      .orderBy(desc(eventUpdates.createdAt));

    return result;
  } catch (error) {
    logger.error('Failed to fetch event updates', error);
    return [];
  }
}

export async function deleteEventUpdate(updateId: string) {
  const user = await validateRole(['organizer', 'admin']);
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await db.delete(eventUpdates).where(eq(eventUpdates.id, updateId));
    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete event update', error);
    return { success: false, error: 'Failed to delete update' };
  }
}
