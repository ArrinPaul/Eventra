import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const db = admin.firestore();

interface RegistrationData {
  eventId: string;
  userId: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    organization?: string;
    jobTitle?: string;
  };
  roleSpecific: any;
  preferences: {
    dietary?: string[];
    accessibility?: string[];
    networking?: boolean;
    notifications?: boolean;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export const userManagementFunctions = {
  // Enhanced registration with role-specific fields
  registerForEvent: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const registrationData: RegistrationData = data;

    try {
      // Validate event exists and is open for registration
      const eventDoc = await db.collection('events').doc(registrationData.eventId).get();
      
      if (!eventDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Event not found');
      }

      const eventData = eventDoc.data();
      
      if (eventData?.registrationDeadline && new Date() > eventData.registrationDeadline.toDate()) {
        throw new functions.https.HttpsError('failed-precondition', 'Registration deadline has passed');
      }

      if (eventData?.maxAttendees && eventData?.currentAttendees >= eventData?.maxAttendees) {
        throw new functions.https.HttpsError('failed-precondition', 'Event is full');
      }

      // Check if user is already registered
      const existingRegistration = await db.collection('eventRegistrations')
        .where('eventId', '==', registrationData.eventId)
        .where('userId', '==', context.auth.uid)
        .limit(1)
        .get();

      if (!existingRegistration.empty) {
        throw new functions.https.HttpsError('already-exists', 'User is already registered for this event');
      }

      // Generate QR code
      const qrCodeId = uuidv4();
      const qrCodeData = {
        eventId: registrationData.eventId,
        userId: context.auth.uid,
        registrationId: qrCodeId,
        timestamp: Date.now()
      };

      const qrCodeString = JSON.stringify(qrCodeData);
      const qrCodeImageUrl = await QRCode.toDataURL(qrCodeString);

      // Create registration record
      const registrationRef = await db.collection('eventRegistrations').add({
        ...registrationData,
        userId: context.auth.uid,
        registrationId: qrCodeId,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'confirmed',
        checkedIn: false,
        checkInTime: null,
        qrCodeData: qrCodeString,
        qrCodeImageUrl,
        paymentStatus: 'pending', // Handle payment if needed
        notifications: {
          confirmationSent: false,
          reminderSent: false,
          followUpSent: false
        }
      });

      // Update event attendee count
      await eventDoc.ref.update({
        currentAttendees: admin.firestore.FieldValue.increment(1)
      });

      // Send confirmation email
      await sendRegistrationConfirmation({
        email: registrationData.personalInfo.email,
        name: registrationData.personalInfo.name,
        eventTitle: eventData?.title,
        eventDate: eventData?.startDate,
        qrCodeImageUrl,
        registrationId: qrCodeId
      });

      // Send WhatsApp notification if phone provided
      if (registrationData.personalInfo.phone) {
        await sendWhatsAppNotification({
          phone: registrationData.personalInfo.phone,
          message: `Hi ${registrationData.personalInfo.name}! You're registered for ${eventData?.title}. Check your email for details.`,
          type: 'registration_confirmation'
        });
      }

      // Update registration status
      await registrationRef.update({
        'notifications.confirmationSent': true
      });

      // Trigger n8n workflow for registration automation
      await triggerRegistrationWorkflow({
        eventId: registrationData.eventId,
        userId: context.auth.uid,
        registrationId: registrationRef.id,
        userRole: registrationData.roleSpecific?.role || 'attendee'
      });

      return {
        registrationId: registrationRef.id,
        qrCodeId,
        qrCodeImageUrl,
        status: 'confirmed',
        message: 'Registration successful! Check your email and phone for confirmation.'
      };

    } catch (error) {
      console.error('Error during registration:', error);
      throw new functions.https.HttpsError('internal', 'Registration failed');
    }
  }),

  // QR Code check-in
  checkInWithQR: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { qrCodeData, scannerLocation, eventStaffId } = data;

    try {
      // Parse QR code data
      const qrData = JSON.parse(qrCodeData);
      const { eventId, userId, registrationId } = qrData;

      // Find registration
      const registrationQuery = await db.collection('eventRegistrations')
        .where('registrationId', '==', registrationId)
        .where('eventId', '==', eventId)
        .limit(1)
        .get();

      if (registrationQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'Registration not found');
      }

      const registrationDoc = registrationQuery.docs[0];
      const registrationData = registrationDoc.data();

      if (registrationData.checkedIn) {
        return {
          success: false,
          message: 'Already checked in',
          checkInTime: registrationData.checkInTime?.toDate().toISOString()
        };
      }

      // Update registration with check-in info
      await registrationDoc.ref.update({
        checkedIn: true,
        checkInTime: admin.firestore.FieldValue.serverTimestamp(),
        checkInLocation: scannerLocation,
        checkInBy: eventStaffId || context.auth.uid
      });

      // Create check-in record for analytics
      await db.collection('checkInLogs').add({
        eventId,
        userId,
        registrationId,
        checkInTime: admin.firestore.FieldValue.serverTimestamp(),
        scannerLocation,
        scannedBy: eventStaffId || context.auth.uid,
        method: 'qr_code'
      });

      // Award gamification points
      await awardCheckInPoints(userId, eventId);

      // Send welcome notification
      if (registrationData.personalInfo?.phone) {
        await sendWhatsAppNotification({
          phone: registrationData.personalInfo.phone,
          message: `Welcome to the event! You've successfully checked in. Enjoy the sessions!`,
          type: 'check_in_welcome'
        });
      }

      return {
        success: true,
        message: 'Check-in successful',
        attendeeName: registrationData.personalInfo?.name,
        checkInTime: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error during check-in:', error);
      throw new functions.https.HttpsError('internal', 'Check-in failed');
    }
  }),

  // Update registration details
  updateRegistration: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { registrationId, updates } = data;

    try {
      const registrationDoc = await db.collection('eventRegistrations').doc(registrationId).get();
      
      if (!registrationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Registration not found');
      }

      const registrationData = registrationDoc.data();
      
      // Check if user owns this registration or is admin
      if (registrationData?.userId !== context.auth.uid) {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        
        if (!userData || !['admin', 'organizer'].includes(userData.role)) {
          throw new functions.https.HttpsError('permission-denied', 'Access denied');
        }
      }

      // Update registration
      await registrationDoc.ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
      });

      return { success: true, message: 'Registration updated successfully' };

    } catch (error) {
      console.error('Error updating registration:', error);
      throw new functions.https.HttpsError('internal', 'Update failed');
    }
  }),

  // Get user registrations
  getUserRegistrations: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, status, limit = 20 } = data;
    const targetUserId = userId || context.auth.uid;

    try {
      // Check permissions for viewing other user's registrations
      if (targetUserId !== context.auth.uid) {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        
        if (!userData || !['admin', 'organizer'].includes(userData.role)) {
          throw new functions.https.HttpsError('permission-denied', 'Access denied');
        }
      }

      let query = db.collection('eventRegistrations')
        .where('userId', '==', targetUserId)
        .orderBy('registeredAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      const registrations = await query.get();

      const registrationList = await Promise.all(
        registrations.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get event details
          const eventDoc = await db.collection('events').doc(data.eventId).get();
          const eventData = eventDoc.data();

          return {
            id: doc.id,
            eventId: data.eventId,
            eventTitle: eventData?.title,
            eventDate: eventData?.startDate?.toDate().toISOString(),
            status: data.status,
            registeredAt: data.registeredAt?.toDate().toISOString(),
            checkedIn: data.checkedIn,
            qrCodeImageUrl: data.qrCodeImageUrl,
            registrationId: data.registrationId
          };
        })
      );

      return { registrations: registrationList };

    } catch (error) {
      console.error('Error fetching registrations:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch registrations');
    }
  }),

  // Cancel registration
  cancelRegistration: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { registrationId, reason } = data;

    try {
      const registrationDoc = await db.collection('eventRegistrations').doc(registrationId).get();
      
      if (!registrationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Registration not found');
      }

      const registrationData = registrationDoc.data();
      
      // Check ownership
      if (registrationData?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
      }

      if (registrationData?.status === 'cancelled') {
        throw new functions.https.HttpsError('failed-precondition', 'Registration already cancelled');
      }

      // Update registration status
      await registrationDoc.ref.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason,
        cancelledBy: context.auth.uid
      });

      // Update event attendee count
      await db.collection('events').doc(registrationData.eventId).update({
        currentAttendees: admin.firestore.FieldValue.increment(-1)
      });

      // Send cancellation confirmation
      if (registrationData.personalInfo?.email) {
        await sendCancellationEmail({
          email: registrationData.personalInfo.email,
          name: registrationData.personalInfo.name,
          eventTitle: 'Event', // Get from event doc if needed
          registrationId
        });
      }

      return { success: true, message: 'Registration cancelled successfully' };

    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw new functions.https.HttpsError('internal', 'Cancellation failed');
    }
  }),

  // Send event reminders
  sendEventReminders: functions.pubsub.schedule('0 9 * * *').onRun(async (context: any) => {
    console.log('Sending event reminders...');

    try {
      // Find events starting tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingEvents = await db.collection('events')
        .where('startDate', '>=', tomorrow)
        .where('startDate', '<', dayAfterTomorrow)
        .get();

      for (const eventDoc of upcomingEvents.docs) {
        const eventData = eventDoc.data();
        
        // Get all confirmed registrations for this event
        const registrations = await db.collection('eventRegistrations')
          .where('eventId', '==', eventDoc.id)
          .where('status', '==', 'confirmed')
          .where('notifications.reminderSent', '==', false)
          .get();

        // Send reminders
        const batch = db.batch();
        
        for (const regDoc of registrations.docs) {
          const regData = regDoc.data();
          
          // Send email reminder
          await sendEventReminder({
            email: regData.personalInfo.email,
            name: regData.personalInfo.name,
            eventTitle: eventData.title,
            eventDate: eventData.startDate,
            eventLocation: eventData.location,
            qrCodeImageUrl: regData.qrCodeImageUrl
          });

          // Send WhatsApp reminder if phone available
          if (regData.personalInfo.phone) {
            await sendWhatsAppNotification({
              phone: regData.personalInfo.phone,
              message: `Reminder: ${eventData.title} starts tomorrow! Don't forget to bring your QR code.`,
              type: 'event_reminder'
            });
          }

          // Mark reminder as sent
          batch.update(regDoc.ref, {
            'notifications.reminderSent': true,
            'notifications.reminderSentAt': admin.firestore.FieldValue.serverTimestamp()
          });
        }

        await batch.commit();
        console.log(`Sent ${registrations.size} reminders for event: ${eventData.title}`);
      }

    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  })
};

// Helper functions
async function sendRegistrationConfirmation(params: any): Promise<void> {
  const { email, name, eventTitle, eventDate, qrCodeImageUrl, registrationId } = params;
  
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🎉 Registration Confirmed - ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Registration Confirmed! 🎉</h2>
        
        <p>Hi ${name},</p>
        
        <p>Great news! Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate?.toDate().toLocaleDateString()}</p>
          <p><strong>Registration ID:</strong> ${registrationId}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <h3>Your QR Code:</h3>
          <img src="${qrCodeImageUrl}" alt="QR Code" style="max-width: 200px;">
          <p><small>Please bring this QR code for check-in</small></p>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Important:</strong></p>
          <ul>
            <li>Save this QR code to your phone</li>
            <li>Arrive 15 minutes early for check-in</li>
            <li>Bring a valid ID</li>
          </ul>
        </div>
        
        <p>We're excited to see you at the event!</p>
        
        <hr>
        <p><small>
          Best regards,<br>
          The Vibeathon Team<br>
          <a href="mailto:support@vibeathon.com">support@vibeathon.com</a>
        </small></p>
      </div>
    `,
    attachments: [{
      filename: 'qr-code.png',
      content: qrCodeImageUrl.split('base64,')[1],
      encoding: 'base64'
    }]
  };

  await transporter.sendMail(mailOptions);
}

async function sendWhatsAppNotification(params: any): Promise<void> {
  const { phone, message, type } = params;
  
  // Using Twilio for WhatsApp (requires setup)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.log('Twilio credentials not configured, skipping WhatsApp notification');
    return;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_FROM,
      to: 'whatsapp:' + phone
    });

    console.log(`WhatsApp ${type} sent to ${phone}`);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}

async function triggerRegistrationWorkflow(params: any): Promise<void> {
  try {
    // Get n8n webhook for registration workflow
    const webhookDoc = await db.collection('n8nWebhooks').doc('user_registered').get();
    
    if (webhookDoc.exists && webhookDoc.data()?.active) {
      const webhookUrl = webhookDoc.data()?.url;
      
      const axios = require('axios');
      await axios.post(webhookUrl, {
        event: 'user_registered',
        data: params,
        timestamp: new Date().toISOString()
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    }
  } catch (error) {
    console.error('Error triggering registration workflow:', error);
  }
}

async function awardCheckInPoints(userId: string, eventId: string): Promise<void> {
  try {
    // Award XP points for checking in
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      await userDoc.ref.update({
        'gamification.xp': admin.firestore.FieldValue.increment(10),
        'gamification.checkInCount': admin.firestore.FieldValue.increment(1)
      });

      // Create XP transaction log
      await db.collection('xpTransactions').add({
        userId,
        eventId,
        action: 'event_check_in',
        points: 10,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error awarding check-in points:', error);
  }
}

async function sendEventReminder(params: any): Promise<void> {
  const { email, name, eventTitle, eventDate, eventLocation, qrCodeImageUrl } = params;
  
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `⏰ Event Reminder - ${eventTitle} Tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Don't Forget! Event Tomorrow ⏰</h2>
        
        <p>Hi ${name},</p>
        
        <p>This is a friendly reminder that <strong>${eventTitle}</strong> is starting tomorrow!</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📅 Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate?.toDate().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${eventDate?.toDate().toLocaleTimeString()}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrCodeImageUrl}" alt="QR Code" style="max-width: 200px;">
          <p><strong>Your Check-in QR Code</strong></p>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>📝 Checklist for Tomorrow:</strong></p>
          <ul>
            <li>✅ Save your QR code to phone</li>
            <li>✅ Plan to arrive 15 minutes early</li>
            <li>✅ Bring valid ID</li>
            <li>✅ Check parking/transportation</li>
          </ul>
        </div>
        
        <p>Looking forward to seeing you there! 🚀</p>
        
        <hr>
        <p><small>
          Best regards,<br>
          The Vibeathon Team
        </small></p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendCancellationEmail(params: any): Promise<void> {
  const { email, name, eventTitle, registrationId } = params;
  
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Registration Cancelled - ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Registration Cancelled</h2>
        
        <p>Hi ${name},</p>
        
        <p>Your registration for <strong>${eventTitle}</strong> has been cancelled as requested.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Registration ID:</strong> ${registrationId}</p>
          <p><strong>Cancelled on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>If this was done in error, please contact our support team.</p>
        
        <hr>
        <p><small>
          Best regards,<br>
          The Vibeathon Team<br>
          <a href="mailto:support@vibeathon.com">support@vibeathon.com</a>
        </small></p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}