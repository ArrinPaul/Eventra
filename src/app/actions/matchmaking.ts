'use server';

import { generateConnectionRecommendations, ConnectionRecommendationInput } from '@/ai/flows/recommendation-engine';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { User } from '@/types';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface MatchmakingResult {
  recommendations: Array<{
    userId: string;
    name: string;
    role: string;
    company: string;
    connectionValue: number;
    rationale: string;
    conversationStarters: string[];
    image?: string;
  }>;
  strategy?: {
    weeklyPlan: string;
    priorityOrder: string[];
  };
  error?: string;
}

/**
 * Get AI-powered matchmaking recommendations for networking
 */
export async function getMatchmakingRecommendations(userId: string): Promise<MatchmakingResult> {
  try {
    // 1. Fetch current user and all other users
    const allUsers = await convex.query(api.users.list) as any[];
    const currentUser = allUsers.find(u => u._id === userId || u.id === userId);

    if (!currentUser) {
      return { recommendations: [], error: 'User not found' };
    }

    // 2. Filter potential connections (exclude self)
    const potentialConnectionsRaw = allUsers.filter(u => (u._id !== userId && u.id !== userId) && u.onboardingCompleted);

    if (potentialConnectionsRaw.length === 0) {
      return { recommendations: [], error: 'No potential connections found yet' };
    }

    // 3. Transform data for AI flow
    const userProfile: ConnectionRecommendationInput['userProfile'] = {
      userId: currentUser._id || currentUser.id,
      professionalGoals: currentUser.interests ? currentUser.interests.split(',').map((i: string) => i.trim()) : ['Networking', 'Career growth'],
      networkingObjectives: ['knowledge-sharing', 'collaboration'],
      currentRole: currentUser.designation || currentUser.role || 'Member',
      industry: currentUser.company || 'Professional Services',
      experienceLevel: currentUser.role === 'student' ? 'Junior' : 'Senior',
      connectionHistory: [] // Can be populated if we had a connections table
    };

    const potentialConnections = potentialConnectionsRaw.slice(0, 20).map(u => ({
      userId: u._id || u.id,
      name: u.name || 'Anonymous User',
      role: u.designation || u.role || 'Professional',
      company: u.company || u.college || 'Eventra Member',
      industry: u.interests || 'Technology',
      expertise: u.interests ? u.interests.split(',').map((i: string) => i.trim()) : [],
      networkingStyle: 'peer' as const,
      mutualConnections: Math.floor(Math.random() * 5),
    }));

    // 4. Call the AI flow
    const result = await generateConnectionRecommendations({
      userProfile,
      potentialConnections,
      contextualSignals: {
        sharedInterests: userProfile.professionalGoals,
        timingSensitivity: 'soon'
      }
    });

    // 5. Enrich results with user profile data (like images)
    const enrichedRecommendations = result.recommendations.map(rec => {
      const user = potentialConnectionsRaw.find(u => (u._id === rec.userId || u.id === rec.userId));
      return {
        userId: rec.userId,
        name: user?.name || 'Unknown',
        role: user?.designation || user?.role || 'Professional',
        company: user?.company || user?.college || '',
        connectionValue: rec.connectionValue,
        rationale: rec.connectionRationale,
        conversationStarters: rec.conversationStarters,
        image: user?.image
      };
    });

    return {
      recommendations: enrichedRecommendations,
      strategy: {
        weeklyPlan: result.networkingStrategy.weeklyOutreachPlan,
        priorityOrder: result.networkingStrategy.priorityOrder
      }
    };

  } catch (error) {
    console.error('Matchmaking error:', error);
    return {
      recommendations: [],
      error: 'AI Matchmaking service unavailable. Please try again later.'
    };
  }
}
