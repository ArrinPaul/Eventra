import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FeedbackAnalysisInputSchema = z.object({
  eventTitle: z.string(),
  reviews: z.array(z.object({
    rating: z.number(),
    comment: z.string().optional(),
  })),
});

const FeedbackAnalysisOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of the overall attendee sentiment.'),
  strengths: z.array(z.string()).describe('Top 3 things attendees loved.'),
  improvements: z.array(z.string()).describe('Top 3 areas for improvement.'),
  sentimentScore: z.number().describe('Overall sentiment score from 0-100.'),
});

export const analyzeFeedback = ai.defineFlow(
  {
    name: 'analyzeFeedback',
    inputSchema: FeedbackAnalysisInputSchema,
    outputSchema: FeedbackAnalysisOutputSchema,
  },
  async (input) => {
    const prompt = `You are an event sentiment analyst. Analyze the following reviews for the event "${input.eventTitle}":
    
    Reviews: ${JSON.stringify(input.reviews)}
    
    Provide a comprehensive analysis including a summary, key strengths, areas for improvement, and a sentiment score.`;

    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: FeedbackAnalysisOutputSchema }
    });

    return output || { 
      summary: "No reviews to analyze yet.", 
      strengths: [], 
      improvements: [], 
      sentimentScore: 0 
    };
  }
);