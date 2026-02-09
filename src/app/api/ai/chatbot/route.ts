import { NextRequest, NextResponse } from 'next/server';
import { aiChatbotFlow } from '@/ai/flows/ai-chatbot-flow';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, context, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    let eventDetails = "";
    if (context?.eventId) {
      try {
        const event = await convex.query(api.events.getById, { id: context.eventId });
        if (event) {
          eventDetails = `
            Title: ${event.title}
            Description: ${event.description}
            Category: ${event.category}
            Location: ${typeof event.location === 'string' ? event.location : JSON.stringify(event.location)}
            Date: ${new Date(event.startDate).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()}
            Speakers: ${event.speakers?.join(', ') || 'None listed'}
          `;
        }
      } catch (e) {
        console.error("Error fetching event details:", e);
      }
    }

    const result = await aiChatbotFlow({
      message,
      history: history || [],
      context: {
        userRole: context?.userRole,
        eventTitle: context?.eventTitle,
        eventDetails: eventDetails,
        currentPage: context?.currentPage,
      }
    });

    return NextResponse.json({ 
      success: true,
      message: result.message,
      actions: result.actions,
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
