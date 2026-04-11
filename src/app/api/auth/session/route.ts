import { NextResponse } from 'next/server';
import { sessionPayloadToUser, verifySessionToken } from '@/core/auth/session';

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('auth-token');
  response.cookies.delete('user-role');
  response.cookies.delete('user-id');
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.json({ authenticated: true, user: sessionPayloadToUser(payload) });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
