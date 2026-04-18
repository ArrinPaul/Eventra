import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const GUEST_USER_ID = 'guest-user';

async function ensureGuestUser() {
  const existing = await db.query.users.findFirst({ where: eq(users.id, GUEST_USER_ID) });
  if (existing) return existing;

  const [guest] = await db
    .insert(users)
    .values({
      id: GUEST_USER_ID,
      name: 'Guest User',
      email: 'guest@eventra.local',
      role: 'attendee',
      onboardingCompleted: true,
      points: 0,
      level: 1,
      xp: 0,
    })
    .onConflictDoNothing()
    .returning();

  return guest || (await db.query.users.findFirst({ where: eq(users.id, GUEST_USER_ID) }));
}

export async function auth() {
  const guest = await ensureGuestUser();
  if (!guest) return null;

  return {
    user: {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      image: guest.image || undefined,
      role: guest.role as any,
    },
  };
}

export async function signIn() {
  return { ok: false, error: 'Authentication is disabled in this build.' };
}

export async function signOut() {
  return { ok: true };
}

export const handlers = {
  GET: async () => new Response('Authentication disabled', { status: 404 }),
  POST: async () => new Response('Authentication disabled', { status: 404 }),
};
