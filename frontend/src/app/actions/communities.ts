'use server';

import { db } from '@/lib/db';
import { communities, communityMembers, posts, comments, users } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';

import { logActivity } from './feed';
import { awardXP } from './gamification';

/**
 * Create a new community
 */
export async function createCommunity(data: { name: string, description: string, category: string, isPrivate?: boolean }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const newCommunity = await db.insert(communities).values({
      name: data.name,
      description: data.description,
      category: data.category,
      isPrivate: data.isPrivate || false,
      creatorId: user.id,
    }).returning();

    const communityId = newCommunity[0].id;

    // Creator automatically becomes an admin member
    await db.insert(communityMembers).values({
      communityId,
      userId: user.id,
      role: 'admin',
    });

    // Log Activity
    await logActivity({
      userId: user.id,
      type: 'community_joined',
      targetId: communityId,
      content: `Created community: ${data.name}`,
    });

    // Award XP
    await awardXP(user.id, 50, 'Creating a community');

    revalidatePath('/community');
    return { success: true, community: newCommunity[0] };
  } catch (error) {
    console.error('Failed to create community:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Join a community
 */
export async function joinCommunity(communityId: string) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const existing = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, user.id)))
      .limit(1);

    if (existing.length > 0) return { success: false, message: 'Already a member' };

    await db.transaction(async (tx) => {
      await tx.insert(communityMembers).values({
        communityId,
        userId: user.id,
      });

      await tx
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} + 1` })
        .where(eq(communities.id, communityId));
    });

    // Log Activity
    await logActivity({
      userId: user.id,
      type: 'community_joined',
      targetId: communityId,
    });

    // Award XP
    await awardXP(user.id, 10, 'Joining a community');

    revalidatePath(`/community/${communityId}`);
    return { success: true };
  } catch (error) {
    throw new Error('Failed to join community');
  }
}

/**
 * Create a post in a community or globally
 */
export async function createPost(data: { content: string, communityId?: string, imageUrl?: string }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const newPost = await db.insert(posts).values({
      content: data.content,
      authorId: user.id,
      communityId: data.communityId,
      imageUrl: data.imageUrl,
    }).returning();

    const postId = newPost[0].id;

    // Log Activity
    await logActivity({
      userId: user.id,
      type: 'post',
      targetId: postId,
      content: data.content.substring(0, 100),
      metadata: {
        communityId: data.communityId,
        imageUrl: data.imageUrl,
      }
    });

    // Award XP
    await awardXP(user.id, 20, 'Posting to the community');

    revalidatePath(data.communityId ? `/community/${data.communityId}` : '/feed');
    return { success: true, post: newPost[0] };
  } catch (error) {
    throw new Error('Failed to create post');
  }
}

/**
 * Like a post
 */
export async function likePost(postId: string) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    // In a full implementation, we'd have a post_likes table to prevent double likes
    // For now, we increment the count
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));

    // Award XP (small amount for liking)
    await awardXP(user.id, 2, 'Liking a post');

    revalidatePath('/feed');
    return { success: true };
  } catch (error) {
    throw new Error('Failed to like post');
  }
}

/**
 * Create a comment on a post
 */
export async function createComment(data: { postId: string, content: string }) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const newComment = await db.insert(comments).values({
      postId: data.postId,
      authorId: user.id,
      content: data.content,
    }).returning();

    // Log Activity
    await logActivity({
      userId: user.id,
      type: 'comment',
      targetId: data.postId,
      content: data.content.substring(0, 50),
    });

    // Award XP
    await awardXP(user.id, 5, 'Commenting on a post');

    revalidatePath('/feed');
    return { success: true, comment: newComment[0] };
  } catch (error) {
    throw new Error('Failed to create comment');
  }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string) {
  try {
    const result = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          name: users.name,
          image: users.image,
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    
    return result;
  } catch (error) {
    return [];
  }
}

/**
 * Get community posts
 */
export async function getCommunityPosts(communityId: string) {
  try {
    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          name: users.name,
          image: users.image,
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt));
    
    return result;
  } catch (error) {
    return [];
  }
}
