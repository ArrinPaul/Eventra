import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const eventSummarizerFlow = ai.defineFlow(
  {
    name: 'eventSummarizerFlow',
    inputSchema: z.object({
      eventTitle: z.string(),
      description: z.string(),
      category: z.string(),
      attendeeCount: z.number(),
      feedback: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      summary: z.string(),
      highlights: z.array(z.string()),
      keyTakeaways: z.array(z.string()),
    }),
  },
  async (input) => {
    const prompt = `
      Generate a professional post-event summary for the following event:
      Title: ${input.eventTitle}
      Category: ${input.category}
      Description: ${input.description}
      Attendees: ${input.attendeeCount}
      
      Feedback from attendees:
      ${input.feedback?.join('\n') || 'No specific feedback provided.'}
      
      The summary should be engaging, informative, and suitable for sharing with stakeholders or on social media.
      Include a general summary paragraph, 3-5 key highlights, and 3 key takeaways.
    `;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          summary: z.string(),
          highlights: z.array(z.string()),
          keyTakeaways: z.array(z.string()),
        }),
      },
    });

    if (!output) throw new Error('Failed to generate summary');
    return output;
  }
);
