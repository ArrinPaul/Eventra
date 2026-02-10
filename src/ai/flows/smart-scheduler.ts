import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const smartSchedulerFlow = ai.defineFlow(
  {
    name: 'smartSchedulerFlow',
    inputSchema: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      targetAudience: z.string().optional(),
      preferredDuration: z.number().optional(), // in minutes
    }),
    outputSchema: z.object({
      recommendations: z.array(z.object({
        dayOfWeek: z.string(),
        timeSlot: z.string(),
        reasoning: z.string(),
        score: z.number(), // 0-100
      })),
      strategy: z.string(),
    }),
  },
  async (input) => {
    const prompt = `
      As an expert event planner, suggest the top 3 optimal days and times for the following event:
      Title: ${input.title}
      Category: ${input.category}
      Description: ${input.description}
      Target Audience: ${input.targetAudience || 'General public'}
      Duration: ${input.preferredDuration || 60} minutes
      
      Consider factors like:
      - Work-life balance for professionals (avoid Monday mornings or Friday evenings for workshops).
      - Peak energy times for students.
      - Likely availability based on the category (e.g., networking is better in the evening).
      
      Provide a "strategy" summarizing the logic used for these picks.
    `;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          recommendations: z.array(z.object({
            dayOfWeek: z.string(),
            timeSlot: z.string(),
            reasoning: z.string(),
            score: z.number(),
          })),
          strategy: z.string(),
        }),
      },
    });

    if (!output) throw new Error('Failed to generate scheduling recommendations');
    return output;
  }
);
