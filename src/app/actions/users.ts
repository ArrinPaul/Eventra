'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, desc, not, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';


export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return user || null;
  } catch (error) {
    logger.error('getUserById Error', error);
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
    logger.error('searchUsers Error', error);
    return [];
  }
}

const userUpdateSchema = z.object({
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  interests: z.string().nullable().optional(),
  college: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  company: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  bloodGroup: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function updateUserDetails(id: string, data: any) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Authentication required', user: null };
  }

  // Ensure user is updating their own profile, or is an admin
  let isAuthorized = userId === id;
  if (!isAuthorized) {
    const caller = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (caller && caller.role === 'admin') {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return { success: false, error: 'Unauthorized', user: null };
  }

  const validated = userUpdateSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid profile data', user: null };
  }

  try {
    const [updated] = await db
      .update(users)
      .set({
        ...validated.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return { success: true, user: updated };
  } catch (error) {
    logger.error('updateUserDetails Error', error);
    return { success: false, error: 'Database update failed', user: null };
  }
}

export async function getLeaderboard(limit = 50) {
  try {
    const results = await db.query.users.findMany({
      where: (users, { and }) => not(inArray(users.role, ['admin', 'organizer'])),
      orderBy: [desc(users.points)],
      limit,
    });
    return results;
  } catch (error) {
    logger.error('getLeaderboard Error', error);
    return [];
  }
}
