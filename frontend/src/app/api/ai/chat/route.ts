import { aiChatbotFlow } from '@/lib/ai';
import { db } from '@/lib/db';
import { aiChatSessions, aiChatMessages } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const { question, agenda, eventId } = await req.json();

  if (!question || !eventId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 1. Manage AI Chat Session Persistence
    let chatSessionId: string;
    
    if (userId) {
      // Find or create session for this user and event
      const existingSession = await db.query.aiChatSessions.findFirst({
        where: (sessions, { and, eq }) => 
          and(eq(sessions.userId, userId), eq(sessions.eventId, eventId))
      });

      if (existingSession) {
        chatSessionId = existingSession.id;
      } else {
        const newSession = await db.insert(aiChatSessions).values({
          userId,
          eventId,
          title: `Chat about event ${eventId}`,
        }).returning();
        chatSessionId = newSession[0].id;
      }
    }

    // 2. Fetch History (if we have a session)
    let history: any[] = [];
    if (userId) {
      const messages = await db
        .select()
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, chatSessionId!))
        .orderBy(asc(aiChatMessages.createdAt))
        .limit(10);

      history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }],
      }));
    }

    // 3. Run AI Flow
    const { answer } = await aiChatbotFlow({
      question,
      eventContext: agenda,
      history,
    });

    // 4. Save messages to DB if authenticated
    if (userId) {
      await db.insert(aiChatMessages).values([
        { sessionId: chatSessionId!, role: 'user', content: question },
        { sessionId: chatSessionId!, role: 'assistant', content: answer },
      ]);
    }

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
