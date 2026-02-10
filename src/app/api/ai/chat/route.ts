import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/ai/flows/event-knowledge-bot';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { withRateLimit, rateLimitConfigs } from '@/core/utils/rate-limit';
import { validateAIRequest } from '@/core/utils/ai-auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

async function chatHandler(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await validateAIRequest(request, 'chatbot');
    if (auth.error) return auth.error;

    const body = await request.json();
    const { question, agenda, eventId } = body;

    // Validate input
    if (!question) {
      return NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      );
    }

    let finalAgenda = agenda;

    // If we have an eventId but no agenda, fetch it from Convex
    if (eventId && !finalAgenda) {
      try {
        const event = await convex.query(api.events.getById, { id: eventId });
        if (event) {
          finalAgenda = `
            Event: ${event.title}
            Description: ${event.description}
            Date: ${new Date(event.startDate).toLocaleDateString()}
            Location: ${typeof event.location === 'string' ? event.location : JSON.stringify(event.location)}
            Category: ${event.category}
            Speakers: ${event.speakers ? event.speakers.join(', ') : 'TBD'}
          `;
          
          if (event.agenda) {
            finalAgenda += `\nDetailed Agenda: ${JSON.stringify(event.agenda)}`;
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch event data for chatbot:', fetchError);
      }
    }

    // Build a default agenda context if still none provided
    const agendaContext = finalAgenda || `Event ID: ${eventId || 'Unknown'}. No detailed agenda available.`;

    // Call the AI flow
    const result = await answerQuestion({
      question,
      agenda: agendaContext,
    });

    return NextResponse.json({ answer: result.answer });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        answer: "I apologize, but I'm having trouble processing your question right now. Please try again in a moment.",
        error: getErrorMessage(error)
      },
      { status: 200 } // Return 200 with error message for better UX
    );
  }
}

export const POST = withRateLimit(chatHandler, rateLimitConfigs.ai);

