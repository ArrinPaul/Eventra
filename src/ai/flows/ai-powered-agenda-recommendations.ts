'use server';
/**
 * @fileOverview AI-powered agenda recommendations based on user role, interests, and existing schedule.
 *
 * - recommendSessions - A function that recommends sessions.
 * - RecommendSessionsInput - The input type for the recommendSessions function.
 * - RecommendSessionsOutput - The return type for the recommendSessions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SessionSchema = z.object({
    id: z.string().describe('The unique ID of the session.'),
    title: z.string().describe('The title of the session.'),
});

const RecommendSessionsInputSchema = z.object({
  role: z
    .enum(['student', 'professional', 'organizer'])
    .describe('The role of the user.'),
  interests: z
    .string()
    .describe('A comma-separated list of the user\'s interests.'),
  agenda: z.string().describe('The full agenda of the event, including session IDs, titles, speakers, tracks, and times.'),
  myEvents: z.array(z.string()).describe('A list of session IDs the user has already added to their schedule.')
});
export type RecommendSessionsInput = z.infer<typeof RecommendSessionsInputSchema>;

const RecommendSessionsOutputSchema = z.object({
  recommendations: z.array(SessionSchema).describe('A ranked list of recommended session objects, ordered by relevance.'),
});
export type RecommendSessionsOutput = z.infer<typeof RecommendSessionsOutputSchema>;

export async function recommendSessions(input: RecommendSessionsInput): Promise<RecommendSessionsOutput> {
  return recommendSessionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSessionsPrompt',
  input: {schema: RecommendSessionsInputSchema},
  output: {schema: RecommendSessionsOutputSchema},
  prompt: `You are an AI assistant that recommends sessions from an event agenda based on the user's profile and existing schedule.

  The user's role is: {{{role}}}
  The user's interests are: {{{interests}}}
  
  The full event agenda is: 
  {{{agenda}}}

  The user is already registered for sessions with these IDs: {{#if myEvents}}{{#each myEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}.
  
  Your task is to:
  1. Analyze the user's role and interests.
  2. Review the full agenda, which includes session times.
  3. Identify which sessions the user has already added to their schedule from the provided IDs.
  4. Recommend a ranked list of 3 sessions that are most relevant to the user and DO NOT have a time conflict with sessions they've already added.
  5. Return the recommendations as a structured list of session objects, with the most relevant session first. Do not include sessions the user has already added.
  6. If no sessions can be recommended, return an empty list.
  `,
});

const recommendSessionsFlow = ai.defineFlow(
  {
    name: 'recommendSessionsFlow',
    inputSchema: RecommendSessionsInputSchema,
    outputSchema: RecommendSessionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || { recommendations: [] };
  }
);
