'use server';

import { db } from '@/lib/db';
import { eventFeedback, feedbackTemplates, events, tickets } from '@/lib/db/schema';
import { eq, and, or, sql, avg, count } from 'drizzle-orm';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

/**
 * Submit feedback for an event
 */
export async function submitFeedback(eventId: string, data: {
  rating: number;
  comment?: string;
  responses?: Record<string, any>;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Authentication required');

  // 1. Verify user actually attended/registered for the event
  const ticket = await db.query.tickets.findFirst({
    where: and(
      eq(tickets.eventId, eventId),
      eq(tickets.userId, session.user.id),
      eq(tickets.status, 'checked-in')
    )
  });

  if (!ticket) {
    throw new Error('Only checked-in attendees can submit feedback');
  }

  // 2. Check if already submitted
  const existing = await db.query.eventFeedback.findFirst({
    where: and(
      eq(eventFeedback.eventId, eventId),
      eq(eventFeedback.userId, session.user.id)
    )
  });

  if (existing) {
    throw new Error('You have already submitted feedback for this event');
  }

  try {
    await db.insert(eventFeedback).values({
      eventId,
      userId: session.user.id,
      rating: data.rating,
      comment: data.comment,
      responses: data.responses,
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error('Feedback submission error:', error);
    throw new Error('Failed to submit feedback');
  }
}

/**
 * Get feedback template for an event
 */
export async function getFeedbackTemplate(eventId: string) {
  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) return null;

    let template = null;
    
    if (event.feedbackTemplateId) {
      template = await db.query.feedbackTemplates.findFirst({
        where: eq(feedbackTemplates.id, event.feedbackTemplateId)
      });
    } else {
      // Fallback to default template or event-specific one
      template = await db.query.feedbackTemplates.findFirst({
        where: or(
          eq(feedbackTemplates.eventId, eventId),
          eq(feedbackTemplates.isDefault, true)
        )
      });
    }

    return template;
  } catch (error) {
    console.error('getFeedbackTemplate Error:', error);
    return null;
  }
}

/**
 * Create or update a feedback template
 */
export async function saveFeedbackTemplate(eventId: string, data: {
  title: string;
  description?: string;
  questions: any[];
}) {
  await validateEventOwnership(eventId);

  try {
    const [template] = await db.insert(feedbackTemplates).values({
      eventId,
      title: data.title,
      description: data.description,
      questions: data.questions,
    }).returning();

    // Link to event
    await db.update(events)
      .set({ feedbackTemplateId: template.id })
      .where(eq(events.id, eventId));

    revalidatePath(`/organizer/events/${eventId}`);
    return { success: true, template };
  } catch (error) {
    console.error('saveFeedbackTemplate Error:', error);
    throw new Error('Failed to save feedback template');
  }
}

/**
 * Get feedback stats and NPS for an event
 */
export async function getEventFeedbackStats(eventId: string) {
  await validateEventOwnership(eventId);

  try {
    const feedbackList = await db
      .select()
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId));

    if (feedbackList.length === 0) {
      return {
        totalResponses: 0,
        averageRating: 0,
        nps: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const total = feedbackList.length;
    let sumRating = 0;
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // NPS Logic: 5 is Promoter, 4 is Passive, 1-3 are Detractors (scaled for 1-5)
    // Real NPS is 0-10, but for 1-5: 5=Promoter, 4=Passive, 1-3=Detractor
    let promoters = 0;
    let detractors = 0;

    feedbackList.forEach(f => {
      sumRating += f.rating;
      breakdown[f.rating] = (breakdown[f.rating] || 0) + 1;
      
      if (f.rating === 5) promoters++;
      if (f.rating <= 3) detractors++;
    });

    const nps = Math.round(((promoters / total) - (detractors / total)) * 100);

    return {
      totalResponses: total,
      averageRating: Number((sumRating / total).toFixed(1)),
      nps,
      breakdown
    };
  } catch (error) {
    console.error('getEventFeedbackStats Error:', error);
    throw new Error('Failed to calculate feedback stats');
  }
}
