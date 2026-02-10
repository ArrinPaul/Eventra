import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const predictiveAttendanceFlow = ai.defineFlow(
  {
    name: 'predictiveAttendanceFlow',
    inputSchema: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      capacity: z.number(),
      registeredCount: z.number(),
      daysUntilEvent: z.number(),
      isPaid: z.boolean().optional(),
      historicalAvgShowRate: z.number().optional(), // 0-1
    }),
    outputSchema: z.object({
      predictedShowRate: z.number(), // 0-1
      predictedAttendance: z.number(),
      confidence: z.enum(['low', 'medium', 'high']),
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
  },
  async (input) => {
    const prompt = `
      Predict the likely attendance for the following event:
      Title: ${input.title}
      Category: ${input.category}
      Description: ${input.description}
      Capacity: ${input.capacity}
      Registered: ${input.registeredCount}
      Days Until Event: ${input.daysUntilEvent}
      Is Paid: ${input.isPaid ? 'Yes' : 'No'}
      
      Historically, similar events have a show rate of ${input.historicalAvgShowRate || 0.7}.
      
      Calculate:
      1. Predicted show rate (percentage of registered users likely to attend).
      2. Predicted total attendance.
      
      Provide 3 insights into why you predicted this and 2 recommendations to improve attendance.
    `;

    const { output } = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          predictedShowRate: z.number(),
          predictedAttendance: z.number(),
          confidence: z.enum(['low', 'medium', 'high']),
          insights: z.array(z.string()),
          recommendations: z.array(z.string()),
        }),
      },
    });

    if (!output) throw new Error('Attendance prediction failed');
    return output;
  }
);
