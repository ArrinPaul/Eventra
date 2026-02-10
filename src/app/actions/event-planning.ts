'use server';

import { generateEventPlan } from '@/ai/flows/event-planner';
import { smartSchedulerFlow } from '@/ai/flows/smart-scheduler';

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

export async function getAISchedulingRecommendations(data: {
  title: string;
  description: string;
  category: string;
  targetAudience?: string;
  preferredDuration?: number;
}) {
  try {
    const result = await smartSchedulerFlow(data);
    return { success: true, ...result };
  } catch (error) {
    console.error('AI Scheduling error:', error);
    return { success: false, error: 'Failed to get scheduling recommendations' };
  }
}
