'use server';

import { db } from '@/lib/db';
import { events, users } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, desc, and, gte, lte, or, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { EventraEvent } from '@/types';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';

/**
 * Fetch events with optional filtering
 */
export async function getEvents(filters?: {
  category?: string;
  search?: string;
  limit?: number;
  organizerId?: string;
  status?: string;
}) {
  try {
    const query = db.select().from(events);
    
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(events.status, filters.status as any));
    } else {
      conditions.push(eq(events.status, 'published'));
    }

    if (filters?.organizerId) {
      conditions.push(eq(events.organizerId, filters.organizerId));
    }

    if (filters?.category && filters.category !== 'All') {
      conditions.push(eq(events.category, filters.category));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(events.title, `%${filters.search}%`),
          ilike(events.description, `%${filters.search}%`)
        ) as any
      );
    }

    const result = await query
      .where(and(...conditions))
      .orderBy(desc(events.startDate))
      .limit(filters?.limit || 50);

    return result;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

/**
 * Fetch a single event by ID
 */
export async function getEventById(id: string) {
  try {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return null;
  }
}

/**
 * Create a new event
 */
export async function createEvent(data: any) {
  // Guard: Only organizers or admins can create events
  const user = await validateRole(['organizer', 'admin']);

  try {
    const newEvent = await db.insert(events).values({
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      imageUrl: data.imageUrl,
      category: data.category,
      status: 'published', // Default to published for now
      type: data.type || 'physical',
      location: data.location || { venue: 'TBD' },
      capacity: data.capacity || 100,
      organizerId: user.id,
      price: data.price || '0',
      isPaid: data.isPaid || false,
    }).returning();

    revalidatePath('/explore');
    revalidatePath('/organizer');
    
    return { success: true, event: newEvent[0] };
  } catch (error) {
    console.error('Failed to create event:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, data: any) {
  // Guard: Must be the owner or an admin
  await validateEventOwnership(id);

  try {
    const updatedEvent = await db
      .update(events)
      .set({
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        imageUrl: data.imageUrl,
        category: data.category,
        type: data.type,
        location: data.location,
        capacity: data.capacity,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    revalidatePath('/explore');
    revalidatePath(`/events/${id}`);
    revalidatePath('/organizer');
    
    return { success: true, event: updatedEvent[0] };
  } catch (error) {
    console.error('Failed to update event:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  // Guard: Must be the owner or an admin
  await validateEventOwnership(id);

  try {
    await db.delete(events).where(eq(events.id, id));

    revalidatePath('/explore');
    revalidatePath('/organizer');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete event:', error);
    throw new Error('Database operation failed');
  }
}
