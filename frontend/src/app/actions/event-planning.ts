'use server';

import { validateRole } from '@/lib/auth-utils';
import { eventPlannerFlow, smartSchedulerFlow } from '@/lib/ai';

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
      reasoning: 'Failed to generate AI recommendations. Falling back to defaults.'
    };
  }
}
