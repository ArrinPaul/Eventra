'use server';

import { db } from '@/lib/db';
import { feedbackTemplates, eventFeedback, events, notifications, tickets } from '@/lib/db/schema';
import { eq, and, desc, sql, avg } from 'drizzle-orm';
import { validateRole, validateEventOwnership } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

/**
 * Upsert a feedback template
 */
export async function upsertFeedbackTemplate(data: {
  id?: string;
  eventId?: string;
  title: string;
  description?: string;
  questions: any[];
  isDefault?: boolean;
}) {
  const user = await validateRole(['organizer', 'admin']);
  
  if (data.eventId) {
    await validateEventOwnership(data.eventId);
  }

  try {
    if (data.id) {
      const [updated] = await db
        .update(feedbackTemplates)
        .set({
          title: data.title,
          description: data.description,
          questions: data.questions,
          isDefault: data.isDefault ?? false,
        })
        .where(eq(feedbackTemplates.id, data.id))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(feedbackTemplates)
        .values({
          eventId: data.eventId,
          title: data.title,
          description: data.description,
          questions: data.questions,
          isDefault: data.isDefault ?? false,
        })
        .returning();
      
      // If linked to event, update event feedbackTemplateId
      if (data.eventId) {
        await db
          .update(events)
          .set({ feedbackTemplateId: created.id })
          .where(eq(events.id, data.eventId));
      }
      
      return created;
    }
  } catch (error) {
    console.error('upsertFeedbackTemplate Error:', error);
    throw new Error('Failed to save feedback template');
  }
}

/**
 * Get feedback templates
 */
export async function getFeedbackTemplates(eventId?: string) {
  try {
    const conditions = [];
    if (eventId) {
      conditions.push(sql`${feedbackTemplates.eventId} = ${eventId} OR ${feedbackTemplates.isDefault} = true`);
    } else {
      conditions.push(eq(feedbackTemplates.isDefault, true));
    }

    return await db
      .select()
      .from(feedbackTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedbackTemplates.createdAt));
  } catch (error) {
    console.error('getFeedbackTemplates Error:', error);
    return [];
  }
}

/**
 * Submit feedback for an event
 */
export async function submitEventFeedback(data: {
  eventId: string;
  rating: number;
  comment?: string;
  responses?: any;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Authentication required');

  // Verify the user actually attended/checked-in
  const ticket = await db.query.tickets.findFirst({
    where: and(
      eq(tickets.eventId, data.eventId),
      eq(tickets.userId, session.user.id),
      eq(tickets.status, 'checked-in')
    )
  });

  if (!ticket) {
    throw new Error('You can only leave feedback for events you have attended.');
  }

  try {
    const [feedback] = await db
      .insert(eventFeedback)
      .values({
        eventId: data.eventId,
        userId: session.user.id,
        rating: data.rating,
        comment: data.comment,
        responses: data.responses,
      })
      .returning();

    revalidatePath(`/events/${data.eventId}`);
    return feedback;
  } catch (error) {
    console.error('submitEventFeedback Error:', error);
    throw new Error('Failed to submit feedback');
  }
}

/**
 * Get feedback analytics for an event
 */
export async function getEventFeedbackAnalytics(eventId: string) {
  await validateEventOwnership(eventId);

  try {
    const feedbackList = await db
      .select()
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId))
      .orderBy(desc(eventFeedback.createdAt));

    const averageRating = await db
      .select({ value: avg(eventFeedback.rating) })
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId));

    // Calculate NPS (Net Promoter Score)
    // NPS = % Promoters (9-10) - % Detractors (0-6)
    // Since our rating is likely 1-5, let's map: 5=Promoter, 4=Passive, 1-3=Detractor
    const total = feedbackList.length;
    if (total === 0) return { averageRating: 0, nps: 0, total: 0, feedbackList: [] };

    const promoters = feedbackList.filter(f => f.rating === 5).length;
    const detractors = feedbackList.filter(f => f.rating <= 3).length;
    const nps = Math.round(((promoters - detractors) / total) * 100);

    return {
      averageRating: Number(averageRating[0]?.value || 0).toFixed(1),
      nps,
      total,
      feedbackList
    };
  } catch (error) {
    console.error('getEventFeedbackAnalytics Error:', error);
    throw new Error('Failed to load analytics');
  }
}
