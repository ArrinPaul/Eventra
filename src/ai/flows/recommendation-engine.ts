'use server';
/**
 * @fileOverview AI-powered recommendation engine for events, content, and connections
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// User behavior and preference schema
const UserBehaviorSchema = z.object({
  userId: z.string(),
  eventAttendanceHistory: z.array(z.object({
    eventId: z.string(),
    eventType: z.string(),
    rating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional(),
    duration: z.number().optional() // minutes attended
  })),
  engagementPatterns: z.object({
    preferredEventTypes: z.array(z.string()),
    preferredTimeSlots: z.array(z.string()),
    networkingStyle: z.enum(['active', 'moderate', 'passive']),
    learningPreferences: z.array(z.enum(['hands-on', 'theoretical', 'discussion', 'presentation']))
  }),
  skillDevelopmentGoals: z.array(z.string()),
  networkingGoals: z.array(z.string()),
  currentFocus: z.array(z.string()).describe('Current professional focus areas')
});

const EventRecommendationInputSchema = z.object({
  userBehavior: UserBehaviorSchema,
  availableEvents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.string(),
    tags: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    format: z.enum(['workshop', 'talk', 'panel', 'networking', 'hackathon']),
    duration: z.number(),
    speakers: z.array(z.object({
      name: z.string(),
      expertise: z.array(z.string())
    })).optional(),
    expectedAttendees: z.number().optional(),
    prerequisites: z.array(z.string()).optional()
  })),
  contextualFactors: z.object({
    currentTime: z.string(),
    userAvailability: z.array(z.string()),
    recentInteractions: z.array(z.string()).optional(),
    trendingTopics: z.array(z.string()).optional()
  })
});

const EventRecommendationSchema = z.object({
  eventId: z.string(),
  relevanceScore: z.number().min(0).max(100),
  recommendationReason: z.string().describe('Why this event is recommended'),
  personalizedPitch: z.string().describe('Compelling reason specific to user'),
  expectedValue: z.array(z.string()).describe('What the user will gain'),
  optimalAttendanceStrategy: z.string().describe('How to get the most value'),
  networkingOpportunities: z.array(z.string()).describe('Key networking possibilities'),
  preparationSuggestions: z.array(z.string()).max(3).describe('How to prepare'),
  confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Recommendation confidence')
});

const EventRecommendationOutputSchema = z.object({
  recommendations: z.array(EventRecommendationSchema).max(10).describe('Top event recommendations'),
  insights: z.object({
    overallRecommendationQuality: z.enum(['excellent', 'good', 'moderate']),
    diversityScore: z.number().min(0).max(100).describe('Diversity of recommendation types'),
    learningPathSuggestions: z.array(z.string()).describe('Suggested learning progression'),
    weeklyPlan: z.string().describe('Optimal weekly event attendance plan')
  })
});

export type EventRecommendationInput = z.infer<typeof EventRecommendationInputSchema>;
export type EventRecommendationOutput = z.infer<typeof EventRecommendationOutputSchema>;

export async function generateEventRecommendations(input: EventRecommendationInput): Promise<EventRecommendationOutput> {
  return eventRecommendationFlow(input);
}

const eventRecommendationPrompt = ai.definePrompt({
  name: 'eventRecommendationPrompt',
  input: { schema: EventRecommendationInputSchema },
  output: { schema: EventRecommendationOutputSchema },
  prompt: `You are an AI-powered event curator and career development advisor with expertise in personalized learning and professional growth.
  
  USER BEHAVIOR PROFILE:
  {{{userBehavior}}}
  
  AVAILABLE EVENTS:
  {{{availableEvents}}}
  
  CONTEXTUAL FACTORS:
  {{{contextualFactors}}}
  
  RECOMMENDATION CRITERIA:
  1. Skill Development Alignment: Match events to user's learning goals
  2. Career Progression: Support user's professional advancement
  3. Interest Compatibility: Align with demonstrated preferences
  4. Optimal Challenge Level: Neither too easy nor overwhelming
  5. Network Value: High-value networking opportunities
  6. Time Investment ROI: Best value for time commitment
  7. Complementary Learning: Build upon previous events attended
  8. Trend Relevance: Current industry trends and emerging skills
  
  For each recommendation:
  - Calculate relevance score based on multi-factor analysis
  - Provide compelling, personalized reasoning
  - Suggest optimal attendance and engagement strategies
  - Identify key networking opportunities
  - Include preparation recommendations
  
  Create a diverse portfolio of recommendations balancing different learning styles, difficulty levels, and professional development areas.
  
  Focus on creating genuine value and measurable professional growth outcomes.`,
});

const eventRecommendationFlow = ai.defineFlow(
  {
    name: 'eventRecommendationFlow',
    inputSchema: EventRecommendationInputSchema,
    outputSchema: EventRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await eventRecommendationPrompt(input);
      return output || {
        recommendations: input.availableEvents.slice(0, 5).map((event, index) => ({
          eventId: event.id,
          relevanceScore: Math.max(60, 85 - (index * 5)),
          recommendationReason: `Matches your interest in ${event.type} and aligns with your development goals`,
          personalizedPitch: `This ${event.format} on ${event.title} could enhance your expertise`,
          expectedValue: ['Skill development', 'Networking opportunities', 'Industry insights'],
          optimalAttendanceStrategy: 'Attend actively, take notes, and engage with speakers',
          networkingOpportunities: ['Connect with speakers', 'Meet fellow attendees', 'Join discussions'],
          preparationSuggestions: ['Review event materials', 'Prepare questions', 'Set networking goals'],
          confidenceLevel: 'medium' as const
        })),
        insights: {
          overallRecommendationQuality: 'good' as const,
          diversityScore: 75,
          learningPathSuggestions: ['Focus on core skills first', 'Gradually increase difficulty'],
          weeklyPlan: 'Attend 2-3 events per week with at least one networking session'
        }
      };
    } catch (error) {
      console.error('Event recommendation flow error:', error);
      throw new Error('Failed to generate event recommendations');
    }
  }
);

// Content recommendation system
const ContentRecommendationInputSchema = z.object({
  userProfile: z.object({
    userId: z.string(),
    skills: z.array(z.string()),
    interests: z.array(z.string()),
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    timeAvailability: z.object({
      dailyLearningTime: z.number().describe('Minutes per day'),
      preferredSchedule: z.array(z.string())
    })
  }),
  availableContent: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['article', 'video', 'course', 'podcast', 'tutorial', 'case-study']),
    topics: z.array(z.string()),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedTime: z.number().describe('Minutes to complete'),
    format: z.string(),
    author: z.string(),
    rating: z.number().min(1).max(5).optional(),
    prerequisites: z.array(z.string()).optional()
  })),
  contextualData: z.object({
    recentlyConsumed: z.array(z.string()).describe('Recently accessed content IDs'),
    currentProjects: z.array(z.string()).optional(),
    upcomingDeadlines: z.array(z.string()).optional()
  })
});

const ContentRecommendationSchema = z.object({
  contentId: z.string(),
  relevanceScore: z.number().min(0).max(100),
  learningObjectives: z.array(z.string()).describe('What the user will learn'),
  personalizedRationale: z.string().describe('Why this content is valuable now'),
  optimalConsumptionTime: z.string().describe('Best time to engage with this content'),
  followUpActions: z.array(z.string()).describe('What to do after consuming'),
  relatedContent: z.array(z.string()).describe('Complementary content IDs'),
  difficultyMatch: z.enum(['perfect', 'slightly-easy', 'slightly-hard']).describe('Difficulty appropriateness')
});

const ContentRecommendationOutputSchema = z.object({
  recommendations: z.array(ContentRecommendationSchema).max(15),
  learningPlan: z.object({
    weeklyPlan: z.array(z.object({
      day: z.string(),
      contentIds: z.array(z.string()),
      totalTime: z.number(),
      focusArea: z.string()
    })),
    progressMilestones: z.array(z.string()),
    skillBuildingSequence: z.array(z.string())
  })
});

export type ContentRecommendationInput = z.infer<typeof ContentRecommendationInputSchema>;
export type ContentRecommendationOutput = z.infer<typeof ContentRecommendationOutputSchema>;

export async function generateContentRecommendations(input: ContentRecommendationInput): Promise<ContentRecommendationOutput> {
  return contentRecommendationFlow(input);
}

const contentRecommendationPrompt = ai.definePrompt({
  name: 'contentRecommendationPrompt',
  input: { schema: ContentRecommendationInputSchema },
  output: { schema: ContentRecommendationOutputSchema },
  prompt: `You are an AI learning advisor and content curator specializing in personalized professional development.
  
  USER PROFILE:
  {{{userProfile}}}
  
  AVAILABLE CONTENT:
  {{{availableContent}}}
  
  CONTEXTUAL DATA:
  {{{contextualData}}}
  
  CURATION STRATEGY:
  1. Learning Style Alignment: Match content format to user preferences
  2. Skill Gap Analysis: Identify and address knowledge gaps
  3. Progressive Difficulty: Ensure appropriate challenge progression
  4. Time Optimization: Fit learning into available time slots
  5. Practical Application: Prioritize immediately applicable content
  6. Reinforcement Learning: Build upon previous content consumption
  7. Diverse Formats: Mix different content types for engagement
  8. Current Relevance: Consider ongoing projects and deadlines
  
  Create a comprehensive learning plan that:
  - Provides immediate value and long-term skill development
  - Respects time constraints and learning preferences
  - Builds a logical progression of knowledge and skills
  - Includes variety to maintain engagement
  - Connects learning to practical application
  
  Design weekly learning schedules that are realistic and effective.`,
});

const contentRecommendationFlow = ai.defineFlow(
  {
    name: 'contentRecommendationFlow',
    inputSchema: ContentRecommendationInputSchema,
    outputSchema: ContentRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await contentRecommendationPrompt(input);
      return output || {
        recommendations: input.availableContent.slice(0, 10).map((content, index) => ({
          contentId: content.id,
          relevanceScore: Math.max(60, 90 - (index * 3)),
          learningObjectives: [`Learn ${content.topics[0] || 'new concepts'}`, 'Apply knowledge practically'],
          personalizedRationale: `This ${content.type} aligns with your learning goals and skill development`,
          optimalConsumptionTime: 'During your preferred learning schedule',
          followUpActions: ['Practice concepts learned', 'Apply to current projects'],
          relatedContent: [],
          difficultyMatch: 'perfect' as const
        })),
        learningPlan: {
          weeklyPlan: [
            {
              day: 'Monday',
              contentIds: input.availableContent.slice(0, 2).map(c => c.id),
              totalTime: 60,
              focusArea: 'Core skills development'
            }
          ],
          progressMilestones: ['Complete foundational content', 'Apply learning to projects'],
          skillBuildingSequence: input.userProfile.skills.slice(0, 3)
        }
      };
    } catch (error) {
      console.error('Content recommendation flow error:', error);
      throw new Error('Failed to generate content recommendations');
    }
  }
);

// Professional connection recommendations
const ConnectionRecommendationInputSchema = z.object({
  userProfile: z.object({
    userId: z.string(),
    professionalGoals: z.array(z.string()),
    networkingObjectives: z.array(z.enum(['mentorship', 'collaboration', 'knowledge-sharing', 'career-advancement', 'business-development'])),
    currentRole: z.string(),
    industry: z.string(),
    experienceLevel: z.string(),
    connectionHistory: z.array(z.object({
      connectedUserId: z.string(),
      connectionType: z.string(),
      outcome: z.enum(['successful', 'neutral', 'unsuccessful']).optional()
    }))
  }),
  potentialConnections: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    role: z.string(),
    company: z.string(),
    industry: z.string(),
    expertise: z.array(z.string()),
    networkingStyle: z.enum(['mentor', 'peer', 'mentee', 'collaborator']),
    mutualConnections: z.number(),
    recentActivity: z.array(z.string()).optional()
  })),
  contextualSignals: z.object({
    eventContext: z.string().optional(),
    sharedInterests: z.array(z.string()).optional(),
    timingSensitivity: z.enum(['immediate', 'soon', 'flexible']).optional()
  })
});

const ConnectionRecommendationSchema = z.object({
  userId: z.string(),
  connectionValue: z.number().min(0).max(100),
  connectionRationale: z.string().describe('Why this connection is valuable'),
  mutualBenefit: z.object({
    userGains: z.array(z.string()),
    contactGains: z.array(z.string())
  }),
  approachStrategy: z.string().describe('Best way to initiate contact'),
  conversationStarters: z.array(z.string()).max(3),
  relationshipPotential: z.enum(['short-term', 'long-term', 'ongoing']),
  connectionTiming: z.string().describe('Optimal timing for outreach'),
  successLikelihood: z.enum(['high', 'medium', 'low'])
});

const ConnectionRecommendationOutputSchema = z.object({
  recommendations: z.array(ConnectionRecommendationSchema).max(8),
  networkingStrategy: z.object({
    priorityOrder: z.array(z.string()).describe('Recommended order of outreach'),
    weeklyOutreachPlan: z.string(),
    followUpSchedule: z.string(),
    relationshipNurturing: z.array(z.string())
  })
});

export type ConnectionRecommendationInput = z.infer<typeof ConnectionRecommendationInputSchema>;
export type ConnectionRecommendationOutput = z.infer<typeof ConnectionRecommendationOutputSchema>;

export async function generateConnectionRecommendations(input: ConnectionRecommendationInput): Promise<ConnectionRecommendationOutput> {
  return connectionRecommendationFlow(input);
}

const connectionRecommendationPrompt = ai.definePrompt({
  name: 'connectionRecommendationPrompt',
  input: { schema: ConnectionRecommendationInputSchema },
  output: { schema: ConnectionRecommendationOutputSchema },
  prompt: `You are a professional networking strategist and relationship-building expert with deep understanding of career development and business relationships.
  
  USER PROFILE:
  {{{userProfile}}}
  
  POTENTIAL CONNECTIONS:
  {{{potentialConnections}}}
  
  CONTEXTUAL SIGNALS:
  {{{contextualSignals}}}
  
  NETWORKING STRATEGY FRAMEWORK:
  1. Mutual Value Creation: Identify win-win opportunities
  2. Relationship Depth Potential: Assess long-term relationship value
  3. Professional Alignment: Match career goals and interests
  4. Timing Optimization: Consider optimal outreach timing
  5. Approach Personalization: Tailor connection strategy to individual
  6. Network Effect: Consider broader network implications
  7. Reciprocity Potential: Ensure mutual benefit possibilities
  8. Cultural Fit: Assess communication and working style compatibility
  
  For each recommendation:
  - Quantify connection value based on multiple factors
  - Identify specific mutual benefits and value propositions
  - Suggest personalized, authentic approach strategies
  - Provide conversation starters that feel natural and engaging
  - Assess relationship potential and success likelihood
  - Consider optimal timing and context
  
  Create a comprehensive networking strategy that builds meaningful, sustainable professional relationships.`,
});

const connectionRecommendationFlow = ai.defineFlow(
  {
    name: 'connectionRecommendationFlow',
    inputSchema: ConnectionRecommendationInputSchema,
    outputSchema: ConnectionRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await connectionRecommendationPrompt(input);
      return output || {
        recommendations: input.potentialConnections.slice(0, 5).map((connection, index) => ({
          userId: connection.userId,
          connectionValue: Math.max(65, 85 - (index * 4)),
          connectionRationale: `Strong professional alignment and potential for mutual collaboration`,
          mutualBenefit: {
            userGains: ['Industry insights', 'Career guidance', 'Collaboration opportunities'],
            contactGains: ['Fresh perspectives', 'Skill complementarity', 'Network expansion']
          },
          approachStrategy: 'Reach out with a personalized message highlighting shared interests',
          conversationStarters: [
            `I noticed your work in ${connection.expertise[0] || 'your field'}`,
            'Would love to learn about your experience',
            'Interested in exploring potential collaboration'
          ],
          relationshipPotential: 'long-term' as const,
          connectionTiming: 'Within the next week for optimal engagement',
          successLikelihood: 'medium' as const
        })),
        networkingStrategy: {
          priorityOrder: input.potentialConnections.slice(0, 5).map(c => c.userId),
          weeklyOutreachPlan: '2-3 new connections per week with personalized approach',
          followUpSchedule: 'Follow up within 1 week, then monthly check-ins',
          relationshipNurturing: ['Regular value-add sharing', 'Mutual introductions', 'Collaborative opportunities']
        }
      };
    } catch (error) {
      console.error('Connection recommendation flow error:', error);
      throw new Error('Failed to generate connection recommendations');
    }
  }
);

export const aiRecommendationFunctions = {
  generateEventRecommendations,
  generateContentRecommendations,
  generateConnectionRecommendations
};