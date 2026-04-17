'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { events, users } from '@/lib/db/schema';
import { eq, ne } from 'drizzle-orm';
import { recommendationFlow, contentRecommendationFlow, connectionRecommendationFlow } from '@/lib/ai';
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
    const interests = user.interests ? user.interests.split(',').map((i: string) => i.trim()) : [];
    
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

export async function getAIContentRecommendations(userId: string) {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);
	
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) throw new Error('User not found');

    // In a real app, we'd fetch from a 'content' or 'resources' table
    const mockContent = [
      { id: '1', title: 'Mastering Event Networking', category: 'Professional Development' },
      { id: '2', title: 'The Future of AI in Events', category: 'Technology' },
      { id: '3', title: 'Sustainability in Large Scale Gatherings', category: 'Environment' }
    ];

    const interests = user.interests ? user.interests.split(',').map((i: string) => i.trim()) : [];

    const { recommendedContent } = await contentRecommendationFlow({
      userInterests: interests,
      availableContent: mockContent,
    });

    return recommendedContent;
  } catch (error) {
    console.error('Content Recommendation Error:', error);
    return [];
  }
}

export async function getAIConnectionRecommendations(userId: string) {
	await validateRole(['attendee', 'organizer', 'admin', 'professional']);
	
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) throw new Error('User not found');

    const others = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        interests: users.interests,
      })
      .from(users)
      .where(ne(users.id, userId))
      .limit(10);

    const { connections } = await connectionRecommendationFlow({
      userProfile: user,
      network: others,
    });

    return connections;
  } catch (error) {
    console.error('Connection Recommendation Error:', error);
    return [];
  }
}
