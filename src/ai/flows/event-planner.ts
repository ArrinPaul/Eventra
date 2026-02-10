/**
 * Event Planner AI Flow
 * Generates event agendas and checklists based on event details
 */

import { ai } from '../genkit';
import { z } from 'zod';

// Input schema for event planning
const EventPlanInput = z.object({
  eventType: z.string().describe('Type of event (conference, workshop, networking, etc.)'),
  title: z.string().describe('Event title'),
  description: z.string().optional().describe('Event description'),
  duration: z.number().describe('Event duration in hours'),
  attendeeCount: z.number().optional().describe('Expected number of attendees'),
  goals: z.array(z.string()).optional().describe('Event goals and objectives'),
});

// Output schema for agenda
const AgendaItemSchema = z.object({
  time: z.string().describe('Time slot (e.g., "9:00 AM - 10:00 AM")'),
  title: z.string().describe('Session/activity title'),
  description: z.string().describe('Brief description of the activity'),
  duration: z.number().describe('Duration in minutes'),
  speaker: z.string().optional().describe('Speaker or facilitator name'),
  location: z.string().optional().describe('Room or location'),
});

const AgendaOutput = z.object({
  agenda: z.array(AgendaItemSchema).describe('Chronological list of agenda items'),
  totalDuration: z.number().describe('Total event duration in minutes'),
});

// Output schema for checklist
const ChecklistItemSchema = z.object({
  category: z.enum(['pre-event', 'day-of', 'post-event']).describe('When this task should be completed'),
  task: z.string().describe('Task description'),
  priority: z.enum(['high', 'medium', 'low']).describe('Task priority'),
  assignee: z.string().optional().describe('Suggested role for this task'),
  deadline: z.string().optional().describe('Relative deadline (e.g., "1 week before", "day of")'),
});

const ChecklistOutput = z.object({
  checklist: z.array(ChecklistItemSchema).describe('Comprehensive event planning checklist'),
});

/**
 * Generate AI-powered event agenda
 */
export const generateAgenda = ai.defineFlow(
  {
    name: 'generateAgenda',
    inputSchema: EventPlanInput,
    outputSchema: AgendaOutput,
  },
  async (input) => {
    const { eventType, title, description, duration, attendeeCount, goals } = input;

    const prompt = `You are an expert event planner. Create a detailed, realistic agenda for the following event:

Event Type: ${eventType}
Title: ${title}
${description ? `Description: ${description}` : ''}
Duration: ${duration} hours
${attendeeCount ? `Expected Attendees: ${attendeeCount}` : ''}
${goals && goals.length > 0 ? `Goals: ${goals.join(', ')}` : ''}

Create a professional agenda that:
1. Starts with registration/welcome (15-30 min)
2. Includes appropriate breaks every 60-90 minutes
3. Has a logical flow of activities
4. Ends with networking/closing remarks
5. Fits within the ${duration} hour timeframe
6. Is appropriate for ${eventType} events
7. Considers the attendee count for activity types

For each agenda item, provide:
- Specific time slots
- Clear titles
- Brief descriptions
- Realistic durations
- Speaker/facilitator suggestions (use generic roles like "Keynote Speaker", "Panel Moderator")
- Location/room suggestions when relevant

Return a well-structured, professional agenda that event organizers can use directly.`;

    const llmResponse = await ai.generate({
      prompt,
      output: {
        schema: AgendaOutput,
      },
    });

    if (!llmResponse.output) {
      throw new Error('Failed to generate event agenda');
    }
    
    return llmResponse.output;
  }
);

/**
 * Generate AI-powered event checklist
 */
export const generateChecklist = ai.defineFlow(
  {
    name: 'generateChecklist',
    inputSchema: EventPlanInput,
    outputSchema: ChecklistOutput,
  },
  async (input) => {
    const { eventType, title, duration, attendeeCount } = input;

    const prompt = `You are an expert event coordinator. Create a comprehensive planning checklist for the following event:

Event Type: ${eventType}
Title: ${title}
Duration: ${duration} hours
${attendeeCount ? `Expected Attendees: ${attendeeCount}` : ''}

Create a detailed checklist covering:

PRE-EVENT (2-4 weeks before):
- Venue booking and setup
- Speaker/vendor coordination
- Marketing and promotion
- Registration setup
- Material preparation
- Technical requirements
- Catering arrangements

DAY-OF EVENT:
- Setup and testing
- Registration desk
- AV/tech support
- Attendee management
- Real-time coordination
- Emergency protocols

POST-EVENT:
- Cleanup
- Feedback collection
- Thank you emails
- Content sharing
- Analytics review
- Follow-up actions

For each task:
- Categorize by timing (pre-event, day-of, post-event)
- Assign appropriate priority (high, medium, low)
- Suggest who should handle it (e.g., "Event Coordinator", "Tech Team", "Marketing")
- Provide relative deadlines where applicable

Create 15-25 actionable checklist items that cover all critical aspects of ${eventType} event planning.`;

    const llmResponse = await ai.generate({
      prompt,
      output: {
        schema: ChecklistOutput,
      },
    });

    if (!llmResponse.output) {
      throw new Error('Failed to generate event checklist');
    }
    
    return llmResponse.output;
  }
);

/**
 * Combined flow for generating both agenda and checklist
 */
export const generateEventPlan = ai.defineFlow(
  {
    name: 'generateEventPlan',
    inputSchema: EventPlanInput,
    outputSchema: z.object({
      agenda: AgendaOutput,
      checklist: ChecklistOutput,
    }),
  },
  async (input) => {
    const [agendaResult, checklistResult] = await Promise.all([
      generateAgenda(input),
      generateChecklist(input),
    ]);

    return {
      agenda: agendaResult,
      checklist: checklistResult,
    };
  }
);
