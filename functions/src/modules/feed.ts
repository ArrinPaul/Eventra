import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Create a new feed post
export const createFeedPost = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { content, type, attachments, hashtags, mentions, eventId } = data;
  const userId = context.auth.uid;

  if (!content || content.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Content is required');
  }

  try {
    const postRef = await db.collection('feedPosts').add({
      authorId: userId,
      content: content.trim(),
      type: type || 'text',
      attachments: attachments || [],
      hashtags: hashtags || [],
      mentions: mentions || [],
      eventId: eventId || null,
      likes: 0,
      likedBy: [],
      reposts: 0,
      repostedBy: [],
      replies: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Process mentions - send notifications
    if (mentions && mentions.length > 0) {
      const batch = db.batch();
      
      mentions.forEach((mentionedUserId: string) => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: mentionedUserId,
          type: 'mention',
          title: 'You were mentioned in a post',
          message: `Someone mentioned you in their post`,
          data: {
            postId: postRef.id,
            authorId: userId
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
    }

    // Update user stats
    await db.collection('users').doc(userId).update({
      postCount: admin.firestore.FieldValue.increment(1),
      points: admin.firestore.FieldValue.increment(10) // Award points for posting
    });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'post_created',
      eventData: {
        postId: postRef.id,
        type,
        hasAttachments: attachments && attachments.length > 0,
        hashtags: hashtags?.length || 0,
        mentions: mentions?.length || 0
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, postId: postRef.id };
  } catch (error) {
    console.error('Error creating feed post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create post');
  }
});

// Like or unlike a feed post
export const likeFeedPost = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { postId } = data;
  const userId = context.auth.uid;

  if (!postId) {
    throw new functions.https.HttpsError('invalid-argument', 'postId is required');
  }

  try {
    const postRef = db.collection('feedPosts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Post not found');
    }

    const postData = postDoc.data();
    const likedBy = postData?.likedBy || [];
    const isLiked = likedBy.includes(userId);

    let updateData: any;
    
    if (isLiked) {
      // Unlike the post
      updateData = {
        likes: admin.firestore.FieldValue.increment(-1),
        likedBy: admin.firestore.FieldValue.arrayRemove(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
    } else {
      // Like the post
      updateData = {
        likes: admin.firestore.FieldValue.increment(1),
        likedBy: admin.firestore.FieldValue.arrayUnion(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Send notification to post author (if not liking own post)
      if (postData?.authorId !== userId) {
        await db.collection('notifications').add({
          userId: postData.authorId,
          type: 'post_like',
          title: 'Someone liked your post',
          message: 'Your post received a new like',
          data: {
            postId,
            likedBy: userId
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    await postRef.update(updateData);

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: isLiked ? 'post_unliked' : 'post_liked',
      eventData: {
        postId,
        authorId: postData?.authorId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      liked: !isLiked,
      newLikeCount: (postData?.likes || 0) + (isLiked ? -1 : 1)
    };
  } catch (error) {
    console.error('Error liking feed post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to like post');
  }
});

// Add a comment to a feed post
export const commentOnPost = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { postId, content, replyToId } = data;
  const userId = context.auth.uid;

  if (!postId || !content || content.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'postId and content are required');
  }

  try {
    // Check if post exists
    const postRef = db.collection('feedPosts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Post not found');
    }

    // Create comment
    const commentRef = await db.collection('feedComments').add({
      postId,
      authorId: userId,
      content: content.trim(),
      replyTo: replyToId || null,
      likes: 0,
      likedBy: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update post reply count
    await postRef.update({
      replies: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const postData = postDoc.data();

    // Send notification to post author (if not commenting on own post)
    if (postData?.authorId !== userId) {
      await db.collection('notifications').add({
        userId: postData.authorId,
        type: 'post_comment',
        title: 'New comment on your post',
        message: 'Someone commented on your post',
        data: {
          postId,
          commentId: commentRef.id,
          authorId: userId
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // If this is a reply, notify the original commenter
    if (replyToId) {
      const originalCommentDoc = await db.collection('feedComments').doc(replyToId).get();
      const originalCommentData = originalCommentDoc.data();
      
      if (originalCommentData && originalCommentData.authorId !== userId) {
        await db.collection('notifications').add({
          userId: originalCommentData.authorId,
          type: 'comment_reply',
          title: 'Someone replied to your comment',
          message: 'You received a reply to your comment',
          data: {
            postId,
            commentId: commentRef.id,
            replyToId,
            authorId: userId
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Award points for engaging
    await db.collection('users').doc(userId).update({
      points: admin.firestore.FieldValue.increment(5)
    });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'post_commented',
      eventData: {
        postId,
        commentId: commentRef.id,
        isReply: !!replyToId,
        authorId: postData?.authorId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error('Error commenting on post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add comment');
  }
});

// Update feed statistics
export const updateFeedStats = functions.firestore
  .document('feedPosts/{postId}')
  .onCreate(async (snap: any, context: any) => {
    try {
      // Update global feed stats
      await db.collection('globalStats').doc('feed').update({
        totalPosts: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      await db.collection('dailyStats').doc(today).update({
        postsCreated: admin.firestore.FieldValue.increment(1)
      });

    } catch (error) {
      console.error('Error updating feed stats:', error);
    }
  });

// Generate feed notifications for followers
export const generateFeedNotifications = functions.firestore
  .document('feedPosts/{postId}')
  .onCreate(async (snap: any, context: any) => {
    const postData = snap.data();
    const authorId = postData.authorId;

    try {
      // Get author's followers/connections
      const authorDoc = await db.collection('users').doc(authorId).get();
      const authorData = authorDoc.data();
      
      if (!authorData?.connections) {
        return;
      }

      const batch = db.batch();
      const connections = authorData.connections.slice(0, 50); // Limit notifications

      // Create notifications for connections
      connections.forEach((connectionId: string) => {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: connectionId,
          type: 'connection_post',
          title: 'New post from your connection',
          message: `${authorData.name || 'Someone'} shared a new post`,
          data: {
            postId: context.params.postId,
            authorId,
            postType: postData.type
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

    } catch (error) {
      console.error('Error generating feed notifications:', error);
    }
  });

// Get personalized feed
export const getPersonalizedFeed = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { limit = 20, lastPostId } = data;
  const userId = context.auth.uid;

  try {
    // Get user's connections and interests
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const connections = userData.connections || [];
    const interests = userData.interests || [];

    let query = db.collection('feedPosts')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Add pagination
    if (lastPostId) {
      const lastPostDoc = await db.collection('feedPosts').doc(lastPostId).get();
      if (lastPostDoc.exists) {
        query = query.startAfter(lastPostDoc);
      }
    }

    const postsSnapshot = await query.get();
    const posts = [];

    for (const doc of postsSnapshot.docs) {
      const postData = doc.data();
      let relevanceScore = 0;

      // Base score for all posts
      relevanceScore += 1;

      // Boost posts from connections
      if (connections.includes(postData.authorId)) {
        relevanceScore += 10;
      }

      // Boost posts with matching hashtags/interests
      const postHashtags = postData.hashtags || [];
      const matchingInterests = postHashtags.filter((tag: string) => 
        interests.some((interest: string) => 
          interest.toLowerCase().includes(tag.toLowerCase())
        )
      );
      relevanceScore += matchingInterests.length * 5;

      // Boost posts with high engagement
      relevanceScore += (postData.likes || 0) * 0.1;
      relevanceScore += (postData.replies || 0) * 0.2;

      // Recent posts get slight boost
      const hoursAgo = (Date.now() - postData.createdAt.toDate().getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 24) {
        relevanceScore += Math.max(0, 5 - hoursAgo / 5);
      }

      // Get author info
      const authorDoc = await db.collection('users').doc(postData.authorId).get();
      const authorData = authorDoc.data();

      posts.push({
        id: doc.id,
        ...postData,
        createdAt: postData.createdAt.toDate().toISOString(),
        updatedAt: postData.updatedAt?.toDate()?.toISOString(),
        author: {
          id: postData.authorId,
          name: authorData?.name || 'Unknown User',
          role: authorData?.role,
          company: authorData?.company,
          avatar: authorData?.avatar
        },
        relevanceScore,
        isLikedByUser: (postData.likedBy || []).includes(userId)
      });
    }

    // Sort by relevance score
    posts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      posts,
      hasMore: postsSnapshot.size === limit
    };
  } catch (error) {
    console.error('Error getting personalized feed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get feed');
  }
});

// Repost functionality
export const repostFeedPost = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { postId, comment } = data;
  const userId = context.auth.uid;

  if (!postId) {
    throw new functions.https.HttpsError('invalid-argument', 'postId is required');
  }

  try {
    const originalPostRef = db.collection('feedPosts').doc(postId);
    const originalPostDoc = await originalPostRef.get();

    if (!originalPostDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Original post not found');
    }

    const originalPostData = originalPostDoc.data();

    // Check if user already reposted this
    const existingRepost = await db.collection('feedPosts')
      .where('authorId', '==', userId)
      .where('originalPostId', '==', postId)
      .limit(1)
      .get();

    if (!existingRepost.empty) {
      throw new functions.https.HttpsError('already-exists', 'Already reposted');
    }

    // Create repost
    const repostRef = await db.collection('feedPosts').add({
      authorId: userId,
      content: comment || '',
      type: 'repost',
      originalPostId: postId,
      likes: 0,
      likedBy: [],
      reposts: 0,
      repostedBy: [],
      replies: 0,
      hashtags: originalPostData?.hashtags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update original post repost count
    await originalPostRef.update({
      reposts: admin.firestore.FieldValue.increment(1),
      repostedBy: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify original author
    if (originalPostData?.authorId !== userId) {
      await db.collection('notifications').add({
        userId: originalPostData.authorId,
        type: 'post_repost',
        title: 'Someone reposted your post',
        message: 'Your post was reposted',
        data: {
          originalPostId: postId,
          repostId: repostRef.id,
          authorId: userId
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Award points
    await db.collection('users').doc(userId).update({
      points: admin.firestore.FieldValue.increment(5)
    });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'post_reposted',
      eventData: {
        originalPostId: postId,
        repostId: repostRef.id,
        originalAuthorId: originalPostData?.authorId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, repostId: repostRef.id };
  } catch (error) {
    console.error('Error reposting:', error);
    throw new functions.https.HttpsError('internal', 'Failed to repost');
  }
});

// Report content
export const reportFeedContent = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { postId, commentId, reason, description } = data;
  const userId = context.auth.uid;

  if (!postId && !commentId) {
    throw new functions.https.HttpsError('invalid-argument', 'Either postId or commentId is required');
  }

  if (!reason) {
    throw new functions.https.HttpsError('invalid-argument', 'Reason is required');
  }

  try {
    await db.collection('contentReports').add({
      reportedBy: userId,
      postId: postId || null,
      commentId: commentId || null,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error reporting content:', error);
    throw new functions.https.HttpsError('internal', 'Failed to report content');
  }
});

export const feedFunctions = {
  createFeedPost,
  likeFeedPost,
  commentOnPost,
  updateFeedStats,
  generateFeedNotifications,
  getPersonalizedFeed,
  repostFeedPost,
  reportFeedContent
};