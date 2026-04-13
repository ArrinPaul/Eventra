'use server';

import { db } from '@/lib/db';
import { events, users, tickets } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, desc, and, gte, lte, or, ilike, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { EventraEvent } from '@/types';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { generateEmbedding } from '@/lib/ai';
import { RRule } from 'rrule';

import { logActivity } from './feed';
import { awardXP } from './gamification';

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
 * Create a new event, with optional recurrence support
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
      status: 'published',
      type: data.type || 'physical',
      location: data.location || { venue: 'TBD' },
      capacity: data.capacity || 100,
      organizerId: user.id,
      price: data.price || '0',
      isPaid: data.isPaid || false,
      isRecurring: data.isRecurring || false,
      recurrenceRule: data.recurrenceRule,
      waitlistEnabled: data.waitlistEnabled || false,
      visibility: data.visibility || 'public',
    }).returning();

    const parentEvent = newEvent[0];

    // Log Activity
    await logActivity({
      userId: user.id,
      type: 'event_created',
      targetId: parentEvent.id,
      content: parentEvent.title,
      metadata: { category: parentEvent.category }
    });

    // Award XP
    await awardXP(user.id, 100, 'Creating an event');

    // Generate embedding in background
    updateEventEmbedding(parentEvent.id).catch(err => console.error('Initial embedding failed:', err));

    // If it's recurring, generate the first few instances (e.g., next 10 or 3 months)
    if (data.isRecurring && data.recurrenceRule) {
      await generateRecurringInstances(parentEvent.id, data.recurrenceRule);
    }

    revalidatePath('/explore');
    revalidatePath('/organizer');
    
    return { success: true, event: parentEvent };
  } catch (error) {
    console.error('Failed to create event:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Helper to generate child instances for a recurring event
 */
export async function generateRecurringInstances(parentId: string, ruleString: string) {
  const parent = await db.query.events.findFirst({ where: eq(events.id, parentId) });
  if (!parent) return;

  try {
    const rule = RRule.fromString(ruleString);
    // Generate instances for the next 3 months, max 12 instances
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    const dates = rule.between(now, threeMonthsFromNow, true).slice(1, 13); // Skip first date as it's the parent

    if (dates.length === 0) return;

    const duration = parent.endDate.getTime() - parent.startDate.getTime();

    const instances = dates.map(date => ({
      title: parent.title,
      description: parent.description,
      startDate: date,
      endDate: new Date(date.getTime() + duration),
      imageUrl: parent.imageUrl,
      category: parent.category,
      status: 'published',
      type: parent.type,
      location: parent.location,
      capacity: parent.capacity,
      organizerId: parent.organizerId,
      price: parent.price,
      isPaid: parent.isPaid,
      isRecurring: false, // Child instances are not recurring themselves
      parentEventId: parent.id,
      waitlistEnabled: parent.waitlistEnabled,
      visibility: parent.visibility,
    }));

    await db.insert(events).values(instances);
  } catch (error) {
    console.error('Failed to generate recurring instances:', error);
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

    // Refresh embedding if title or description changed
    if (data.title || data.description) {
      updateEventEmbedding(id).catch(err => console.error('Embedding refresh failed:', err));
    }

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

/**
 * Clone an existing event
 */
export async function cloneEvent(id: string) {
  // Guard: Must be the owner or an admin
  const user = await validateEventOwnership(id);

  try {
    const originalEvent = await db.query.events.findFirst({
      where: eq(events.id, id)
    });

    if (!originalEvent) throw new Error('Original event not found');

    const clonedEvent = await db.insert(events).values({
      title: `${originalEvent.title} (Clone)`,
      description: originalEvent.description,
      startDate: originalEvent.startDate,
      endDate: originalEvent.endDate,
      imageUrl: originalEvent.imageUrl,
      category: originalEvent.category,
      status: 'draft',
      type: originalEvent.type,
      location: originalEvent.location,
      capacity: originalEvent.capacity,
      organizerId: user.id,
      price: originalEvent.price,
      isPaid: originalEvent.isPaid,
    }).returning();

    revalidatePath('/organizer');
    
    return clonedEvent[0].id;
  } catch (error) {
    console.error('Failed to clone event:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Generate and store embedding for an event
 */
export async function updateEventEmbedding(eventId: string) {
  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) throw new Error('Event not found');

    const contentToEmbed = `${event.title} ${event.category} ${event.description}`;
    const embeddingResponse = await generateEmbedding(contentToEmbed);
    
    // The embedding is in embeddingResponse[0].embedding
    const vectorData = embeddingResponse[0].embedding;

    await db
      .update(events)
      .set({ embedding: vectorData })
      .where(eq(events.id, eventId));

    return { success: true };
  } catch (error) {
    console.error('Failed to update embedding:', error);
    return { success: false };
  }
}

/**
 * Get events by proximity (Cosine similarity)
 */
export async function getRecommendedEventsByVector(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.interests) return [];

    const userEmbeddingResponse = await generateEmbedding(user.interests);
    const userVector = userEmbeddingResponse[0].embedding;

    // Fetch all events with embeddings
    const allEvents = await db
      .select({
        id: events.id,
        title: events.title,
        category: events.category,
        embedding: events.embedding,
      })
      .from(events)
      .where(sql`embedding IS NOT NULL`)
      .limit(100);

    // Manual cosine similarity
    const withScore = allEvents.map(event => {
      const eventVector = event.embedding as number[];
      if (!eventVector || !Array.isArray(eventVector)) return { ...event, score: 0 };
      
      let dotProduct = 0;
      let magA = 0;
      let magB = 0;
      const len = Math.min(userVector.length, eventVector.length);
      for (let i = 0; i < len; i++) {
        dotProduct += userVector[i] * eventVector[i];
        magA += userVector[i] * userVector[i];
        magB += eventVector[i] * eventVector[i];
      }
      const similarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
      return { ...event, score: similarity };
    });

    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

  } catch (error) {
    console.error('Vector Recommendation Error:', error);
    return [];
  }
}
