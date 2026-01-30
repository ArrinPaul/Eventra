'use server';

import { generateEventRecommendations, EventRecommendationInput } from '@/ai/flows/recommendation-engine';
import type { Event } from '@/types';

export interface AIRecommendation {
  eventId: string;
  relevanceScore: number;
  reason: string;
  pitch: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface AIRecommendationsResult {
  recommendations: AIRecommendation[];
  insights?: {
    weeklyPlan?: string;
    learningPath?: string[];
  };
  error?: string;
}

/**
 * Get AI-powered event recommendations for a user
 */
export async function getAIRecommendations(
  userId: string,
  userInterests: string[],
  userSkills: string[],
  pastEventTypes: string[],
  availableEvents: Event[]
): Promise<AIRecommendationsResult> {
  try {
    // Transform events to the format expected by the AI flow
    const transformedEvents = availableEvents.slice(0, 20).map(event => {
      // Access extended event properties that may not be on the base Event type
      const eventData = event as Event & { difficulty?: 'advanced' | 'intermediate' | 'beginner' };
      return {
        id: event.id,
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
          // Handle Speaker object - expertise is in speakerProfile
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

    // Build user behavior profile
    const userBehavior: EventRecommendationInput['userBehavior'] = {
      userId,
      eventAttendanceHistory: pastEventTypes.map((type, i) => ({
        eventId: `past-${i}`,
        eventType: type,
        rating: 4
      })),
      engagementPatterns: {
        preferredEventTypes: userInterests.length > 0 ? userInterests : ['Tech', 'Networking', 'Workshop'],
        preferredTimeSlots: ['evening', 'weekend'],
        networkingStyle: 'moderate',
        learningPreferences: ['hands-on', 'discussion']
      },
      skillDevelopmentGoals: userSkills.length > 0 ? userSkills : ['networking', 'professional development'],
      networkingGoals: ['expand network', 'find mentors'],
      currentFocus: userInterests.length > 0 ? userInterests : ['career growth']
    };

    const contextualFactors = {
      currentTime: new Date().toISOString(),
      userAvailability: ['weekday-evening', 'weekend'],
      trendingTopics: ['AI', 'sustainability', 'remote work']
    };

    // Call the AI flow
    const result = await generateEventRecommendations({
      userBehavior,
      availableEvents: transformedEvents,
      contextualFactors
    });

    // Transform recommendations back to our simpler format
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
    
    // Return fallback recommendations based on simple matching
    const fallbackRecs = generateFallbackRecommendations(availableEvents, userInterests);
    
    return {
      recommendations: fallbackRecs,
      error: 'AI service unavailable, showing smart picks instead'
    };
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
