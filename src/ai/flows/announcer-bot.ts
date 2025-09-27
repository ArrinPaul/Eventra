'use server';
/**
 * @fileOverview A bot that generates fun announcements for the event chat.
 *
 * - generateAnnouncement - A function that creates an engaging message about a session.
 * - GenerateAnnouncementOutput - The return type for the generateAnnouncement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SESSIONS } from '@/lib/data';

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
  prompt: `You are an energetic and fun announcer bot for the IPX Hub event. 
  Your job is to generate an exciting, single-sentence announcement about an upcoming session to keep attendees engaged in the chat.
  
  Pick one of the following sessions and create a message about it. Make it sound like a fun fact or a can't-miss opportunity. Use emojis!

  Here are the available sessions:
  {{#each sessions}}
  - {{{this.title}}} by {{{this.speaker}}}: {{{this.description}}}
  {{/each}}
  `,
});

const announcerBotFlow = ai.defineFlow(
  {
    name: 'announcerBotFlow',
    outputSchema: GenerateAnnouncementOutputSchema,
  },
  async () => {
    // Pick a random session to announce
    const randomSession = SESSIONS[Math.floor(Math.random() * SESSIONS.length)];
    
    const {output} = await prompt({
        sessions: [randomSession] // Pass only the selected session to the prompt
    });

    return output || { announcement: "Don't forget to check out all the amazing sessions!" };
  }
);
