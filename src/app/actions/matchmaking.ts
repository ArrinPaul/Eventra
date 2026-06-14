'use server';

import { validateRole } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { ne, eq, and } from 'drizzle-orm';
import { matchmakingFlow, generateEmbedding } from '@/lib/ai';
import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

/**
 * Find AI-powered connection matches for the user
 */
export async function getMatches() {
  const { userId } = await auth();
  if (!userId) throw new Error('Auth required');

  try {
    // 1. Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) throw new Error('User not found');

    // 2. Generate user embedding if needed
    if (!user.embedding && (user.interests || user.bio)) {
      const content = `${user.interests || ''} ${user.bio || ''} ${user.role}`;
      const embedding = await generateEmbedding(content);
      const vectorData = embedding?.[0]?.embedding;
      if (!vectorData) {
        return [];
      }
      await db.update(users).set({ embedding: vectorData }).where(eq(users.id, userId));
      user.embedding = vectorData;
    }

    // 3. Get potential matches using vector proximity if embeddings exist
    let potentialMatches: any[] = [];
    
    if (user.embedding) {
      const userVectorStr = JSON.stringify(user.embedding);
      const results = await db.execute(sql`
        SELECT id, name, role, interests, bio,
               (1 - (embedding <=> ${userVectorStr}::vector)) as similarity
        FROM users
        WHERE id != ${user.id} AND embedding IS NOT NULL
        ORDER BY embedding <=> ${userVectorStr}::vector
        LIMIT 10
      `);
      potentialMatches = results as any;
    } else {
      // Fallback to random
      potentialMatches = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          interests: users.interests,
          bio: users.bio,
        })
        .from(users)
        .where(ne(users.id, user.id))
        .limit(10);
    }

    // 4. Run AI flow for final ranking and reasoning
    const { matches } = await matchmakingFlow({
      userProfile: user,
      potentialMatches,
    });

    // 5. Enrich with names
    const enrichedMatches = matches.map(match => {
      const original = potentialMatches.find(p => p.id === match.userId);
      return {
        ...match,
        name: original?.name || 'Member',
      };
    });

    return enrichedMatches;
  } catch (error) {
    console.error('Matchmaking Error:', error);
    return [];
  }
}

// Aliases for frontend compatibility
export async function getMatchmakingRecommendations() {
  return getMatches();
}

export type MatchmakingResult = Awaited<ReturnType<typeof getMatches>>[number];
