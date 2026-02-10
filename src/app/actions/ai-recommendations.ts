'use server';

import { 
  generateEventRecommendations, 
  EventRecommendationInput,
  generateContentRecommendations,
  ContentRecommendationInput,
  generateConnectionRecommendations,
  ConnectionRecommendationInput
} from '@/ai/flows/recommendation-engine';
import type { Event, User } from '@/types';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { validateAIAction } from "@/core/utils/ai-auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ... types keep same ...

/**
 * Get AI-powered event recommendations for a user
 */
export async function getAIRecommendations(
  userId: string,
  userInterests?: string[],
  userSkills?: string[],
  pastEventTypes?: string[],
  availableEvents?: Event[]
): Promise<AIRecommendationsResult> {
  try {
    // 0. Auth check
    await validateAIAction('recommendations');

    let events = availableEvents;
    let interests = userInterests;
    let skills = userSkills;
    let history = pastEventTypes;

    // 1. Fetch data from Convex if not provided
    if (!events || events.length === 0) {
      const allEvents = await convex.query(api.events.get);
      events = allEvents.map((e: any) => ({ ...e, id: e._id }));
    }

    if (!interests || !skills) {
      const user = await convex.query(api.users.list).then((users: any[]) => 
        users.find(u => u._id === userId || u.id === userId)
      ) as User | undefined;

      if (user) {
        interests = interests || (user.interests ? user.interests.split(',').map(i => i.trim()) : []);
        skills = skills || []; // Could be fetched from a skills table if it existed
        history = history || user.myEvents || [];
      }
    }

    // Ensure we have defaults
    interests = interests || ['Tech', 'Networking', 'Career'];
    skills = skills || ['learning', 'professional development'];
    history = history || [];
    const eventsToProcess = (events || []).filter(e => e.status !== 'cancelled').slice(0, 30);

    if (eventsToProcess.length === 0) {
      return { recommendations: [], error: 'No active events found for recommendations' };
    }

    // 2. Transform events to the format expected by the AI flow
    const transformedEvents = eventsToProcess.map(event => {
      const eventData = event as Event & { difficulty?: 'advanced' | 'intermediate' | 'beginner' };
      return {
        id: event.id || (event as any)._id,
        title: event.title,
        description: event.description || '',
        type: event.category || 'General',
        tags: event.tags || [],
        difficulty: eventData.difficulty || ('intermediate' as const),
        format: mapEventFormat(event.category || ''),
        duration: 120, // Default 2 hours
        speakers: event.speakers?.map(s => {
          if (typeof s === 'string') {
            return { name: s, expertise: [] };
          }
          const speakerObj = s as { name?: string; displayName?: string; speakerProfile?: { expertise?: string[] }; expertise?: string[] };
          return {
            name: speakerObj.name || speakerObj.displayName || 'Speaker',
            expertise: speakerObj.speakerProfile?.expertise || speakerObj.expertise || []
          };
        }) || [],
        expectedAttendees: event.registeredCount || 0,
        prerequisites: [] as string[]
      };
    });

    // 3. Build user behavior profile
    const userBehavior: EventRecommendationInput['userBehavior'] = {
      userId,
      eventAttendanceHistory: history.map((type, i) => ({
        eventId: `past-${i}`,
        eventType: typeof type === 'string' ? type : 'Workshop',
        rating: 4
      })),
      engagementPatterns: {
        preferredEventTypes: interests.length > 0 ? interests : ['Tech', 'Networking', 'Workshop'],
        preferredTimeSlots: ['evening', 'weekend'],
        networkingStyle: 'moderate',
        learningPreferences: ['hands-on', 'discussion']
      },
      skillDevelopmentGoals: skills.length > 0 ? skills : ['networking', 'professional development'],
      networkingGoals: ['expand network', 'find mentors'],
      currentFocus: interests.length > 0 ? interests : ['career growth']
    };

    const contextualFactors = {
      currentTime: new Date().toISOString(),
      userAvailability: ['weekday-evening', 'weekend'],
      trendingTopics: ['AI', 'sustainability', 'remote work']
    };

    // 4. Call the AI flow
    const result = await generateEventRecommendations({
      userBehavior,
      availableEvents: transformedEvents,
      contextualFactors
    });

    // 5. Transform recommendations back to our simpler format
    const recommendations: AIRecommendation[] = result.recommendations.map(rec => ({
      eventId: rec.eventId,
      relevanceScore: rec.relevanceScore,
      reason: rec.recommendationReason,
      pitch: rec.personalizedPitch,
      confidenceLevel: rec.confidenceLevel
    }));

    return {
      recommendations,
      insights: {
        weeklyPlan: result.insights.weeklyPlan,
        learningPath: result.insights.learningPathSuggestions
      }
    };

  } catch (error) {
    console.error('AI Recommendations error:', error);
    const fallbackRecs = generateFallbackRecommendations(availableEvents || [], userInterests || []);
    return {
      recommendations: fallbackRecs,
      error: 'AI service unavailable, showing smart picks instead'
    };
  }
}

/**
 * Get AI-powered content recommendations for a user
 */
export async function getAIContentRecommendations(userId: string): Promise<ContentRecommendation[]> {
  try {
    // Auth check
    await validateAIAction('recommendations');

    const users = await convex.query(api.users.list) as any[];
    const user = users.find(u => u._id === userId || u.id === userId);
    
    if (!user) return [];

    // Fetch dynamic content from Convex
    const allContent = await convex.query(api.content.list);
    
    // Provide a baseline if DB is empty
    const availableContent = allContent.length > 0 ? allContent : [
      { id: 'c1', title: 'Mastering Convex', type: 'course', topics: ['Convex', 'Database'], difficulty: 'intermediate', estimatedTime: 120, format: 'Video', author: 'Convex Team' },
      { id: 'c2', title: 'Next.js 15 App Router', type: 'tutorial', topics: ['Next.js', 'React'], difficulty: 'advanced', estimatedTime: 45, format: 'Reading', author: 'Vercel' },
      { id: 'c3', title: 'AI Integration Strategies', type: 'video', topics: ['AI', 'Product'], difficulty: 'intermediate', estimatedTime: 30, format: 'Video', author: 'Tech Insider' }
    ].map(c => ({ ...c, _id: c.id } as any));

    const result = await generateContentRecommendations({
      userProfile: {
        userId,
        skills: ['React', 'Next.js', 'TypeScript'],
        interests: user.interests ? user.interests.split(',').map((i: string) => i.trim()) : ['Technology'],
        learningStyle: 'visual',
        experienceLevel: 'intermediate',
        timeAvailability: { dailyLearningTime: 60, preferredSchedule: ['evening'] }
      },
      availableContent: availableContent.map((c: any) => ({
        id: c._id || c.id,
        title: c.title,
        type: c.type,
        topics: c.topics || [],
        difficulty: c.difficulty,
        estimatedTime: c.estimatedTime,
        format: c.format,
        author: c.author,
      })),
      contextualData: { recentlyConsumed: [] }
    });

    return result.recommendations.map(rec => {
      const content = availableContent.find((c: any) => (c._id || c.id) === rec.contentId);
      if (!content) return null;

      return {
        contentId: rec.contentId,
        title: content.title,
        type: content.type as any,
        relevanceScore: rec.relevanceScore,
        learningObjectives: rec.learningObjectives,
        personalizedRationale: rec.personalizedRationale,
        estimatedTime: content.estimatedTime,
        difficulty: content.difficulty as any,
        author: content.author
      };
    }).filter((r): r is ContentRecommendation => r !== null);
  } catch (error) {
    console.error("Content recommendation error:", error);
    return [];
  }
}

/**
 * Get AI-powered connection recommendations for a user
 */
export async function getAIConnectionRecommendations(userId: string): Promise<ConnectionRecommendation[]> {
  try {
    // Auth check
    await validateAIAction('recommendations');

    const allUsers = await convex.query(api.users.list) as any[];
    const currentUser = allUsers.find(u => u._id === userId || u.id === userId);
    if (!currentUser) return [];

    const potentialConnectionsRaw = allUsers.filter(u => u._id !== userId && u.onboardingCompleted);

    const result = await generateConnectionRecommendations({
      userProfile: {
        userId,
        professionalGoals: currentUser.interests ? currentUser.interests.split(',') : ['Networking'],
        networkingObjectives: ['knowledge-sharing'],
        currentRole: currentUser.designation || 'Professional',
        industry: currentUser.company || 'Tech',
        experienceLevel: 'Intermediate',
        connectionHistory: []
      },
      potentialConnections: potentialConnectionsRaw.slice(0, 10).map(u => ({
        userId: u._id,
        name: u.name || 'User',
        role: u.designation || u.role || 'Member',
        company: u.company || 'Tech',
        industry: u.interests || 'Technology',
        expertise: u.interests ? u.interests.split(',') : [],
        networkingStyle: 'peer',
        mutualConnections: 0
      })),
      contextualSignals: { timingSensitivity: 'flexible' }
    });

    return result.recommendations.map(rec => {
      const user = potentialConnectionsRaw.find(u => u._id === rec.userId);
      return {
        userId: rec.userId,
        name: user?.name || 'Unknown',
        role: user?.designation || user?.role || 'Professional',
        company: user?.company || '',
        connectionValue: rec.connectionValue,
        connectionRationale: rec.connectionRationale,
        mutualBenefit: rec.mutualBenefit,
        approachStrategy: rec.approachStrategy,
        conversationStarters: rec.conversationStarters,
        successLikelihood: rec.successLikelihood
      };
    });
  } catch (error) {
    console.error("Connection recommendation error:", error);
    return [];
  }
}

/**
 * Generate fallback recommendations when AI is unavailable
 */
function generateFallbackRecommendations(
  events: Event[], 
  interests: string[]
): AIRecommendation[] {
  // Score events based on simple matching
  const scored = events
    .filter(e => {
      const eventDate = e.startDate ? new Date(e.startDate) : new Date(e.date || '');
      return eventDate > new Date();
    })
    .map(event => {
      let score = 50; // Base score
      
      // Boost for matching interests
      if (interests.some(i => 
        event.category?.toLowerCase().includes(i.toLowerCase()) ||
        event.tags?.some(t => t.toLowerCase().includes(i.toLowerCase()))
      )) {
        score += 25;
      }
      
      // Boost for popularity
      if (event.registeredCount && event.registeredCount > 10) {
        score += Math.min(20, event.registeredCount / 2);
      }
      
      // Boost for upcoming events
      const eventDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
      const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) score += 10;
      if (daysUntil <= 3) score += 5;
      
      return {
        event,
        score: Math.min(95, score)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored.map(({ event, score }) => ({
    eventId: event.id,
    relevanceScore: score,
    reason: getMatchReason(event, interests),
    pitch: `Don't miss "${event.title}" - a great opportunity to ${event.category?.toLowerCase() === 'networking' ? 'expand your network' : 'learn something new'}!`,
    confidenceLevel: score > 75 ? 'high' : score > 60 ? 'medium' : 'low' as const
  }));
}

function getMatchReason(event: Event, interests: string[]): string {
  const matchingInterest = interests.find(i => 
    event.category?.toLowerCase().includes(i.toLowerCase()) ||
    event.tags?.some(t => t.toLowerCase().includes(i.toLowerCase()))
  );
  
  if (matchingInterest) {
    return `Matches your interest in ${matchingInterest}`;
  }
  
  if (event.registeredCount && event.registeredCount > 20) {
    return 'Popular event with high attendance';
  }
  
  const eventDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 3) {
    return 'Happening soon - don\'t miss out!';
  }
  
  return `Great ${event.category || 'event'} for professional growth`;
}

function mapEventFormat(category: string): 'workshop' | 'talk' | 'panel' | 'networking' | 'hackathon' {
  const lower = category.toLowerCase();
  if (lower.includes('workshop')) return 'workshop';
  if (lower.includes('network')) return 'networking';
  if (lower.includes('hack')) return 'hackathon';
  if (lower.includes('panel')) return 'panel';
  return 'talk';
}
