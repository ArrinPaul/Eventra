'use server';
/**
 * @fileOverview A bot that generates fun announcements for the event chat.
 *
 * - generateAnnouncement - A function that creates an engaging message about a session.
 * - GenerateAnnouncementOutput - The return type for the generateAnnouncement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SessionSchema = z.object({
  title: z.string(),
  speaker: z.string(),
  description: z.string(),
  time: z.string().optional(),
  location: z.string().optional(),
});

const GenerateAnnouncementInputSchema = z.object({
  session: SessionSchema,
});

const GenerateAnnouncementOutputSchema = z.object({
  announcement: z.string().describe('A fun, engaging, and brief announcement about the session, formatted as a chat message. Include an emoji.'),
});

export type GenerateAnnouncementInput = z.infer<typeof GenerateAnnouncementInputSchema>;
export type GenerateAnnouncementOutput = z.infer<typeof GenerateAnnouncementOutputSchema>;

export async function generateAnnouncement(input: GenerateAnnouncementInput): Promise<GenerateAnnouncementOutput> {
  return announcerBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'announcerBotPrompt',
  input: {schema: GenerateAnnouncementInputSchema},
  output: {schema: GenerateAnnouncementOutputSchema},
  prompt: `You are an energetic and fun announcer bot for the EventOS platform. 
  Your job is to generate an exciting, single-sentence announcement about an upcoming session to keep attendees engaged in the chat.
  
  Create a message about the session below. Make it sound like a fun fact or a can't-miss opportunity. Use emojis!

  SESSION DETAILS:
  - Title: {{{session.title}}}
  - Speaker: {{{session.speaker}}}
  - Description: {{{session.description}}}
  - Time: {{{session.time}}}
  - Location: {{{session.location}}}
  `,
});

const announcerBotFlow = ai.defineFlow(
  {
    name: 'announcerBotFlow',
    inputSchema: GenerateAnnouncementInputSchema,
    outputSchema: GenerateAnnouncementOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      return output || { announcement: `Don't miss "${input.session.title}" starting soon!` };
    } catch (error) {
      console.error('Announcer bot flow error:', error);
      return { announcement: `Heads up! "${input.session.title}" is happening soon. See you there!` };
    }
  }
);
