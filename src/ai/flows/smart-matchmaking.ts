'use server';
/**
 * @fileOverview Enhanced AI-powered matchmaking system with advanced algorithms
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Enhanced user profile schema with more detailed matching criteria
const EnhancedUserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string().optional(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  personalityType: z.string().optional(),
  workStyle: z.enum(['collaborative', 'independent', 'hybrid']).optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  lookingFor: z.array(z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'networking'])),
  availability: z.object({
    timeZone: z.string().optional(),
    preferredMeetingTimes: z.array(z.string()).optional(),
    commitmentLevel: z.enum(['casual', 'moderate', 'intensive']).optional()
  }).optional(),
  preferences: z.object({
    industryFocus: z.array(z.string()).optional(),
    teamSize: z.number().optional(),
    remotePreference: z.enum(['remote', 'in-person', 'hybrid']).optional()
  }).optional()
});

const SmartMatchInputSchema = z.object({
  userProfile: EnhancedUserProfileSchema,
  candidates: z.array(EnhancedUserProfileSchema),
  matchType: z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'networking']),
  projectContext: z.object({
    projectType: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    timeline: z.string().optional(),
    complexity: z.enum(['simple', 'moderate', 'complex']).optional()
  }).optional()
});

const MatchAnalysisSchema = z.object({
  userId: z.string(),
  compatibilityScore: z.number().min(0).max(100),
  matchType: z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'networking']),
  strengthAreas: z.array(z.string()).describe('Key areas where this match excels'),
  potentialChallenges: z.array(z.string()).describe('Areas that might need attention'),
  recommendedApproach: z.string().describe('How to best approach this match'),
  icebreakers: z.array(z.string()).max(3).describe('Personalized conversation starters'),
  collaborationStyle: z.string().describe('How they would work together best'),
  successPredictors: z.array(z.string()).describe('Factors that indicate likely success')
});

const SmartMatchOutputSchema = z.object({
  matches: z.array(MatchAnalysisSchema).describe('Top matches ranked by AI analysis'),
  insights: z.object({
    overallMatchQuality: z.enum(['excellent', 'good', 'moderate', 'limited']),
    recommendedActions: z.array(z.string()),
    diversityScore: z.number().min(0).max(100).describe('How diverse the match pool is'),
    matchingConfidence: z.number().min(0).max(100).describe('AI confidence in recommendations')
  })
});

export type SmartMatchInput = z.infer<typeof SmartMatchInputSchema>;
export type SmartMatchOutput = z.infer<typeof SmartMatchOutputSchema>;

export async function generateSmartMatches(input: SmartMatchInput): Promise<SmartMatchOutput> {
  return smartMatchFlow(input);
}

const smartMatchPrompt = ai.definePrompt({
  name: 'smartMatchPrompt',
  input: { schema: SmartMatchInputSchema },
  output: { schema: SmartMatchOutputSchema },
  prompt: `You are an AI matchmaking expert specializing in professional networking and team formation. 
  
  Analyze the user profile and candidate profiles to provide intelligent matching recommendations.
  
  USER PROFILE:
  {{{userProfile}}}
  
  MATCH TYPE: {{{matchType}}}
  
  PROJECT CONTEXT (if applicable):
  {{{projectContext}}}
  
  CANDIDATE PROFILES:
  {{{candidates}}}
  
  ANALYSIS CRITERIA:
  1. Skill Complementarity: How well skills complement each other
  2. Goal Alignment: Shared objectives and vision compatibility
  3. Experience Balance: Appropriate experience gap for mentoring or peer collaboration
  4. Personality Fit: Working style and communication compatibility
  5. Practical Factors: Availability, location, commitment level
  6. Growth Potential: Mutual learning and development opportunities
  7. Cultural Fit: Industry alignment and shared values
  
  For each candidate, provide:
  - A compatibility score (0-100) based on multifactorial analysis
  - Specific strength areas of the match
  - Potential challenges to be aware of
  - Personalized approach recommendations
  - 3 conversation starters tailored to their shared interests/goals
  - Collaboration style suggestions
  - Success predictors based on profile compatibility
  
  Also provide overall insights about match quality and recommendations for the user.
  
  Be specific, actionable, and focus on creating meaningful professional connections.`,
});

const smartMatchFlow = ai.defineFlow(
  {
    name: 'smartMatchFlow',
    inputSchema: SmartMatchInputSchema,
    outputSchema: SmartMatchOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await smartMatchPrompt(input);
      
      if (!output) {
        // Fallback response if AI fails
        return {
          matches: input.candidates.slice(0, 3).map((candidate, index) => ({
            userId: candidate.id,
            compatibilityScore: Math.max(50, 75 - (index * 10)),
            matchType: input.matchType,
            strengthAreas: ['Complementary skills', 'Shared interests'],
            potentialChallenges: ['Communication style alignment'],
            recommendedApproach: 'Start with shared interests and explore collaboration opportunities',
            icebreakers: [
              'I noticed we both have experience with similar projects',
              'Would you be interested in discussing industry trends?',
              'I\'d love to learn more about your approach to problem-solving'
            ],
            collaborationStyle: 'Regular check-ins with clear communication',
            successPredictors: ['Mutual respect', 'Shared goals']
          })),
          insights: {
            overallMatchQuality: 'moderate' as const,
            recommendedActions: ['Review profiles carefully before reaching out'],
            diversityScore: 70,
            matchingConfidence: 75
          }
        };
      }
      
      return output;
    } catch (error) {
      console.error('Smart matching flow error:', error);
      throw new Error('Failed to generate smart matches');
    }
  }
);

// Advanced team formation with AI insights
const TeamFormationInputSchema = z.object({
  projectDescription: z.string().describe('Detailed project description'),
  requiredRoles: z.array(z.string()).describe('Roles needed for the team'),
  skillRequirements: z.array(z.string()).describe('Technical and soft skills needed'),
  teamSize: z.number().min(2).max(10),
  timeline: z.string().describe('Project timeline and milestones'),
  workingStyle: z.enum(['remote', 'in-person', 'hybrid']),
  candidates: z.array(EnhancedUserProfileSchema)
});

const TeamCompositionSchema = z.object({
  teamMembers: z.array(z.object({
    userId: z.string(),
    proposedRole: z.string(),
    contribution: z.string().describe('What they bring to the team'),
    synergies: z.array(z.string()).describe('How they complement other members')
  })),
  teamDynamicsScore: z.number().min(0).max(100),
  riskFactors: z.array(z.string()),
  successFactors: z.array(z.string()),
  collaborationPlan: z.object({
    communicationStyle: z.string(),
    meetingCadence: z.string(),
    decisionMaking: z.string(),
    conflictResolution: z.string()
  }),
  alternativeTeams: z.array(z.object({
    members: z.array(z.string()),
    reasoning: z.string()
  })).optional()
});

const TeamFormationOutputSchema = z.object({
  recommendedTeam: TeamCompositionSchema,
  insights: z.object({
    formationConfidence: z.number().min(0).max(100),
    keyRecommendations: z.array(z.string()),
    timeline: z.string().describe('Suggested team formation timeline')
  })
});

export type TeamFormationInput = z.infer<typeof TeamFormationInputSchema>;
export type TeamFormationOutput = z.infer<typeof TeamFormationOutputSchema>;

export async function generateOptimalTeam(input: TeamFormationInput): Promise<TeamFormationOutput> {
  return teamFormationFlow(input);
}

const teamFormationPrompt = ai.definePrompt({
  name: 'teamFormationPrompt',
  input: { schema: TeamFormationInputSchema },
  output: { schema: TeamFormationOutputSchema },
  prompt: `You are an expert team formation consultant with deep knowledge of team dynamics, project management, and human psychology.
  
  PROJECT DETAILS:
  Description: {{{projectDescription}}}
  Required Roles: {{{requiredRoles}}}
  Skills Needed: {{{skillRequirements}}}
  Team Size: {{{teamSize}}}
  Timeline: {{{timeline}}}
  Working Style: {{{workingStyle}}}
  
  AVAILABLE CANDIDATES:
  {{{candidates}}}
  
  ANALYSIS FRAMEWORK:
  1. Role Fit: How well each candidate fits required roles
  2. Skill Coverage: Ensuring all critical skills are covered
  3. Team Balance: Complementary personalities and working styles
  4. Communication Compatibility: Ensuring effective collaboration
  5. Experience Distribution: Right mix of senior and junior members
  6. Cultural Alignment: Shared values and work approaches
  7. Risk Mitigation: Identifying and addressing potential issues
  
  Form the optimal team considering:
  - Complete skill coverage with minimal overlap
  - Balanced team dynamics and personalities
  - Clear role definitions and responsibilities
  - Strong collaboration potential
  - Risk factors and mitigation strategies
  - Alternative team compositions for comparison
  
  Provide specific, actionable insights for successful team formation and management.`,
});

const teamFormationFlow = ai.defineFlow(
  {
    name: 'teamFormationFlow',
    inputSchema: TeamFormationInputSchema,
    outputSchema: TeamFormationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await teamFormationPrompt(input);
      return output || {
        recommendedTeam: {
          teamMembers: input.candidates.slice(0, input.teamSize).map((candidate, index) => ({
            userId: candidate.id,
            proposedRole: input.requiredRoles[index % input.requiredRoles.length] || 'Team Member',
            contribution: `Brings ${candidate.skills.slice(0, 2).join(' and ')} expertise`,
            synergies: ['Cross-functional collaboration', 'Knowledge sharing']
          })),
          teamDynamicsScore: 75,
          riskFactors: ['Communication coordination', 'Role clarity'],
          successFactors: ['Complementary skills', 'Shared goals'],
          collaborationPlan: {
            communicationStyle: 'Regular team meetings with async updates',
            meetingCadence: 'Weekly team sync, daily standups',
            decisionMaking: 'Consensus-based with clear escalation',
            conflictResolution: 'Open dialogue and mediation'
          }
        },
        insights: {
          formationConfidence: 75,
          keyRecommendations: ['Establish clear communication protocols', 'Define roles and responsibilities'],
          timeline: '2-3 weeks for team formation and onboarding'
        }
      };
    } catch (error) {
      console.error('Team formation flow error:', error);
      throw new Error('Failed to generate optimal team');
    }
  }
);

// AI-powered icebreaker generation
const IcebreakerInputSchema = z.object({
  user1Profile: EnhancedUserProfileSchema,
  user2Profile: EnhancedUserProfileSchema,
  context: z.object({
    matchType: z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'networking']),
    commonInterests: z.array(z.string()).optional(),
    sharedConnections: z.array(z.string()).optional(),
    eventContext: z.string().optional()
  })
});

const IcebreakerOutputSchema = z.object({
  icebreakers: z.array(z.object({
    message: z.string(),
    tone: z.enum(['professional', 'friendly', 'casual', 'enthusiastic']),
    category: z.enum(['shared-interest', 'professional', 'project-based', 'event-context', 'skill-appreciation']),
    followUpSuggestions: z.array(z.string()).max(2)
  })).max(5),
  conversationStarters: z.array(z.string()).max(3).describe('General conversation topics'),
  meetingFormat: z.object({
    suggestedFormat: z.enum(['coffee-chat', 'video-call', 'collaborative-session', 'event-meetup']),
    duration: z.string(),
    agenda: z.array(z.string())
  })
});

export type IcebreakerInput = z.infer<typeof IcebreakerInputSchema>;
export type IcebreakerOutput = z.infer<typeof IcebreakerOutputSchema>;

export async function generatePersonalizedIcebreakers(input: IcebreakerInput): Promise<IcebreakerOutput> {
  return icebreakerFlow(input);
}

const icebreakerPrompt = ai.definePrompt({
  name: 'icebreakerPrompt',
  input: { schema: IcebreakerInputSchema },
  output: { schema: IcebreakerOutputSchema },
  prompt: `You are a networking expert specializing in creating meaningful professional connections through personalized conversation starters.
  
  USER 1 PROFILE:
  {{{user1Profile}}}
  
  USER 2 PROFILE:
  {{{user2Profile}}}
  
  CONTEXT:
  {{{context}}}
  
  Generate personalized icebreakers that:
  1. Reference specific shared interests or complementary skills
  2. Are appropriate for the professional context
  3. Encourage meaningful conversation beyond small talk
  4. Match the intended relationship type (mentor, teammate, etc.)
  5. Consider the event or platform context if applicable
  
  Include various tones (professional to friendly) and categories (shared interests, skills, etc.).
  Suggest follow-up conversation topics and optimal meeting format for building the relationship.
  
  Make each icebreaker authentic, specific, and likely to generate engaging responses.`,
});

const icebreakerFlow = ai.defineFlow(
  {
    name: 'icebreakerFlow',
    inputSchema: IcebreakerInputSchema,
    outputSchema: IcebreakerOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await icebreakerPrompt(input);
      return output || {
        icebreakers: [
          {
            message: `Hi! I noticed we both have experience in similar areas. Would love to connect and share insights!`,
            tone: 'professional' as const,
            category: 'professional' as const,
            followUpSuggestions: ['Discuss industry trends', 'Share project experiences']
          }
        ],
        conversationStarters: ['Professional background', 'Current projects', 'Industry insights'],
        meetingFormat: {
          suggestedFormat: 'coffee-chat' as const,
          duration: '30 minutes',
          agenda: ['Introductions', 'Background sharing', 'Collaboration discussion']
        }
      };
    } catch (error) {
      console.error('Icebreaker flow error:', error);
      throw new Error('Failed to generate icebreakers');
    }
  }
);

export const aiMatchmakingFunctions = {
  generateSmartMatches,
  generateOptimalTeam,
  generatePersonalizedIcebreakers
};