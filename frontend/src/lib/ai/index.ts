import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { dotprompt } from '@genkit-ai/dotprompt';
import { z } from 'zod';

export const ai = genkit({
  plugins: [
    googleAI(),
    dotprompt(),
  ],
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Flow for the Event Chatbot
 */
export const aiChatbotFlow = ai.defineFlow(
  {
    name: 'aiChatbotFlow',
    inputSchema: z.object({
      question: z.string(),
      eventContext: z.string(),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({ text: z.string() })),
      })).optional(),
    }),
    outputSchema: z.object({
      answer: z.string(),
    }),
  },
  async (input) => {
    const prompt = `
      You are a helpful event assistant for an event platform called Eventra.
      Use the following context about the event to answer the user's question.
      If the information is not in the context, be polite and say you don't have that specific detail yet.
      
      CONTEXT:
      ${input.eventContext}
      
      USER QUESTION:
      ${input.question}
    `;

    const result = await ai.generate({
      prompt,
      history: input.history,
    });

    return { answer: result.text };
  }
);

/**
 * Flow for Event Summarization
 */
export const eventSummarizerFlow = ai.defineFlow(
  {
    name: 'eventSummarizerFlow',
    inputSchema: z.object({
      eventTitle: z.string(),
      eventDescription: z.string(),
      attendeeCount: z.number(),
      feedback: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      summary: z.string(),
    }),
  },
  async (input) => {
    const prompt = `
      Generate a professional and engaging post-event summary for the event "${input.eventTitle}".
      
      Details:
      - Description: ${input.eventDescription}
      - Total Attendees: ${input.attendeeCount}
      
      ${input.feedback && input.feedback.length > 0 ? `Attendee Feedback: \n- ${input.feedback.join('\n- ')}` : ''}
      
      The summary should include:
      1. A high-level overview of the event's success.
      2. Key highlights and takeaways.
      3. A thank you note to attendees.
    `;

    const result = await ai.generate(prompt);
    return { summary: result.text };
  }
);

/**
 * Flow for Personalized Recommendations
 */
export const recommendationFlow = ai.defineFlow(
  {
    name: 'recommendationFlow',
    inputSchema: z.object({
      userInterests: z.array(z.string()),
      userRole: z.string(),
      availableEvents: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
      })),
    }),
    outputSchema: z.object({
      recommendations: z.array(z.object({
        eventId: z.string(),
        relevanceScore: z.number(),
        reason: z.string(),
      })),
    }),
  },
  async (input) => {
    const prompt = `
      You are an expert event matcher. Given a user's interests and a list of available events, select the top 3 most relevant events.
      
      User Interests: ${input.userInterests.join(', ')}
      User Role: ${input.userRole}
      
      Available Events:
      ${JSON.stringify(input.availableEvents)}
      
      Return your response as a JSON array of objects with eventId, relevanceScore (0-100), and reason.
    `;

    const result = await ai.generate({
      prompt,
      output: { format: 'json' },
    });

    const parsed = result.output as any;
    return { recommendations: Array.isArray(parsed) ? parsed : (parsed.recommendations || []) };
  }
);
