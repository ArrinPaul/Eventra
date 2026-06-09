import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/core/services/email';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Email service not configured' ? 503 : 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
