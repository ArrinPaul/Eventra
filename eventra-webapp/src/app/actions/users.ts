'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return user || null;
  } catch (error) {
    console.error('getUserById Error:', error);
    return null;
  }
}

export async function searchUsers(query: string) {
  try {
    const results = await db.query.users.findMany({
      where: (users, { ilike, or }) => or(
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`)
      ),
      limit: 10
    });
    return results;
  } catch (error) {
    console.error('searchUsers Error:', error);
    return [];
  }
}

export async function updateUserDetails(id: string, data: any) {
  try {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return { success: true, user: updated };
  } catch (error) {
    console.error('updateUserDetails Error:', error);
    return { success: false, user: null };
  }
}
