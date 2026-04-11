import { NextResponse } from 'next/server';
import { buildSessionUser, createSessionToken, SESSION_MAX_AGE } from '@/core/auth/session';
import type { UserRole } from '@/types';

const allowedRoles: UserRole[] = ['student', 'professional', 'organizer', 'admin', 'speaker', 'attendee', 'vendor'];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<{
    role: UserRole;
    email: string;
    name: string;
    image: string;
    callbackUrl: string;
  }>;

  const role = allowedRoles.includes(body.role as UserRole) ? (body.role as UserRole) : 'professional';
  const user = buildSessionUser({
    role,
    email: body.email,
    name: body.name,
    image: body.image,
  });

  const token = createSessionToken(user);
  const response = NextResponse.json({ success: true, user, callbackUrl: body.callbackUrl || null });

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  // Legacy compatibility cookies for existing flows. Middleware no longer trusts role cookie as source-of-truth.
  response.cookies.set('user-role', user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  response.cookies.set('user-id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
