'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant'), z.literal('system')]),
  content: z.string(),
});

const AIChatbotInputSchema = z.object({
  message: z.string(),
  history: z.array(MessageSchema).optional(),
  context: z.object({
    userRole: z.string().optional(),
    eventTitle: z.string().optional(),
    eventDetails: z.string().optional(),
    currentPage: z.string().optional(),
  }).optional(),
});

export type AIChatbotInput = z.infer<typeof AIChatbotInputSchema>;

const AIChatbotOutputSchema = z.object({
  message: z.string(),
  actions: z.array(z.object({
    label: z.string(),
    action: z.string(),
    data: z.any().optional(),
  })).optional(),
});

export type AIChatbotOutput = z.infer<typeof AIChatbotOutputSchema>;

const chatbotPrompt = ai.definePrompt({
  name: 'aiChatbotPrompt',
  input: { schema: AIChatbotInputSchema },
  output: { schema: AIChatbotOutputSchema },
  prompt: `You are Eventra AI, a sophisticated event management assistant. 
  Your goal is to help users (attendees, organizers, speakers) with anything related to the Eventra platform and specific events.

  Context:
  - User Role: {{context.userRole}}
  - Current Page: {{context.currentPage}}
  {{#if context.eventTitle}}
  - Current Event: {{context.eventTitle}}
  - Event Details: {{context.eventDetails}}
  {{/if}}

  Guidelines:
  1. Be professional, friendly, and helpful.
  2. Use the provided event details as your primary source of truth for event-specific questions.
  3. MAINTAIN CONTEXT: Reference previous parts of the conversation if relevant. If the user asks a follow-up question, use the history to understand the subject.
  4. If you don't know something, be honest and suggest where the user might find the answer.
  5. Provide "actions" when appropriate (e.g., suggesting to view the agenda, register for an event, or connect with someone).
  6. Keep responses concise but comprehensive.

  Conversation History:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}

  Current User Message: {{message}}
  `,
});

export const aiChatbotFlow = ai.defineFlow(
  {
    name: 'aiChatbotFlow',
    inputSchema: AIChatbotInputSchema,
    outputSchema: AIChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await chatbotPrompt(input);
    return output || { message: "I'm sorry, I'm having trouble processing that right now." };
  }
);
