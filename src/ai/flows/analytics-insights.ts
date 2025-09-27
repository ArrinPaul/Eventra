'use server';
/**
 * @fileOverview AI-powered analytics to generate insights from event data.
 *
 * - generateAnalyticsInsights - A function that analyzes session popularity.
 * - GenerateAnalyticsInsightsInput - The input type for the function.
 * - GenerateAnalyticsInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateAnalyticsInsightsInputSchema = z.object({
  sessionPopularity: z.string().describe('A comma-separated list of sessions and the number of attendees who have added them. Example: "Session Title 1: 50 attendees, Session Title 2: 35 attendees"'),
});
export type GenerateAnalyticsInsightsInput = z.infer<typeof GenerateAnalyticsInsightsInputSchema>;

export const GenerateAnalyticsInsightsOutputSchema = z.object({
  insights: z.string().describe('A brief, two-sentence summary of attendee engagement and session preferences based on the data. Highlight the most popular session or track.'),
});
export type GenerateAnalyticsInsightsOutput = z.infer<typeof GenerateAnalyticsInsightsOutputSchema>;

export async function generateAnalyticsInsights(input: GenerateAnalyticsInsightsInput): Promise<GenerateAnalyticsInsightsOutput> {
  return analyticsInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyticsInsightsPrompt',
  input: {schema: GenerateAnalyticsInsightsInputSchema},
  output: {schema: GenerateAnalyticsInsightsOutputSchema},
  prompt: `You are an event analyst AI. Your task is to provide a quick insight into attendee engagement based on which sessions they are adding to their schedules.

Analyze the following session popularity data:
{{{sessionPopularity}}}

Generate a concise, two-sentence summary highlighting the most popular session or a trending track (e.g., 'Tech', 'Design'). Be encouraging and brief.
Example: "Engagement is high, with the 'AI in Practice' session leading the pack! It looks like our attendees are really excited about the tech track this year."
`,
});

const analyticsInsightsFlow = ai.defineFlow(
  {
    name: 'analyticsInsightsFlow',
    inputSchema: GenerateAnalyticsInsightsInputSchema,
    outputSchema: GenerateAnalyticsInsightsOutputSchema,
  },
  async (input) => {
    // If there's no data, return a default message
    if (!input.sessionPopularity || input.sessionPopularity.trim() === '') {
        return { insights: "Attendees are starting to build their schedules. More insights will appear as more sessions are added." };
    }
    
    const {output} = await prompt(input);
    return output || { insights: "There was an issue generating insights at this time." };
  }
);
