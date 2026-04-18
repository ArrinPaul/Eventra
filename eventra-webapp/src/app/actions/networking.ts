'use server';

import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { and, eq, ne, or } from 'drizzle-orm';
import { auth } from '@/auth';

export type NetworkUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  interests: string | null;
  bio: string | null;
};

export type NetworkConnection = {
  otherUser: NetworkUser;
  status: 'accepted';
  direction: 'sent' | 'received';
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Authentication required');
  return session.user.id;
}

export async function getNetworkingSnapshot(): Promise<{
  publicUsers: NetworkUser[];
  acceptedConnections: NetworkConnection[];
  pendingReceived: NetworkConnection[];
  pendingSent: NetworkConnection[];
}> {
  const userId = await requireUserId();

  try {
    const publicUsers = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        role: users.role,
        interests: users.interests,
        bio: users.bio,
      })
      .from(users)
      .where(ne(users.id, userId))
      .limit(200);

    const linked = await db
      .select({
        followerId: follows.followerId,
        followingId: follows.followingId,
        id: users.id,
        name: users.name,
        image: users.image,
        role: users.role,
        interests: users.interests,
        bio: users.bio,
      })
      .from(follows)
      .innerJoin(users, or(eq(users.id, follows.followerId), eq(users.id, follows.followingId)))
      .where(or(eq(follows.followerId, userId), eq(follows.followingId, userId)));

    const accepted: NetworkConnection[] = [];
    const seen = new Set<string>();

    for (const row of linked) {
      const otherId = row.followerId === userId ? row.followingId : row.followerId;
      if (row.id !== otherId || seen.has(otherId)) continue;
      seen.add(otherId);

      accepted.push({
        otherUser: {
          id: row.id,
          name: row.name,
          image: row.image,
          role: row.role,
          interests: row.interests,
          bio: row.bio,
        },
        status: 'accepted',
        direction: row.followerId === userId ? 'sent' : 'received',
      });
    }

    return {
      publicUsers,
      acceptedConnections: accepted,
      pendingReceived: [],
      pendingSent: [],
    };
  } catch (error) {
    console.error('getNetworkingSnapshot Error:', error);
    return { publicUsers: [], acceptedConnections: [], pendingReceived: [], pendingSent: [] };
  }
}

export async function sendConnectionRequest(receiverId: string) {
  const userId = await requireUserId();

  if (receiverId === userId) {
    return { success: false, error: 'Cannot connect with yourself' };
  }

  try {
    const existing = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, userId), eq(follows.followingId, receiverId)),
    });

    if (existing) {
      return { success: true };
    }

    await db.insert(follows).values({
      followerId: userId,
      followingId: receiverId,
    });

    return { success: true };
  } catch (error) {
    console.error('sendConnectionRequest Error:', error);
    return { success: false, error: 'Failed to connect' };
  }
}

export async function respondToConnectionRequest(connectionUserId: string, accept: boolean) {
  const userId = await requireUserId();

  try {
    if (!accept) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, connectionUserId), eq(follows.followingId, userId)));
      return { success: true };
    }

    const reverse = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, userId), eq(follows.followingId, connectionUserId)),
    });

    if (!reverse) {
      await db.insert(follows).values({ followerId: userId, followingId: connectionUserId });
    }

    return { success: true };
  } catch (error) {
    console.error('respondToConnectionRequest Error:', error);
    return { success: false, error: 'Failed to respond' };
  }
}

export async function removeConnection(otherUserId: string) {
  const userId = await requireUserId();

  try {
    await db
      .delete(follows)
      .where(
        or(
          and(eq(follows.followerId, userId), eq(follows.followingId, otherUserId)),
          and(eq(follows.followerId, otherUserId), eq(follows.followingId, userId))
        )
      );

    return { success: true };
  } catch (error) {
    console.error('removeConnection Error:', error);
    return { success: false, error: 'Failed to remove connection' };
  }
}
