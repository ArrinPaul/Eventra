import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/ai/flows/event-knowledge-bot';

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
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        answer: "I apologize, but I'm having trouble processing your question right now. Please try again in a moment.",
        error: error.message || 'Failed to process question' 
      },
      { status: 200 } // Return 200 with error message for better UX
    );
  }
}
