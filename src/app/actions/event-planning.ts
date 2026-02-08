'use server';

import { generateEventPlan } from '@/ai/flows/event-planner';

export async function getAIEventPlan(data: {
  title: string;
  eventType: string;
  description?: string;
  duration: number;
}) {
  try {
    const result = await generateEventPlan({
      title: data.title,
      eventType: data.eventType,
      description: data.description,
      duration: data.duration,
    });
    return { success: true, ...result };
  } catch (error) {
    console.error('AI Event Planning error:', error);
    return { success: false, error: 'Failed to generate event plan' };
  }
}
