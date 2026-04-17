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
