'use server';

import { validateEventOwnership, validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, eventFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { eventSummarizerFlow, socialMediaPostFlow, predictiveAttendanceFlow, aiSentimentAnalysisFlow } from '@/lib/ai';
import { registrations } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function generateSocialMediaPosts(eventId: string) {
  // Guard: Owner or admin
  const user = await validateEventOwnership(eventId);

  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) throw new Error('Event not found');

    const platforms: Array<'twitter' | 'linkedin' | 'instagram'> = ['twitter', 'linkedin', 'instagram'];
    
    const posts = await Promise.all(platforms.map(async (platform) => {
      const { post } = await socialMediaPostFlow({
        eventTitle: event.title,
        platform
      });
      return post;
    }));

    return posts;
  } catch (error) {
    console.error('Social Post AI Error:', error);
    return [];
  }
}

export async function getPredictiveAttendance(eventId: string) {
  // Guard: Owner or admin
  await validateEventOwnership(eventId);

  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) throw new Error('Event not found');

    // Get registration trend (counts per day for last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendData = await db
      .select({
        count: sql<number>`count(*)::int`,
        date: sql<string>`DATE(purchase_date)`
      })
      .from(registrations)
      .where(sql`event_id = ${eventId} AND purchase_date >= ${sevenDaysAgo.toISOString()}`)
      .groupBy(sql`DATE(purchase_date)`)
      .orderBy(sql`DATE(purchase_date)`);

    const registrationTrend = trendData.map(d => d.count);
    // Fill with zeros if less than 7 days of data
    while (registrationTrend.length < 7) registrationTrend.unshift(0);

    const prediction = await predictiveAttendanceFlow({
      eventDetails: event,
      registrationTrend,
    });

    return prediction;
  } catch (error) {
    console.error('Prediction Error:', error);
    return { predictedTotal: 0, confidenceScore: 0, factors: [] };
  }
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

    return { 
      success: true, 
      summary 
    };
  } catch (error: any) {
    console.error('Failed to generate summary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze sentiment of event feedback
 */
export async function getFeedbackSentiment(eventId: string) {
  await validateEventOwnership(eventId);

  try {
    const feedbackList = await db
      .select()
      .from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId));

    const feedbackComments = feedbackList
      .map(f => f.comment)
      .filter(Boolean) as string[];

    if (feedbackComments.length === 0) {
      return { overallSentiment: 'neutral', keyThemes: [], averageRating: 0 };
    }

    const analysis = await aiSentimentAnalysisFlow({
      feedback: feedbackComments,
    });

    return analysis;
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return { overallSentiment: 'neutral', keyThemes: [], averageRating: 0 };
  }
}
