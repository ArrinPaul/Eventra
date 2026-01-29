import { NextRequest, NextResponse } from 'next/server';
import { generateChecklist } from '@/ai/flows/event-planner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, title, description, duration, attendeeCount, goals } = body;

    // Validate input
    if (!title || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: title and eventType' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await generateChecklist({
      eventType,
      title,
      description,
      duration: duration || 3,
      attendeeCount,
      goals: goals || [],
    });

    return NextResponse.json({ checklist: result });
  } catch (error: any) {
    console.error('Checklist generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate checklist' },
      { status: 500 }
    );
  }
}
