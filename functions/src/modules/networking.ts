import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Send connection request
export const sendConnectionRequest = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { toUserId, message } = data;
  const fromUserId = context.auth.uid;

  if (!toUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'toUserId is required');
  }

  if (fromUserId === toUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot send connection request to yourself');
  }

  try {
    // Check if connection already exists
    const existingConnection = await db.collection('connections')
      .where('users', 'array-contains-any', [fromUserId, toUserId])
      .get();

    if (!existingConnection.empty) {
      throw new functions.https.HttpsError('already-exists', 'Connection already exists');
    }

    // Check if request already sent
    const existingRequest = await db.collection('connectionRequests')
      .where('fromUserId', '==', fromUserId)
      .where('toUserId', '==', toUserId)
      .where('status', '==', 'pending')
      .get();

    if (!existingRequest.empty) {
      throw new functions.https.HttpsError('already-exists', 'Connection request already sent');
    }

    // Create connection request
    const requestRef = await db.collection('connectionRequests').add({
      fromUserId,
      toUserId,
      message: message || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to target user
    await db.collection('notifications').add({
      userId: toUserId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Someone wants to connect with you',
      data: {
        requestId: requestRef.id,
        fromUserId
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, requestId: requestRef.id };
  } catch (error) {
    console.error('Error sending connection request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send connection request');
  }
});

// Accept connection request
export const acceptConnectionRequest = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { requestId } = data;
  const userId = context.auth.uid;

  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
  }

  try {
    const requestDoc = await db.collection('connectionRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Connection request not found');
    }

    const requestData = requestDoc.data();
    
    if (requestData?.toUserId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized to accept this request');
    }

    if (requestData?.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is no longer pending');
    }

    const batch = db.batch();

    // Update request status
    batch.update(requestDoc.ref, {
      status: 'accepted',
      respondedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create connection
    const connectionRef = db.collection('connections').doc();
    batch.set(connectionRef, {
      users: [requestData.fromUserId, requestData.toUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'mutual'
    });

    // Update user connection counts
    const fromUserRef = db.collection('users').doc(requestData.fromUserId);
    const toUserRef = db.collection('users').doc(requestData.toUserId);
    
    batch.update(fromUserRef, {
      connectionCount: admin.firestore.FieldValue.increment(1),
      connections: admin.firestore.FieldValue.arrayUnion(requestData.toUserId)
    });
    
    batch.update(toUserRef, {
      connectionCount: admin.firestore.FieldValue.increment(1),
      connections: admin.firestore.FieldValue.arrayUnion(requestData.fromUserId)
    });

    // Create notification for requester
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      userId: requestData.fromUserId,
      type: 'connection_accepted',
      title: 'Connection Request Accepted',
      message: 'Your connection request was accepted',
      data: {
        connectionId: connectionRef.id,
        userId: requestData.toUserId
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Award XP for making a connection
    await awardConnectionXP(requestData.fromUserId);
    await awardConnectionXP(requestData.toUserId);

    return { success: true, connectionId: connectionRef.id };
  } catch (error) {
    console.error('Error accepting connection request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to accept connection request');
  }
});

// Update networking stats
export const updateNetworkingStats = functions.firestore
  .document('connections/{connectionId}')
  .onCreate(async (snap, context) => {
    const connectionData = snap.data();
    
    try {
      // Update global networking stats
      await db.collection('globalStats').doc('networking').update({
        totalConnections: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Track networking event in analytics
      await db.collection('analytics').add({
        userId: connectionData.users[0],
        eventType: 'connection_made',
        eventData: {
          connectionId: context.params.connectionId,
          connectedUserId: connectionData.users[1]
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating networking stats:', error);
    }
  });

// Generate skill recommendations
export const generateSkillRecommendations = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user's current skills and interests
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userSkills = userData.skills || [];
    const userInterests = userData.interests || [];

    // Get connections' skills to find trending skills
    const connectionsSnapshot = await db.collection('users')
      .where('id', 'in', userData.connections || [])
      .get();

    const connectionSkills: string[] = [];
    connectionsSnapshot.docs.forEach(doc => {
      const connData = doc.data();
      if (connData.skills) {
        connectionSkills.push(...connData.skills);
      }
    });

    // Find most common skills among connections that user doesn't have
    const skillFrequency = connectionSkills.reduce((acc: any, skill: string) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    const recommendedSkills = Object.entries(skillFrequency)
      .filter(([skill]) => !userSkills.includes(skill))
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, popularity: count }));

    // Get trending skills from event topics
    const recentEvents = await db.collection('events')
      .where('startDate', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .get();

    const eventSkills: string[] = [];
    recentEvents.docs.forEach(doc => {
      const eventData = doc.data();
      if (eventData.tags) {
        eventSkills.push(...eventData.tags);
      }
    });

    const trendingSkills = Object.entries(
      eventSkills.reduce((acc: any, skill: string) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {})
    )
      .filter(([skill]) => !userSkills.includes(skill))
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, trend: count }));

    return {
      recommendedSkills,
      trendingSkills,
      basedOn: {
        connections: connectionsSnapshot.size,
        recentEvents: recentEvents.size
      }
    };
  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate recommendations');
  }
});

// Process networking notifications
export const processNetworkingNotifications = functions.firestore
  .document('connectionRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed from pending to accepted
    if (before.status === 'pending' && after.status === 'accepted') {
      try {
        // Send push notification if user has FCM token
        const userDoc = await db.collection('users').doc(after.fromUserId).get();
        const userData = userDoc.data();

        if (userData?.fcmToken) {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: 'Connection Accepted! 🎉',
              body: 'Your connection request was accepted'
            },
            data: {
              type: 'connection_accepted',
              userId: after.toUserId
            }
          });
        }
      } catch (error) {
        console.error('Error sending networking notification:', error);
      }
    }
  });

// Award XP for making connections
async function awardConnectionXP(userId: string): Promise<void> {
  try {
    const xpAmount = 50; // Base XP for making a connection
    
    await db.collection('xpTransactions').add({
      userId,
      amount: xpAmount,
      reason: 'Made a new connection',
      category: 'networking',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's total XP
    await db.collection('users').doc(userId).update({
      totalXP: admin.firestore.FieldValue.increment(xpAmount),
      points: admin.firestore.FieldValue.increment(xpAmount)
    });

  } catch (error) {
    console.error('Error awarding connection XP:', error);
  }
}

// Find mutual connections
export const findMutualConnections = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { targetUserId } = data;
  const currentUserId = context.auth.uid;

  if (!targetUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required');
  }

  try {
    // Get current user's connections
    const currentUserDoc = await db.collection('users').doc(currentUserId).get();
    const currentUserConnections = currentUserDoc.data()?.connections || [];

    // Get target user's connections
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    const targetUserConnections = targetUserDoc.data()?.connections || [];

    // Find mutual connections
    const mutualConnections = currentUserConnections.filter((conn: string) => 
      targetUserConnections.includes(conn)
    );

    // Get mutual connection user data
    const mutualConnectionsData = [];
    if (mutualConnections.length > 0) {
      const mutualUsersSnapshot = await db.collection('users')
        .where('id', 'in', mutualConnections.slice(0, 10)) // Limit to 10
        .get();
      
      mutualConnectionsData.push(
        ...mutualUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          role: doc.data().role,
          company: doc.data().company,
          avatar: doc.data().avatar
        }))
      );
    }

    return {
      mutualConnectionsCount: mutualConnections.length,
      mutualConnections: mutualConnectionsData
    };
  } catch (error) {
    console.error('Error finding mutual connections:', error);
    throw new functions.https.HttpsError('internal', 'Failed to find mutual connections');
  }
});

// Get networking suggestions
export const getNetworkingSuggestions = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;
  const { limit = 10 } = data;

  try {
    // Get current user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userConnections = userData.connections || [];
    const userSkills = userData.skills || [];
    const userInterests = userData.interests || [];

    // Get potential connections (users not already connected)
    const usersSnapshot = await db.collection('users')
      .limit(limit * 3) // Get more than needed to filter
      .get();

    const suggestions = [];
    
    for (const doc of usersSnapshot.docs) {
      const potentialConnection = doc.data();
      
      // Skip if already connected or same user
      if (userConnections.includes(doc.id) || doc.id === userId) {
        continue;
      }

      // Calculate compatibility score
      let score = 0;
      let reasons = [];

      // Skill overlap
      const skillOverlap = (potentialConnection.skills || []).filter((skill: string) => 
        userSkills.includes(skill)
      );
      if (skillOverlap.length > 0) {
        score += skillOverlap.length * 10;
        reasons.push(`${skillOverlap.length} shared skills`);
      }

      // Interest overlap
      const interestOverlap = (potentialConnection.interests || []).filter((interest: string) => 
        userInterests.includes(interest)
      );
      if (interestOverlap.length > 0) {
        score += interestOverlap.length * 5;
        reasons.push(`${interestOverlap.length} shared interests`);
      }

      // Same role bonus
      if (potentialConnection.role === userData.role) {
        score += 15;
        reasons.push('Same role');
      }

      // Same company bonus
      if (potentialConnection.company === userData.company && userData.company) {
        score += 20;
        reasons.push('Same company');
      }

      if (score > 0) {
        suggestions.push({
          user: {
            id: doc.id,
            name: potentialConnection.name,
            role: potentialConnection.role,
            company: potentialConnection.company,
            skills: potentialConnection.skills?.slice(0, 3) || [],
            avatar: potentialConnection.avatar
          },
          compatibilityScore: score,
          reasons
        });
      }
    }

    // Sort by compatibility score and limit results
    suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return {
      suggestions: suggestions.slice(0, limit)
    };
  } catch (error) {
    console.error('Error getting networking suggestions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get networking suggestions');
  }
});

export const networkingFunctions = {
  sendConnectionRequest,
  acceptConnectionRequest,
  updateNetworkingStats,
  generateSkillRecommendations,
  processNetworkingNotifications,
  findMutualConnections,
  getNetworkingSuggestions
};