import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const communityFunctions = {
  createCommunity: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { name, description, category, isPrivate, rules } = data;

    try {
      const community = {
        name,
        description,
        category,
        isPrivate: isPrivate || false,
        rules: rules || [],
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberCount: 1,
        postCount: 0,
        isActive: true,
        tags: [],
        moderators: [context.auth.uid]
      };

      const communityRef = await db.collection('communities').add(community);
      
      // Add creator as first member
      await db.collection('communityMembers').add({
        communityId: communityRef.id,
        userId: context.auth.uid,
        role: 'admin',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        permissions: ['read', 'write', 'moderate', 'admin']
      });

      return { id: communityRef.id, ...community };
    } catch (error) {
      console.error('Error creating community:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create community');
    }
  }),

  joinCommunity: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { communityId } = data;

    try {
      // Check if user is already a member
      const existingMember = await db.collection('communityMembers')
        .where('communityId', '==', communityId)
        .where('userId', '==', context.auth.uid)
        .get();

      if (!existingMember.empty) {
        throw new functions.https.HttpsError('already-exists', 'Already a member of this community');
      }

      // Add user as member
      await db.collection('communityMembers').add({
        communityId,
        userId: context.auth.uid,
        role: 'member',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        permissions: ['read', 'write']
      });

      // Update community member count
      await db.collection('communities').doc(communityId).update({
        memberCount: admin.firestore.FieldValue.increment(1)
      });

      // Award XP for joining community
      await awardUserXP(context.auth.uid, 10, 'Joined community');

      return { success: true };
    } catch (error) {
      console.error('Error joining community:', error);
      throw new functions.https.HttpsError('internal', 'Failed to join community');
    }
  }),

  createDiscussion: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { communityId, title, content, category, isPinned } = data;

    try {
      // Verify user is a member
      const membership = await db.collection('communityMembers')
        .where('communityId', '==', communityId)
        .where('userId', '==', context.auth.uid)
        .get();

      if (membership.empty) {
        throw new functions.https.HttpsError('permission-denied', 'Must be a community member');
      }

      const discussion = {
        communityId,
        title,
        content,
        category: category || 'general',
        authorId: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        commentCount: 0,
        viewCount: 0,
        likes: 0,
        dislikes: 0,
        isPinned: isPinned || false,
        isLocked: false,
        tags: []
      };

      const discussionRef = await db.collection('discussions').add(discussion);

      // Update community post count
      await db.collection('communities').doc(communityId).update({
        postCount: admin.firestore.FieldValue.increment(1)
      });

      // Award XP for creating discussion
      await awardUserXP(context.auth.uid, 15, 'Created discussion');

      return { id: discussionRef.id, ...discussion };
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create discussion');
    }
  }),

  addComment: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { discussionId, content, parentCommentId } = data;

    try {
      const comment = {
        discussionId,
        content,
        authorId: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        dislikes: 0,
        parentCommentId: parentCommentId || null,
        isEdited: false,
        isDeleted: false
      };

      const commentRef = await db.collection('discussionComments').add(comment);

      // Update discussion comment count
      await db.collection('discussions').doc(discussionId).update({
        commentCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Award XP for commenting
      await awardUserXP(context.auth.uid, 5, 'Added comment');

      return { id: commentRef.id, ...comment };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new functions.https.HttpsError('internal', 'Failed to add comment');
    }
  }),

  voteOnComment: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { commentId, voteType } = data; // voteType: 'like' or 'dislike'

    try {
      const voteRef = db.collection('commentVotes').doc(`${commentId}_${context.auth.uid}`);
      const existingVote = await voteRef.get();

      const batch = db.batch();

      if (existingVote.exists) {
        const currentVote = existingVote.data()?.voteType;
        
        if (currentVote === voteType) {
          // Remove vote
          batch.delete(voteRef);
          
          const updateField = voteType === 'like' ? 'likes' : 'dislikes';
          batch.update(db.collection('discussionComments').doc(commentId), {
            [updateField]: admin.firestore.FieldValue.increment(-1)
          });
        } else {
          // Change vote
          batch.set(voteRef, {
            commentId,
            userId: context.auth.uid,
            voteType,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const incrementField = voteType === 'like' ? 'likes' : 'dislikes';
          const decrementField = voteType === 'like' ? 'dislikes' : 'likes';
          
          batch.update(db.collection('discussionComments').doc(commentId), {
            [incrementField]: admin.firestore.FieldValue.increment(1),
            [decrementField]: admin.firestore.FieldValue.increment(-1)
          });
        }
      } else {
        // New vote
        batch.set(voteRef, {
          commentId,
          userId: context.auth.uid,
          voteType,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const updateField = voteType === 'like' ? 'likes' : 'dislikes';
        batch.update(db.collection('discussionComments').doc(commentId), {
          [updateField]: admin.firestore.FieldValue.increment(1)
        });
      }

      await batch.commit();

      // Award XP for voting
      await awardUserXP(context.auth.uid, 1, 'Voted on comment');

      return { success: true };
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw new functions.https.HttpsError('internal', 'Failed to vote on comment');
    }
  }),

  moderateContent: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { contentId, contentType, action, reason } = data;

    try {
      // Verify user has moderation permissions
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();

      if (!userData?.roles?.includes('moderator') && !userData?.roles?.includes('admin')) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
      }

      const moderationAction = {
        contentId,
        contentType,
        action, // 'approve', 'reject', 'delete', 'flag'
        reason,
        moderatorId: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('moderationActions').add(moderationAction);

      // Apply the moderation action
      const contentCollection = contentType === 'discussion' ? 'discussions' : 'discussionComments';
      const updateData: any = { moderatedAt: admin.firestore.FieldValue.serverTimestamp() };

      if (action === 'delete') {
        updateData.isDeleted = true;
      } else if (action === 'flag') {
        updateData.isFlagged = true;
      }

      await db.collection(contentCollection).doc(contentId).update(updateData);

      return { success: true };
    } catch (error) {
      console.error('Error moderating content:', error);
      throw new functions.https.HttpsError('internal', 'Failed to moderate content');
    }
  }),

  updateCommunityStats: functions.firestore.document('discussions/{discussionId}').onCreate(async (snap, context) => {
    const discussionData = snap.data();
    
    try {
      // Update community stats
      await db.collection('communityStats').doc(discussionData.communityId).set({
        totalDiscussions: admin.firestore.FieldValue.increment(1),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        activeUsers: admin.firestore.FieldValue.arrayUnion(discussionData.authorId)
      }, { merge: true });
    } catch (error) {
      console.error('Error updating community stats:', error);
    }
  })
};

// Helper function to award XP
async function awardUserXP(userId: string, amount: number, reason: string): Promise<void> {
  try {
    await db.collection('userXP').doc(userId).set({
      totalXP: admin.firestore.FieldValue.increment(amount),
      xpHistory: admin.firestore.FieldValue.arrayUnion({
        id: admin.firestore.FieldValue.serverTimestamp().toString(),
        amount,
        reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }, { merge: true });
  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}