import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const ticketingFunctions = {
  createTicketedEvent: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { eventData, ticketTypes } = data;

    const eventTicketing = {
      ...eventData,
      organizerId: context.auth.uid,
      ticketTypes,
      totalCapacity: ticketTypes.reduce((sum: number, tt: any) => sum + tt.capacity, 0),
      soldTickets: 0,
      revenue: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    const eventRef = await db.collection('ticketedEvents').add(eventTicketing);
    return { id: eventRef.id, ...eventTicketing };
  }),

  purchaseTicket: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { eventId, ticketTypeId, quantity, paymentData } = data;

    // Simulate payment processing
    const ticket = {
      eventId,
      ticketTypeId,
      userId: context.auth.uid,
      quantity,
      purchasePrice: paymentData.amount,
      status: 'confirmed',
      qrCode: generateQRCode(),
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      checkInTime: null
    };

    const ticketRef = await db.collection('eventTickets').add(ticket);
    
    // Update event sold tickets
    await db.collection('ticketedEvents').doc(eventId).update({
      soldTickets: admin.firestore.FieldValue.increment(quantity),
      revenue: admin.firestore.FieldValue.increment(paymentData.amount)
    });

    return { id: ticketRef.id, ...ticket };
  }),

  validateTicket: functions.https.onCall(async (data: any, context: any) => {
    const { qrCode } = data;
    
    const ticketQuery = await db.collection('eventTickets').where('qrCode', '==', qrCode).get();
    
    if (ticketQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Ticket not found');
    }

    const ticketDoc = ticketQuery.docs[0];
    const ticketData = ticketDoc.data();

    return {
      isValid: ticketData.status === 'confirmed' && !ticketData.checkInTime,
      ticket: ticketData
    };
  }),

  checkInAttendee: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { qrCode } = data;
    
    const ticketQuery = await db.collection('eventTickets').where('qrCode', '==', qrCode).get();
    
    if (ticketQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Ticket not found');
    }

    const ticketDoc = ticketQuery.docs[0];
    
    await ticketDoc.ref.update({
      checkInTime: admin.firestore.FieldValue.serverTimestamp(),
      checkedInBy: context.auth.uid
    });

    return { success: true, checkedIn: true };
  }),

  processRefund: functions.https.onCall(async (data: any, context: any) => {
    // Implement refund logic
    return { success: true };
  }),

  sendTicketReminders: functions.pubsub.schedule('0 9 * * *').onRun(async () => {
    // Send reminder emails for upcoming events
    return null;
  }),

  updateEventCapacity: functions.firestore.document('eventTickets/{ticketId}').onCreate(async (snap: any) => {
    const ticketData = snap.data();
    
    await db.collection('eventCapacity').doc(ticketData.eventId).set({
      soldTickets: admin.firestore.FieldValue.increment(ticketData.quantity),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  })
};

function generateQRCode(): string {
  return `QR_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}