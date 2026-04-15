'use server';

import { db } from '@/lib/db';
import { communities, communityMembers, posts, comments, users } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validateRole } from '@/lib/auth-utils';
import { z } from 'zod';

import { logActivity } from './feed';
import { awardXP } from './gamification';

// --- SCHEMAS ---

const communitySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  category: z.string(),
  isPrivate: z.boolean().default(false),
  image: z.string().url().optional().or(z.literal('')),
});

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  communityId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

// --- ACTIONS ---

/**
 * Create a new community
 */
export async function createCommunity(rawInput: any) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const validated = communitySchema.safeParse(rawInput);
  
  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const newCommunity = await tx.insert(communities).values({
        ...validated.data,
        creatorId: user.id,
      }).returning();

      const communityId = newCommunity[0].id;

      // Creator automatically becomes an admin member
      await tx.insert(communityMembers).values({
        communityId,
        userId: user.id,
        role: 'admin',
      });

      return newCommunity[0];
    });

    // Background tasks
    logActivity({
      userId: user.id,
      type: 'community_joined',
      targetId: result.id,
      content: `Created community: ${result.name}`,
    }).catch(console.error);

    awardXP(user.id, 50, 'Creating a community').catch(console.error);

    revalidatePath('/community');
    return { success: true, community: result };
  } catch (error) {
    console.error('createCommunity Error:', error);
    return { success: false, error: 'Database operation failed' };
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

    logActivity({
      userId: user.id,
      type: 'community_joined',
      targetId: communityId,
    }).catch(console.error);

    awardXP(user.id, 10, 'Joining a community').catch(console.error);

    revalidatePath(`/community/${communityId}`);
    return { success: true };
  } catch (error) {
    console.error('joinCommunity Error:', error);
    return { success: false, error: 'Failed to join community' };
  }
}

/**
 * Create a post
 */
export async function createPost(rawInput: any) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const validated = postSchema.safeParse(rawInput);

  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;

  try {
    const newPost = await db.insert(posts).values({
      content: data.content,
      authorId: user.id,
      communityId: data.communityId,
      imageUrl: data.imageUrl,
    }).returning();

    const postId = newPost[0].id;

    logActivity({
      userId: user.id,
      type: 'post',
      targetId: postId,
      content: data.content.substring(0, 100),
      metadata: {
        communityId: data.communityId,
        imageUrl: data.imageUrl,
      }
    }).catch(console.error);

    awardXP(user.id, 20, 'Posting to the community').catch(console.error);

    revalidatePath(data.communityId ? `/community/${data.communityId}` : '/feed');
    return { success: true, post: newPost[0] };
  } catch (error) {
    console.error('createPost Error:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

/**
 * Like a post
 */
export async function likePost(postId: string) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));

    awardXP(user.id, 2, 'Liking a post').catch(console.error);

    revalidatePath('/feed');
    return { success: true };
  } catch (error) {
    console.error('likePost Error:', error);
    return { success: false, error: 'Failed to like post' };
  }
}

/**
 * Create a comment
 */
export async function createComment(rawInput: any) {
  const user = await validateRole(['attendee', 'organizer', 'admin', 'professional']);
  const validated = commentSchema.safeParse(rawInput);

  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  const { postId, content } = validated.data;

  try {
    const newComment = await db.insert(comments).values({
      postId,
      authorId: user.id,
      content,
    }).returning();

    logActivity({
      userId: user.id,
      type: 'comment',
      targetId: postId,
      content: content.substring(0, 50),
    }).catch(console.error);

    awardXP(user.id, 5, 'Commenting on a post').catch(console.error);

    revalidatePath('/feed');
    return { success: true, comment: newComment[0] };
  } catch (error) {
    console.error('createComment Error:', error);
    return { success: false, error: 'Failed to create comment' };
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
    console.error('getCommunityPosts Error:', error);
    return [];
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
    console.error('getPostComments Error:', error);
    return [];
  }
}
