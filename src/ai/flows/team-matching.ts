'use server';
/**
 * @fileOverview AI-powered team formation and compatibility matching
 *
 * - findTeammates - Finds compatible team members based on skills and goals
 * - generateCompatibilityScore - Calculates compatibility between users
 * - suggestIcebreakers - Generates conversation starters for matches
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  personalityType: z.string().optional(),
  workStyle: z.string().optional(),
  experience: z.string().optional(),
  lookingFor: z.array(z.string())
});

const FindTeammatesInputSchema = z.object({
  userProfile: UserProfileSchema,
  candidateProfiles: z.array(UserProfileSchema),
  projectType: z.string().optional(),
  teamSize: z.number().optional()
});

const TeammateRecommendationSchema = z.object({
  userId: z.string(),
  compatibilityScore: z.number().describe('Compatibility score from 0-100'),
  matchType: z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'collaborator']),
  reasonForMatch: z.string().describe('Explanation of why this is a good match'),
  commonInterests: z.array(z.string()),
  complementarySkills: z.array(z.string()),
  icebreakers: z.array(z.string()).describe('3 conversation starters')
});

const FindTeammatesOutputSchema = z.object({
  recommendations: z.array(TeammateRecommendationSchema).describe('Top 5 teammate recommendations ranked by compatibility')
});

export type FindTeammatesInput = z.infer<typeof FindTeammatesInputSchema>;
export type FindTeammatesOutput = z.infer<typeof FindTeammatesOutputSchema>;

export async function findTeammates(input: FindTeammatesInput): Promise<FindTeammatesOutput> {
  return findTeammatesFlow(input);
}

const findTeammatesPrompt = ai.definePrompt({
  name: 'findTeammatesPrompt',
  input: { schema: FindTeammatesInputSchema },
  output: { schema: FindTeammatesOutputSchema },
  prompt: `You are an AI matchmaking expert that helps professionals find compatible teammates, mentors, and collaborators.

User Profile:
Name: {{{userProfile.name}}}
Skills: {{{userProfile.skills}}}
Interests: {{{userProfile.interests}}}
Goals: {{{userProfile.goals}}}
Personality: {{{userProfile.personalityType}}}
Work Style: {{{userProfile.workStyle}}}
Looking For: {{{userProfile.lookingFor}}}

Candidate Profiles:
{{#each candidateProfiles}}
- ID: {{{id}}}
  Name: {{{name}}}
  Skills: {{{skills}}}
  Interests: {{{interests}}}
  Goals: {{{goals}}}
  Personality: {{{personalityType}}}
  Work Style: {{{workStyle}}}
  Looking For: {{{lookingFor}}}
{{/each}}

Project Type: {{{projectType}}}
Desired Team Size: {{{teamSize}}}

Analyze each candidate and provide:
1. Compatibility score (0-100) based on:
   - Complementary skills (40%)
   - Shared interests and goals (30%)
   - Compatible work styles and personality (20%)
   - Mutual interest in collaboration type (10%)

2. Match type based on experience levels and what they're looking for
3. Clear reasoning for the match
4. Common interests they can bond over
5. Skills that complement each other well
6. 3 personalized icebreaker conversation starters

Return the top 5 matches ranked by compatibility score.`,
});

const findTeammatesFlow = ai.defineFlow(
  {
    name: 'findTeammatesFlow',
    inputSchema: FindTeammatesInputSchema,
    outputSchema: FindTeammatesOutputSchema,
  },
  async (input) => {
    const { output } = await findTeammatesPrompt(input);
    return output || { recommendations: [] };
  }
);

// Compatibility Score Calculation
const CompatibilityInputSchema = z.object({
  user1: UserProfileSchema,
  user2: UserProfileSchema,
  context: z.string().optional()
});

const CompatibilityOutputSchema = z.object({
  score: z.number().describe('Compatibility score from 0-100'),
  breakdown: z.object({
    skillsMatch: z.number().describe('How well skills complement each other'),
    interestsMatch: z.number().describe('Shared interests and goals alignment'),
    personalityMatch: z.number().describe('Personality and work style compatibility'),
    mutualInterest: z.number().describe('Both parties looking for similar collaboration')
  }),
  strengths: z.array(z.string()).describe('Key compatibility strengths'),
  challenges: z.array(z.string()).describe('Potential compatibility challenges')
});

export type CompatibilityInput = z.infer<typeof CompatibilityInputSchema>;
export type CompatibilityOutput = z.infer<typeof CompatibilityOutputSchema>;

export async function generateCompatibilityScore(input: CompatibilityInput): Promise<CompatibilityOutput> {
  return compatibilityFlow(input);
}

const compatibilityPrompt = ai.definePrompt({
  name: 'compatibilityPrompt',
  input: { schema: CompatibilityInputSchema },
  output: { schema: CompatibilityOutputSchema },
  prompt: `Analyze the compatibility between these two professionals:

User 1:
- Skills: {{{user1.skills}}}
- Interests: {{{user1.interests}}}
- Goals: {{{user1.goals}}}
- Personality: {{{user1.personalityType}}}
- Work Style: {{{user1.workStyle}}}
- Looking For: {{{user1.lookingFor}}}

User 2:
- Skills: {{{user2.skills}}}
- Interests: {{{user2.interests}}}
- Goals: {{{user2.goals}}}
- Personality: {{{user2.personalityType}}}
- Work Style: {{{user2.workStyle}}}
- Looking For: {{{user2.lookingFor}}}

Context: {{{context}}}

Provide a detailed compatibility analysis with:
1. Overall compatibility score (0-100)
2. Breakdown by category (each 0-100):
   - Skills complementarity
   - Shared interests/goals
   - Personality/work style fit
   - Mutual collaboration interest
3. Key strengths of this pairing
4. Potential challenges to watch for`,
});

const compatibilityFlow = ai.defineFlow(
  {
    name: 'compatibilityFlow',
    inputSchema: CompatibilityInputSchema,
    outputSchema: CompatibilityOutputSchema,
  },
  async (input) => {
    const { output } = await compatibilityPrompt(input);
    return output || {
      score: 0,
      breakdown: { skillsMatch: 0, interestsMatch: 0, personalityMatch: 0, mutualInterest: 0 },
      strengths: [],
      challenges: []
    };
  }
);

// Icebreaker Generation
const IcebreakerInputSchema = z.object({
  user1Name: z.string(),
  user2Name: z.string(),
  commonInterests: z.array(z.string()),
  user1Skills: z.array(z.string()),
  user2Skills: z.array(z.string()),
  matchType: z.enum(['teammate', 'mentor', 'mentee', 'cofounder', 'collaborator']),
  context: z.string().optional()
});

const IcebreakerOutputSchema = z.object({
  icebreakers: z.array(z.string()).describe('5 personalized conversation starters')
});

export type IcebreakerInput = z.infer<typeof IcebreakerInputSchema>;
export type IcebreakerOutput = z.infer<typeof IcebreakerOutputSchema>;

export async function generateIcebreakers(input: IcebreakerInput): Promise<IcebreakerOutput> {
  return icebreakerFlow(input);
}

const icebreakerPrompt = ai.definePrompt({
  name: 'icebreakerPrompt',
  input: { schema: IcebreakerInputSchema },
  output: { schema: IcebreakerOutputSchema },
  prompt: `Generate personalized conversation starters for two professionals who matched:

{{{user1Name}}} and {{{user2Name}}}

Common Interests: {{{commonInterests}}}
{{{user1Name}}}'s Skills: {{{user1Skills}}}
{{{user2Name}}}'s Skills: {{{user2Skills}}}
Match Type: {{{matchType}}}
Context: {{{context}}}

Create 5 natural, engaging conversation starters that:
1. Reference their shared interests or complementary skills
2. Are appropriate for the match type (teammate/mentor/cofounder etc.)
3. Encourage meaningful professional discussion
4. Are specific to their backgrounds, not generic
5. Open up opportunities for collaboration

Make them feel personal and relevant to both parties.`,
});

const icebreakerFlow = ai.defineFlow(
  {
    name: 'icebreakerFlow',
    inputSchema: IcebreakerInputSchema,
    outputSchema: IcebreakerOutputSchema,
  },
  async (input) => {
    const { output } = await icebreakerPrompt(input);
    return output || { icebreakers: [] };
  }
);