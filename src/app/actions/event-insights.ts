'use server';

import { eventSummarizerFlow } from '@/ai/flows/event-summarizer';
import { socialMediaPostFlow } from '@/ai/flows/ai-social-posts';
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
    await convex.mutation(api.events.update, {
      id: eventId as any,
      updates: {
        summary: result.summary + "\n\nHighlights:\n" + result.highlights.map(h => `- ${h}`).join('\n') + "\n\nKey Takeaways:\n" + result.keyTakeaways.map(t => `- ${t}`).join('\n')
      }
    });

    return { success: true, summary: result.summary };
  } catch (error: any) {
    console.error('Event summarization error:', error);
    return { success: false, error: error.message || 'Failed to generate summary' };
  }
}

export async function generateSocialMediaPosts(eventId: string) {
  try {
    const event = await convex.query(api.events.getById, { id: eventId as any });
    if (!event) throw new Error('Event not found');

    const locationDisplay = typeof event.location === 'string'
      ? event.location
      : event.location?.venue
        ? (typeof event.location.venue === 'string' ? event.location.venue : event.location.venue?.name ?? '')
        : '';

    const result = await socialMediaPostFlow({
      title: event.title,
      description: event.description,
      category: event.category,
      startDate: event.startDate,
      location: locationDisplay,
    });

    return { success: true, posts: result.posts };
  } catch (error: any) {
    console.error('Social post generation error:', error);
    return { success: false, error: error.message || 'Failed to generate posts' };
  }
}
