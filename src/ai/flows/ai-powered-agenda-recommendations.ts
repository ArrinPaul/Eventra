'use server';
/**
 * @fileOverview AI-powered agenda recommendations based on user role and interests.
 *
 * - recommendSessions - A function that recommends sessions.
 * - RecommendSessionsInput - The input type for the recommendSessions function.
 * - RecommendSessionsOutput - The return type for the recommendSessions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSessionsInputSchema = z.object({
  role: z
    .enum(['student', 'professional', 'organizer'])
    .describe('The role of the user.'),
  interests: z
    .string()
    .describe('A comma-separated list of the user\'s interests.'),
  agenda: z.string().describe('The agenda of the event.'),
});
export type RecommendSessionsInput = z.infer<typeof RecommendSessionsInputSchema>;

const RecommendSessionsOutputSchema = z.object({
  recommendedSessions: z
    .string()
    .describe('A list of recommended sessions based on the user\'s role and interests.'),
});
export type RecommendSessionsOutput = z.infer<typeof RecommendSessionsOutputSchema>;

export async function recommendSessions(input: RecommendSessionsInput): Promise<RecommendSessionsOutput> {
  return recommendSessionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSessionsPrompt',
  input: {schema: RecommendSessionsInputSchema},
  output: {schema: RecommendSessionsOutputSchema},
  prompt: `You are an AI assistant that recommends sessions from an event agenda based on the user's role and interests.

  The user's role is: {{{role}}}
  The user's interests are: {{{interests}}}
  The event agenda is: {{{agenda}}}

  Recommend sessions that are most relevant to the user's role and interests. Provide a list of session titles, each separated by a comma.
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
    return output!;
  }
);
