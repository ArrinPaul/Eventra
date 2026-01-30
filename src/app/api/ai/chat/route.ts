import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/ai/flows/event-knowledge-bot';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, agenda, eventId } = body;

    // Validate input
    if (!question) {
      return NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      );
    }

    // Build a default agenda context if none provided
    const agendaContext = agenda || `Event ID: ${eventId || 'Unknown'}. No detailed agenda available.`;

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
