import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const contentModeratorFlow = ai.defineFlow(
  {
    name: 'contentModeratorFlow',
    inputSchema: z.object({
      content: z.string(),
      authorName: z.string().optional(),
    }),
    outputSchema: z.object({
      isFlagged: z.boolean(),
      reason: z.string().optional(),
      suggestedAction: z.enum(['none', 'warn', 'delete', 'suspend']).default('none'),
      confidence: z.number(), // 0-1
    }),
  },
  async (input) => {
    const prompt = `
      As a content moderator for Eventra, a professional and university-focused event platform, analyze the following post:
      
      Author: ${input.authorName || 'Anonymous'}
      Content: "${input.content}"
      
      Identify if this content violates our community guidelines (no hate speech, no harassment, no spam, no illegal content, no explicit NSFW material).
      
      Provide your analysis in JSON format.
    `;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          isFlagged: z.boolean(),
          reason: z.string().optional(),
          suggestedAction: z.enum(['none', 'warn', 'delete', 'suspend']),
          confidence: z.number(),
        }),
      },
    });

    if (!output) throw new Error('Moderation analysis failed');
    return output;
  }
);
