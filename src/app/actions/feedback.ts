'use server';

import { analyzeFeedback } from '@/ai/flows/feedback-analysis';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getEventFeedbackAnalysis(eventId: string) {
  try {
    // 1. Fetch event and reviews
    const event = await convex.query(api.events.getById, { id: eventId as any });
    if (!event) return { success: false, error: 'Event not found' };

    const reviews = await convex.query(api.reviews.getByEvent, { eventId: eventId as any }) as any[];

    if (reviews.length === 0) {
      return { 
        success: true, 
        analysis: { 
          summary: "No reviews yet.", 
          strengths: [], 
          improvements: [], 
          sentimentScore: 0 
        } 
      };
    }

    // 2. Analyze with AI
    const result = await analyzeFeedback({
      eventTitle: event.title,
      reviews: reviews.map(r => ({
        rating: r.rating,
        comment: r.comment
      }))
    });

    return { success: true, analysis: result };
  } catch (error) {
    console.error('Feedback analysis error:', error);
    return { success: false, error: 'Failed to analyze feedback' };
  }
}
