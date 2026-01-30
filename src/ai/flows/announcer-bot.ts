'use server';
/**
 * @fileOverview A bot that generates fun announcements for the event chat.
 *
 * - generateAnnouncement - A function that creates an engaging message about a session.
 * - GenerateAnnouncementOutput - The return type for the generateAnnouncement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SESSIONS } from '@/core/data/data';

const GenerateAnnouncementOutputSchema = z.object({
  announcement: z.string().describe('A fun, engaging, and brief announcement about the session, formatted as a chat message. Include an emoji.'),
});
export type GenerateAnnouncementOutput = z.infer<typeof GenerateAnnouncementOutputSchema>;

export async function generateAnnouncement(): Promise<GenerateAnnouncementOutput> {
  return announcerBotFlow();
}

const prompt = ai.definePrompt({
  name: 'announcerBotPrompt',
  output: {schema: GenerateAnnouncementOutputSchema},
  prompt: `You are an energetic and fun announcer bot for the EventOS platform. 
  Your job is to generate an exciting, single-sentence announcement about an upcoming session to keep attendees engaged in the chat.
  
  Pick one of the following sessions and create a message about it. Make it sound like a fun fact or a can't-miss opportunity. Use emojis!

  Here is the session to announce:
  - {{{title}}} by {{{speaker}}}: {{{description}}}
  `,
});

const announcerBotFlow = ai.defineFlow(
  {
    name: 'announcerBotFlow',
    outputSchema: GenerateAnnouncementOutputSchema,
  },
  async () => {
    // Announce the first session for deterministic behavior in this example
    const sessionToAnnounce = SESSIONS[0];
    
    const {output} = await prompt({
        ...sessionToAnnounce
    });

    return output || { announcement: "Don't forget to check out all the amazing sessions!" };
  }
);
