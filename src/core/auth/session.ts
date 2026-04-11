import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import type { User, UserRole } from '@/types';

const SESSION_ISSUER = 'eventra';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_FALLBACK_SECRET = 'eventra-dev-session-secret-change-me';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  onboardingCompleted?: boolean;
}

interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  onboardingCompleted?: boolean;
  iat: number;
  exp: number;
  iss: string;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

function getSessionSecret(): string {
  const configured = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET (or AUTH_SECRET) is required in production');
  }
  return DEV_FALLBACK_SECRET;
}

export function createSessionToken(user: SessionUser): string {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    onboardingCompleted: user.onboardingCompleted,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    iss: SESSION_ISSUER,
  };

  const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${headerB64}.${payloadB64}`, secret);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const secret = getSessionSecret();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const expected = sign(`${headerB64}.${payloadB64}`, secret);

  try {
    const signature = Buffer.from(signatureB64, 'base64url');
    const expectedSignature = Buffer.from(expected, 'base64url');
    if (signature.length !== expectedSignature.length) return null;
    if (!timingSafeEqual(signature, expectedSignature)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== SESSION_ISSUER) return null;
    if (payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionPayloadToUser(payload: SessionPayload): User {
  return {
    id: payload.sub,
    _id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    image: payload.image,
    onboardingCompleted: payload.onboardingCompleted,
  };
}

export function buildSessionUser(input?: Partial<SessionUser>): SessionUser {
  const role = (input?.role || 'professional') as UserRole;
  const id = input?.id || randomUUID();
  const name = input?.name || 'Eventra User';
  const email = input?.email || `user-${id.slice(0, 8)}@eventra.app`;

  return {
    id,
    name,
    email,
    role,
    image: input?.image,
    onboardingCompleted: input?.onboardingCompleted ?? true,
  };
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
