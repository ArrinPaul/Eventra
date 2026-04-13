'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Update the current user's profile
 */
export async function updateUserDetails(data: any) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  try {
    const userId = session.user.id;
    
    // Remove fields that shouldn't be updated directly via this action
    const { id, email, emailVerified, createdAt, ...updateData } = data;

    // Handle updatedAt
    updateData.updatedAt = new Date();

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    revalidatePath('/');
    return { success: true, user: result[0] };
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Get the full profile of the current authenticated user
 */
export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Search users by name for chat/networking
 */
export async function searchUsers(query: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          ilike(users.name, `%${query}%`),
          sql`${users.id} != ${session.user.id}`
        )
      )
      .limit(10);
    
    return result;
  } catch (error) {
    console.error('Failed to search users:', error);
    return [];
  }
}
