'use server';
/**
 * @fileOverview AI-powered event assistant and general chatbot
 *
 * - handleEventQuery - Handles questions about events, schedules, speakers
 * - generateEventRecommendations - Suggests events based on user interests
 * - provideFeedbackAnalysis - Analyzes and summarizes event feedback
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EventQueryInputSchema = z.object({
  userQuestion: z.string().describe('The user\'s question about events'),
  userProfile: z.object({
    name: z.string(),
    role: z.string(),
    interests: z.string(),
    registeredEvents: z.array(z.string())
  }).optional(),
  eventData: z.object({
    currentEvents: z.array(z.object({
      id: z.string(),
      title: z.string(),
      speaker: z.string(),
      time: z.string(),
      track: z.string(),
      description: z.string().optional()
    })),
    venue: z.object({
      name: z.string(),
      address: z.string(),
      wifi: z.string().optional(),
      facilities: z.array(z.string()).optional()
    }).optional(),
    schedule: z.array(z.object({
      time: z.string(),
      activity: z.string(),
      location: z.string()
    })).optional()
  })
});

const EventQueryOutputSchema = z.object({
  response: z.string().describe('Helpful response to the user\'s query'),
  suggestions: z.array(z.string()).describe('Additional helpful suggestions').optional(),
  relevantEvents: z.array(z.string()).describe('Event IDs that might interest the user').optional()
});

export type EventQueryInput = z.infer<typeof EventQueryInputSchema>;
export type EventQueryOutput = z.infer<typeof EventQueryOutputSchema>;

export async function handleEventQuery(input: EventQueryInput): Promise<EventQueryOutput> {
  return eventAssistantFlow(input);
}

const eventAssistantPrompt = ai.definePrompt({
  name: 'eventAssistantPrompt',
  input: { schema: EventQueryInputSchema },
  output: { schema: EventQueryOutputSchema },
  prompt: `You are a helpful AI assistant for the EventOS platform. Answer user questions about events, schedules, speakers, venue, and networking opportunities.

User Question: {{{userQuestion}}}

{{#if userProfile}}
User Profile:
- Name: {{{userProfile.name}}}
- Role: {{{userProfile.role}}}
- Interests: {{{userProfile.interests}}}
- Registered Events: {{#each userProfile.registeredEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Current Events:
{{#each eventData.currentEvents}}
- {{{title}}} by {{{speaker}}} at {{{time}}} (Track: {{{track}}})
{{#if description}}  Description: {{{description}}}{{/if}}
{{/each}}

{{#if eventData.venue}}
Venue Information:
- Name: {{{eventData.venue.name}}}
- Address: {{{eventData.venue.address}}}
{{#if eventData.venue.wifi}}- WiFi: {{{eventData.venue.wifi}}}{{/if}}
{{#if eventData.venue.facilities}}- Facilities: {{#each eventData.venue.facilities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/if}}

{{#if eventData.schedule}}
Today's Schedule:
{{#each eventData.schedule}}
- {{{time}}}: {{{activity}}} at {{{location}}}
{{/each}}
{{/if}}

Provide a helpful, friendly response that:
1. Directly answers their question
2. Includes relevant details from the event data
3. Offers additional helpful suggestions when appropriate
4. Mentions specific events that might interest them based on their profile
5. Uses a conversational, approachable tone

Be concise but informative, and always aim to enhance their event experience.`,
});

const eventAssistantFlow = ai.defineFlow(
  {
    name: 'eventAssistantFlow',
    inputSchema: EventQueryInputSchema,
    outputSchema: EventQueryOutputSchema,
  },
  async (input) => {
    const { output } = await eventAssistantPrompt(input);
    return output || { response: "I'm sorry, I couldn't process your request right now. Please try again." };
  }
);

// Event Recommendations
const RecommendationInputSchema = z.object({
  userProfile: z.object({
    role: z.string(),
    interests: z.string(),
    experience: z.string().optional(),
    goals: z.array(z.string()).optional(),
    registeredEvents: z.array(z.string())
  }),
  availableEvents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    speaker: z.string(),
    track: z.string(),
    description: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional()
  })),
  timeSlot: z.string().optional()
});

const RecommendationOutputSchema = z.object({
  recommendations: z.array(z.object({
    eventId: z.string(),
    title: z.string(),
    relevanceScore: z.number().describe('Relevance score from 0-100'),
    reason: z.string().describe('Why this event is recommended'),
    learningOutcomes: z.array(z.string()).describe('What the user will learn')
  })).describe('Top 3 event recommendations'),
  alternativeOptions: z.array(z.string()).describe('Other events to consider').optional()
});

export type RecommendationInput = z.infer<typeof RecommendationInputSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;

export async function generateEventRecommendations(input: RecommendationInput): Promise<RecommendationOutput> {
  return recommendationFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: { schema: RecommendationInputSchema },
  output: { schema: RecommendationOutputSchema },
  prompt: `Recommend the best events for this user based on their profile and goals.

User Profile:
- Role: {{{userProfile.role}}}
- Interests: {{{userProfile.interests}}}
{{#if userProfile.experience}}- Experience: {{{userProfile.experience}}}{{/if}}
{{#if userProfile.goals}}- Goals: {{#each userProfile.goals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
- Already Registered: {{#each userProfile.registeredEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Available Events:
{{#each availableEvents}}
- ID: {{{id}}}
  Title: {{{title}}}
  Speaker: {{{speaker}}}
  Track: {{{track}}}
  Description: {{{description}}}
  {{#if difficulty}}Difficulty: {{{difficulty}}}{{/if}}
  {{#if tags}}Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/each}}

{{#if timeSlot}}Time Slot: {{{timeSlot}}}{{/if}}

Analyze each event and provide:
1. Top 3 most relevant events ranked by relevance score (0-100)
2. Clear reasoning for each recommendation
3. Specific learning outcomes for the user
4. Consider their experience level and career goals
5. Avoid events they're already registered for
6. Factor in track diversity for well-rounded experience

Focus on events that will advance their career, match their interests, and provide practical value.`,
});

const recommendationFlow = ai.defineFlow(
  {
    name: 'recommendationFlow',
    inputSchema: RecommendationInputSchema,
    outputSchema: RecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationPrompt(input);
    return output || { recommendations: [] };
  }
);

// Feedback Analysis
const FeedbackAnalysisInputSchema = z.object({
  feedbackData: z.array(z.object({
    eventId: z.string(),
    eventTitle: z.string(),
    rating: z.number(),
    feedback: z.string(),
    attendeeRole: z.string().optional()
  })),
  analysisType: z.enum(['summary', 'detailed', 'actionable']).optional()
});

const FeedbackAnalysisOutputSchema = z.object({
  overallSentiment: z.enum(['positive', 'neutral', 'negative']),
  averageRating: z.number(),
  keyThemes: z.array(z.object({
    theme: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    frequency: z.number(),
    examples: z.array(z.string())
  })),
  recommendations: z.array(z.string()).describe('Actionable recommendations for improvement'),
  highlights: z.array(z.string()).describe('What worked well'),
  concerns: z.array(z.string()).describe('Areas needing attention')
});

export type FeedbackAnalysisInput = z.infer<typeof FeedbackAnalysisInputSchema>;
export type FeedbackAnalysisOutput = z.infer<typeof FeedbackAnalysisOutputSchema>;

export async function analyzeFeedback(input: FeedbackAnalysisInput): Promise<FeedbackAnalysisOutput> {
  return feedbackAnalysisFlow(input);
}

const feedbackAnalysisPrompt = ai.definePrompt({
  name: 'feedbackAnalysisPrompt',
  input: { schema: FeedbackAnalysisInputSchema },
  output: { schema: FeedbackAnalysisOutputSchema },
  prompt: `Analyze the following event feedback and provide insights for organizers.

Feedback Data:
{{#each feedbackData}}
Event: {{{eventTitle}}} (ID: {{{eventId}})
Rating: {{{rating}}}/5
{{#if attendeeRole}}Attendee Role: {{{attendeeRole}}}{{/if}}
Feedback: "{{{feedback}}}"

{{/each}}

Analysis Type: {{{analysisType}}}

Provide a comprehensive analysis including:
1. Overall sentiment and average rating
2. Key themes mentioned across feedback (positive and negative)
3. Frequency and examples of each theme
4. Specific, actionable recommendations for improvement
5. Highlights of what worked well
6. Areas of concern that need immediate attention

Focus on patterns across multiple feedback entries and provide insights that help organizers improve future events.`,
});

const feedbackAnalysisFlow = ai.defineFlow(
  {
    name: 'feedbackAnalysisFlow',
    inputSchema: FeedbackAnalysisInputSchema,
    outputSchema: FeedbackAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await feedbackAnalysisPrompt(input);
    return output || {
      overallSentiment: 'neutral' as const,
      averageRating: 0,
      keyThemes: [],
      recommendations: [],
      highlights: [],
      concerns: []
    };
  }
);