import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const chatFunctions = {
  createChatRoom: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { name, description, isPrivate, eventId } = data;

    const chatRoom = {
      name,
      description,
      isPrivate: isPrivate || false,
      eventId: eventId || null,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      memberCount: 1,
      messageCount: 0,
      isActive: true
    };

    const roomRef = await db.collection('chatRooms').add(chatRoom);
    
    // Add creator as member
    await db.collection('chatRoomMembers').add({
      roomId: roomRef.id,
      userId: context.auth.uid,
      role: 'admin',
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { id: roomRef.id, ...chatRoom };
  }),

  sendMessage: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { roomId, content, type, attachments } = data;

    const message = {
      roomId,
      senderId: context.auth.uid,
      content,
      type: type || 'text',
      attachments: attachments || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      editedAt: null,
      isDeleted: false,
      reactions: []
    };

    const messageRef = await db.collection('chatMessages').add(message);
    
    // Update room message count
    await db.collection('chatRooms').doc(roomId).update({
      messageCount: admin.firestore.FieldValue.increment(1),
      lastMessage: {
        content: content.substring(0, 100),
        senderId: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    return { id: messageRef.id, ...message };
  }),

  joinChatRoom: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { roomId } = data;

    await db.collection('chatRoomMembers').add({
      roomId,
      userId: context.auth.uid,
      role: 'member',
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('chatRooms').doc(roomId).update({
      memberCount: admin.firestore.FieldValue.increment(1)
    });

    return { success: true };
  }),

  sendDirectMessage: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { recipientId, content, type } = data;
    
    const conversationId = [context.auth.uid, recipientId].sort().join('_');
    
    const message = {
      conversationId,
      senderId: context.auth.uid,
      recipientId,
      content,
      type: type || 'text',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false
    };

    const messageRef = await db.collection('directMessages').add(message);
    
    // Update conversation
    await db.collection('conversations').doc(conversationId).set({
      participants: [context.auth.uid, recipientId],
      lastMessage: {
        content: content.substring(0, 100),
        senderId: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { id: messageRef.id, ...message };
  }),

  updateChatRoomActivity: functions.firestore.document('chatMessages/{messageId}').onCreate(async (snap, context) => {
    const messageData = snap.data();
    
    await db.collection('chatRoomActivity').doc(messageData.roomId).set({
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      activeUsers: admin.firestore.FieldValue.arrayUnion(messageData.senderId)
    }, { merge: true });
  }),

  processMessageNotifications: functions.firestore.document('directMessages/{messageId}').onCreate(async (snap, context) => {
    const messageData = snap.data();
    
    // Send push notification to recipient
    try {
      const recipientDoc = await db.collection('users').doc(messageData.recipientId).get();
      const recipientData = recipientDoc.data();
      
      if (recipientData?.fcmToken) {
        await admin.messaging().send({
          token: recipientData.fcmToken,
          notification: {
            title: 'New Message',
            body: messageData.content.substring(0, 100)
          },
          data: {
            type: 'direct_message',
            senderId: messageData.senderId,
            conversationId: messageData.conversationId
          }
        });
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  })
};