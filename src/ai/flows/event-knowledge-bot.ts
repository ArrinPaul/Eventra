'use server';
/**
 * @fileOverview A RAG-based chatbot that answers questions about the event.
 *
 * - answerQuestion - A function that answers a user's question based on event data.
 * - AnswerQuestionInput - The input type for the answerQuestion function.
 * - AnswerQuestionOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about the event.'),
  agenda: z.string().describe('The full agenda of the event, including session titles, speakers, tracks, and times.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('A helpful and concise answer to the user\'s question.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return eventKnowledgeBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eventKnowledgeBotPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a friendly and helpful AI assistant for the IPX Hub event. Your job is to answer attendee questions clearly and concisely.
  
  Use ONLY the following event agenda as your source of truth. Do not make up information. If you don't know the answer based on the provided agenda, say so.

  Event Agenda:
  {{{agenda}}}

  User's Question:
  "{{{question}}}"
  `,
});

const eventKnowledgeBotFlow = ai.defineFlow(
  {
    name: 'eventKnowledgeBotFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || { answer: "I'm sorry, I'm having trouble finding that information right now." };
  }
);
