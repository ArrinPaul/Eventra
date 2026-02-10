'use server';

import { eventSummarizerFlow } from '@/ai/flows/event-summarizer';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function generateEventSummary(eventId: string) {
  try {
    // 1. Get event details
    const event = await convex.query(api.events.getById, { id: eventId as any });
    if (!event) throw new Error('Event not found');

    // 2. Get attendee feedback
    const reviews = await convex.query(api.reviews.getByEvent, { eventId: eventId as any });
    const feedbackStrings = reviews.map(r => r.comment).filter(Boolean) as string[];

    // 3. Run AI Flow
    const result = await eventSummarizerFlow({
      eventTitle: event.title,
      description: event.description,
      category: event.category,
      attendeeCount: event.registeredCount,
      feedback: feedbackStrings,
    });

    // 4. Update event with summary
    // Since we're in a server action, we need a way to call Convex mutation
    // We'll use a new mutation for this
    await convex.mutation(api.events.update, {
      id: eventId as any,
      updates: {
        summary: result.summary + "

Highlights:
" + result.highlights.map(h => `- ${h}`).join('
') + "

Key Takeaways:
" + result.keyTakeaways.map(t => `- ${t}`).join('
')
      }
    });

    return { success: true, summary: result.summary };
  } catch (error: any) {
    console.error('Event summarization error:', error);
    return { success: false, error: error.message || 'Failed to generate summary' };
  }
}
