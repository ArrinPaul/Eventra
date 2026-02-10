import { defineFlow } from '@genkit-ai/next';
import { googleai } from '@genkit-ai/googleai';
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';

export const socialMediaPostFlow = defineFlow(
  {
    name: 'socialMediaPostFlow',
    inputSchema: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      startDate: z.number(),
      location: z.string().optional(),
    }),
    outputSchema: z.object({
      posts: z.array(z.object({
        platform: z.enum(['X (Twitter)', 'LinkedIn', 'Instagram']),
        content: z.string(),
        hashtags: z.array(z.string()),
      })),
    }),
  },
  async (input) => {
    const dateStr = new Date(input.startDate).toLocaleDateString();
    const prompt = `
      Generate engaging social media posts to promote this event:
      Title: ${input.title}
      Category: ${input.category}
      Description: ${input.description}
      Date: ${dateStr}
      Location: ${input.location || 'Announced soon'}
      
      Create 3 variations:
      1. X (Twitter): Short, punchy, with emojis.
      2. LinkedIn: Professional, highlighting the value/networking opportunity.
      3. Instagram: Exciting, visual-focused description.
      
      Include relevant hashtags for each.
    `;

    const { output } = await generate({
      model: googleai('gemini-1.5-flash'),
      prompt,
      output: {
        schema: z.object({
          posts: z.array(z.object({
            platform: z.enum(['X (Twitter)', 'LinkedIn', 'Instagram']),
            content: z.string(),
            hashtags: z.array(z.string()),
          })),
        }),
      },
    });

    if (!output) throw new Error('Failed to generate social media posts');
    return output;
  }
);
