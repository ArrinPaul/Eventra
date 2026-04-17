'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { eventPlannerFlow, smartSchedulerFlow, organizerTaskListFlow } from '@/lib/ai';

/**
 * Use AI to suggest event description and agenda
 */
export async function generateAIExtensions(data: { title: string, category: string, description?: string }) {
  // Guard: Organizer or admin
  await validateRole(['organizer', 'admin']);

  try {
    const result = await eventPlannerFlow(data);
    return {
      success: true,
      description: result.suggestedDescription,
      agenda: result.suggestedAgenda,
    };
  } catch (error: any) {
    console.error('Event Planner AI Error:', error);
    return { success: false, error: error.message };
  }
}

// Aliases for frontend compatibility
export async function getAIEventPlan(data: any) {
  return generateAIExtensions(data);
}

/**
 * Generate a list of tasks for the organizer based on event description
 */
export async function generateOrganizerTaskList(eventId: string) {
  await validateRole(['organizer', 'admin']);

  try {
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) throw new Error('Event not found');

    const result = await organizerTaskListFlow({
      eventTitle: event.title,
      eventDescription: event.description,
      eventType: event.type,
      startDate: event.startDate.toLocaleString(),
    });

    return result.tasks;
  } catch (error: any) {
    console.error('Task Generation Error:', error);
    return [];
  }
}

/**
 * Use AI to suggest best timing for an event
 */
export async function getAISchedulingRecommendations(data: { title: string, category: string, targetAudience?: string }) {
  await validateRole(['organizer', 'admin']);
  
  try {
    const recommendations = await smartSchedulerFlow({
      eventTitle: data.title,
      category: data.category,
      targetAudience: data.targetAudience,
    });
    return recommendations;
  } catch (error) {
    console.error('Scheduling AI Error:', error);
    return {
      bestDays: ['Saturday', 'Friday'],
      bestTimeSlots: ['10:00', '14:00'],
      reasoning: 'Failed to generate AI recommendations.'
    };
  }
}
