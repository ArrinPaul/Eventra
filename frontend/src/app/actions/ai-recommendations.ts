'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, users } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { recommendationFlow } from '@/lib/ai';
import { auth } from '@/auth';

export interface RecommendationBundle {
	events: Array<{ id: string; title: string; category?: string; score?: number }>;
	sessions: Array<{ id: string; title: string; track?: string; score?: number }>;
	people: Array<{ id: string; name: string; role?: string; score?: number }>;
}

/**
 * Get personalized recommendations using Genkit
 */
export async function getAIRecommendations(userId: string) {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    // 1. Get User Profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) throw new Error('User not found');

    // 2. Get Available Events
    const availableEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
      })
      .from(events)
      .where(ne(events.status, 'cancelled'))
      .limit(20);

    // 3. Run AI Recommendation Flow
    const interests = user.interests ? user.interests.split(',').map(i => i.trim()) : [];
    
    const { recommendations } = await recommendationFlow({
      userInterests: interests,
      userRole: user.role,
      availableEvents: availableEvents as any,
    });

    return recommendations;
  } catch (error) {
    console.error('Recommendation Error:', error);
    return [];
  }
}

// Keep other mock functions for now as they are not primary Phase 3 goals
export async function getPersonalizedRecommendations(userId?: string): Promise<RecommendationBundle> {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);
	return {
		events: [],
		sessions: [],
		people: [],
	};
}

export async function getAIContentRecommendations(userId?: string): Promise<Array<{ id: string; title: string; type?: string; contentId?: string; difficulty?: string; author?: string; personalizedRationale?: string; relevanceScore?: number; estimatedTime?: number }>> {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);
	return [];
}

export async function getAIConnectionRecommendations(userId?: string): Promise<Array<{ id: string; name: string; score?: number; userId?: string; successLikelihood?: 'high' | 'medium' | 'low'; role?: string; company?: string; connectionRationale?: string; connectionValue?: number; conversationStarters?: string[]; approachStrategy?: string }>> {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);
	return [];
}
