'use server';

import { validateEventOwnership, validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, eventFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { eventSummarizerFlow } from '@/lib/ai';

export async function generateSocialMediaPosts(eventId: string) {
  // Guard: Owner or admin
  await validateEventOwnership(eventId);
  return ['Mock post 1', 'Mock post 2'];
}

export async function getPredictiveAttendance(eventId: string) {
  // Guard: Owner or admin
  await validateEventOwnership(eventId);
  return { predicted: 100, confidence: 0.8 };
}

/**
 * Generate an AI summary for an event based on its details and feedback
 */
export async function generateEventSummary(eventId: string) {
  // Guard: Owner or admin
  await validateEventOwnership(eventId);

  try {
    // 1. Fetch Event Details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) throw new Error('Event not found');

    // 2. Fetch Feedback
    const feedbackList = await db
      .select()
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId));

    const feedbackComments = feedbackList
      .map(f => f.comment)
      .filter(Boolean) as string[];

    // 3. Run Genkit Flow
    const { summary } = await eventSummarizerFlow({
      eventTitle: event.title,
      eventDescription: event.description,
      attendeeCount: event.registeredCount,
      feedback: feedbackComments,
    });

    // 4. Update event with the summary
    await db
      .update(events)
      .set({ 
        // We might want to add a summary column to events table if we haven't
        // For now, let's assume we return it to the UI
      })
      .where(eq(events.id, eventId));

    return { 
      success: true, 
      summary 
    };
  } catch (error: any) {
    console.error('Failed to generate summary:', error);
    return { success: false, error: error.message };
  }
}
