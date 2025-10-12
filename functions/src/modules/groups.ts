import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Create a new recurring group
export const createGroup = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const {
    name,
    description,
    category,
    schedule,
    location,
    maxMembers,
    isPrivate,
    tags,
    coverImage
  } = data;

  const userId = context.auth.uid;

  // Validation
  if (!name || name.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Group name is required');
  }

  if (!schedule || !schedule.frequency) {
    throw new functions.https.HttpsError('invalid-argument', 'Schedule is required');
  }

  try {
    const groupRef = await db.collection('recurringGroups').add({
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'General',
      organizerId: userId,
      members: [userId],
      schedule,
      location: location || { type: 'virtual' },
      maxMembers: maxMembers || 20,
      isPrivate: isPrivate || false,
      tags: tags || [],
      coverImage: coverImage || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      upcomingMeetings: [],
      pastMeetings: []
    });

    // Update user's group count
    await db.collection('users').doc(userId).update({
      groupsOrganized: admin.firestore.FieldValue.increment(1),
      points: admin.firestore.FieldValue.increment(25) // Award points for creating group
    });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'group_created',
      eventData: {
        groupId: groupRef.id,
        category,
        isPrivate,
        maxMembers
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, groupId: groupRef.id };
  } catch (error) {
    console.error('Error creating group:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create group');
  }
});

// Join a group
export const joinGroup = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { groupId } = data;
  const userId = context.auth.uid;

  if (!groupId) {
    throw new functions.https.HttpsError('invalid-argument', 'groupId is required');
  }

  try {
    const groupRef = db.collection('recurringGroups').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Group not found');
    }

    const groupData = groupDoc.data();

    // Check if user is already a member
    if (groupData?.members?.includes(userId)) {
      throw new functions.https.HttpsError('already-exists', 'Already a member of this group');
    }

    // Check if group is full
    if (groupData?.members?.length >= groupData?.maxMembers) {
      throw new functions.https.HttpsError('failed-precondition', 'Group is full');
    }

    // Check if group is private (would need invitation system)
    if (groupData?.isPrivate) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot join private group without invitation');
    }

    // Add user to group
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(userId)
    });

    // Update user's groups
    await db.collection('users').doc(userId).update({
      groupsJoined: admin.firestore.FieldValue.increment(1),
      points: admin.firestore.FieldValue.increment(10) // Award points for joining
    });

    // Send notification to group organizer
    if (groupData?.organizerId !== userId) {
      await db.collection('notifications').add({
        userId: groupData.organizerId,
        type: 'group_member_joined',
        title: 'New member joined your group',
        message: `Someone joined ${groupData.name}`,
        data: {
          groupId,
          newMemberId: userId
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'group_joined',
      eventData: {
        groupId,
        organizerId: groupData?.organizerId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error joining group:', error);
    throw new functions.https.HttpsError('internal', 'Failed to join group');
  }
});

// Create a group event/meeting
export const createGroupEvent = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const {
    groupId,
    title,
    description,
    startDate,
    endDate,
    location,
    agenda,
    recurring
  } = data;

  const userId = context.auth.uid;

  if (!groupId || !title || !startDate) {
    throw new functions.https.HttpsError('invalid-argument', 'groupId, title, and startDate are required');
  }

  try {
    // Verify user is organizer or member
    const groupDoc = await db.collection('recurringGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Group not found');
    }

    const groupData = groupDoc.data();
    
    if (groupData?.organizerId !== userId && !groupData?.members?.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'Must be group organizer or member');
    }

    // Create the meeting
    const meetingRef = await db.collection('groupMeetings').add({
      groupId,
      title: title.trim(),
      description: description?.trim() || '',
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
      location: location || groupData?.location,
      agenda: agenda || '',
      attendees: [],
      status: 'scheduled',
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      recurring: recurring || false
    });

    // Update group with upcoming meeting
    await db.collection('recurringGroups').doc(groupId).update({
      upcomingMeetings: admin.firestore.FieldValue.arrayUnion({
        id: meetingRef.id,
        title,
        date: admin.firestore.Timestamp.fromDate(new Date(startDate))
      })
    });

    // Send notifications to all group members
    const members = groupData?.members || [];
    const batch = db.batch();

    members.forEach((memberId: string) => {
      if (memberId !== userId) { // Don't notify the creator
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: memberId,
          type: 'group_meeting_scheduled',
          title: 'New meeting scheduled',
          message: `A new meeting has been scheduled for ${groupData.name}`,
          data: {
            groupId,
            meetingId: meetingRef.id,
            meetingTitle: title,
            startDate
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    await batch.commit();

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'group_meeting_created',
      eventData: {
        groupId,
        meetingId: meetingRef.id,
        memberCount: members.length
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, meetingId: meetingRef.id };
  } catch (error) {
    console.error('Error creating group event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create group event');
  }
});

// Update group membership (leave group)
export const updateGroupMembership = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { groupId, action, targetUserId } = data;
  const userId = context.auth.uid;

  if (!groupId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'groupId and action are required');
  }

  try {
    const groupRef = db.collection('recurringGroups').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Group not found');
    }

    const groupData = groupDoc.data();

    switch (action) {
      case 'leave':
        // User leaving the group
        if (!groupData?.members?.includes(userId)) {
          throw new functions.https.HttpsError('failed-precondition', 'Not a member of this group');
        }

        // Don't allow organizer to leave (they should transfer ownership first)
        if (groupData?.organizerId === userId) {
          throw new functions.https.HttpsError('failed-precondition', 'Organizer cannot leave group without transferring ownership');
        }

        await groupRef.update({
          members: admin.firestore.FieldValue.arrayRemove(userId)
        });

        // Update user stats
        await db.collection('users').doc(userId).update({
          groupsJoined: admin.firestore.FieldValue.increment(-1)
        });

        break;

      case 'remove':
        // Organizer removing a member
        if (groupData?.organizerId !== userId) {
          throw new functions.https.HttpsError('permission-denied', 'Only organizer can remove members');
        }

        if (!targetUserId) {
          throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required for remove action');
        }

        if (!groupData?.members?.includes(targetUserId)) {
          throw new functions.https.HttpsError('failed-precondition', 'User is not a member of this group');
        }

        await groupRef.update({
          members: admin.firestore.FieldValue.arrayRemove(targetUserId)
        });

        // Notify removed user
        await db.collection('notifications').add({
          userId: targetUserId,
          type: 'group_removed',
          title: 'Removed from group',
          message: `You have been removed from ${groupData.name}`,
          data: { groupId },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: `group_${action}`,
      eventData: {
        groupId,
        targetUserId: targetUserId || null
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating group membership:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update group membership');
  }
});

// Process group notifications (for meetings, etc.)
export const processGroupNotifications = functions.pubsub
  .schedule('0 9 * * *') // Daily at 9 AM
  .onRun(async (context) => {
    try {
      // Get meetings happening today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysMeetings = await db.collection('groupMeetings')
        .where('startDate', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('startDate', '<', admin.firestore.Timestamp.fromDate(tomorrow))
        .where('status', '==', 'scheduled')
        .get();

      const batch = db.batch();

      for (const meetingDoc of todaysMeetings.docs) {
        const meeting = meetingDoc.data();
        
        // Get group data to find members
        const groupDoc = await db.collection('recurringGroups').doc(meeting.groupId).get();
        const groupData = groupDoc.data();

        if (groupData?.members) {
          groupData.members.forEach((memberId: string) => {
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
              userId: memberId,
              type: 'group_meeting_reminder',
              title: 'Meeting today!',
              message: `${meeting.title} is scheduled for today`,
              data: {
                groupId: meeting.groupId,
                meetingId: meetingDoc.id,
                groupName: groupData.name,
                meetingTitle: meeting.title,
                startDate: meeting.startDate
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
        }
      }

      await batch.commit();
      console.log(`Processed ${todaysMeetings.size} meeting reminders`);
    } catch (error) {
      console.error('Error processing group notifications:', error);
    }
  });

// RSVP to group meeting
export const rsvpGroupMeeting = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { meetingId, status } = data;
  const userId = context.auth.uid;

  if (!meetingId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'meetingId and status are required');
  }

  if (!['going', 'maybe', 'not-going'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
  }

  try {
    const meetingRef = db.collection('groupMeetings').doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Meeting not found');
    }

    const meetingData = meetingDoc.data();

    // Verify user is group member
    const groupDoc = await db.collection('recurringGroups').doc(meetingData?.groupId).get();
    const groupData = groupDoc.data();

    if (!groupData?.members?.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'Must be group member to RSVP');
    }

    // Update or create RSVP
    const rsvpRef = db.collection('meetingRSVPs').doc(`${meetingId}_${userId}`);
    
    await rsvpRef.set({
      meetingId,
      userId,
      groupId: meetingData?.groupId,
      status,
      respondedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'meeting_rsvp',
      eventData: {
        meetingId,
        groupId: meetingData?.groupId,
        status
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error RSVPing to meeting:', error);
    throw new functions.https.HttpsError('internal', 'Failed to RSVP');
  }
});

// Create group discussion
export const createGroupDiscussion = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { groupId, title, description, tags } = data;
  const userId = context.auth.uid;

  if (!groupId || !title) {
    throw new functions.https.HttpsError('invalid-argument', 'groupId and title are required');
  }

  try {
    // Verify user is group member
    const groupDoc = await db.collection('recurringGroups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Group not found');
    }

    const groupData = groupDoc.data();
    
    if (!groupData?.members?.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'Must be group member to create discussion');
    }

    // Create discussion
    const discussionRef = await db.collection('groupDiscussions').add({
      groupId,
      title: title.trim(),
      description: description?.trim() || '',
      authorId: userId,
      messages: [],
      tags: tags || [],
      isPinned: false,
      isLocked: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Award points for creating discussion
    await db.collection('users').doc(userId).update({
      points: admin.firestore.FieldValue.increment(15)
    });

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'group_discussion_created',
      eventData: {
        groupId,
        discussionId: discussionRef.id
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, discussionId: discussionRef.id };
  } catch (error) {
    console.error('Error creating group discussion:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create discussion');
  }
});

export const groupsFunctions = {
  createGroup,
  joinGroup,
  createGroupEvent,
  updateGroupMembership,
  processGroupNotifications,
  rsvpGroupMeeting,
  createGroupDiscussion
};