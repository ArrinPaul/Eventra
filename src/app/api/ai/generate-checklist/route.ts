import { NextRequest, NextResponse } from 'next/server';
import { generateChecklist } from '@/ai/flows/event-planner';
import { withRateLimit, rateLimitConfigs } from '@/core/utils/rate-limit';
import { validateAIRequest } from '@/core/utils/ai-auth';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

async function checklistHandler(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await validateAIRequest(request, 'automation');
    if (auth.error) return auth.error;

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
  } catch (error: unknown) {
    console.error('Checklist generation error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(checklistHandler, rateLimitConfigs.ai);
