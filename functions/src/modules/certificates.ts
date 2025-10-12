import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface CertificateTemplate {
  id: string;
  name: string;
  category: 'attendance' | 'completion' | 'achievement' | 'speaker' | 'organizer';
  template: string; // HTML template
  fields: string[]; // Dynamic fields like {name}, {event}, {date}
  design: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    logoUrl?: string;
    backgroundImageUrl?: string;
  };
  createdBy: string;
  createdAt: Date;
  active: boolean;
}

interface Certificate {
  id: string;
  templateId: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  eventId?: string;
  sessionId?: string;
  certificateData: any;
  generatedAt: Date;
  downloadUrl: string;
  emailSent: boolean;
  verificationCode: string;
}

export const certificatesFunctions = {
  // Create certificate template
  createCertificateTemplate: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is organizer or admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !['organizer', 'admin'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    const { name, category, template, fields, design } = data;

    try {
      const templateRef = await db.collection('certificateTemplates').add({
        name,
        category,
        template,
        fields: fields || [],
        design: design || {
          backgroundColor: '#ffffff',
          textColor: '#333333',
          accentColor: '#007bff'
        },
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true,
        usageCount: 0
      });

      return { templateId: templateRef.id };

    } catch (error) {
      console.error('Error creating certificate template:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create certificate template');
    }
  }),

  // Generate certificate for user
  generateCertificate: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { 
      templateId, 
      recipientId, 
      eventId, 
      sessionId, 
      customData = {} 
    } = data;

    try {
      // Get template
      const templateDoc = await db.collection('certificateTemplates').doc(templateId).get();
      if (!templateDoc.exists || !templateDoc.data()?.active) {
        throw new functions.https.HttpsError('not-found', 'Certificate template not found or inactive');
      }

      // Get recipient data
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      if (!recipientDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Recipient not found');
      }

      const templateData = templateDoc.data();
      const recipientData = recipientDoc.data();

      // Check if certificate already exists
      const existingCert = await db.collection('certificates')
        .where('templateId', '==', templateId)
        .where('recipientId', '==', recipientId)
        .where('eventId', '==', eventId || null)
        .where('sessionId', '==', sessionId || null)
        .limit(1)
        .get();

      if (!existingCert.empty) {
        return { 
          certificateId: existingCert.docs[0].id,
          exists: true,
          downloadUrl: existingCert.docs[0].data().downloadUrl
        };
      }

      // Prepare certificate data
      const certificateData = await prepareCertificateData({
        templateData,
        recipientData,
        eventId,
        sessionId,
        customData
      });

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Create certificate HTML
      const certificateHtml = await generateCertificateHTML(templateData, certificateData);

      // Generate PDF
      const pdfBuffer = await generateCertificatePDF(certificateHtml);

      // Upload to Firebase Storage
      const fileName = `certificates/${recipientId}/${Date.now()}_${templateId}.pdf`;
      const downloadUrl = await uploadCertificatePDF(pdfBuffer, fileName);

      // Save certificate record
      const certificateRef = await db.collection('certificates').add({
        templateId,
        recipientId,
        recipientEmail: recipientData?.email,
        recipientName: recipientData?.name,
        eventId: eventId || null,
        sessionId: sessionId || null,
        certificateData,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        downloadUrl,
        emailSent: false,
        verificationCode,
        fileName
      });

      // Update template usage count
      await templateDoc.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1)
      });

      // Send certificate via email
      await sendCertificateEmail(recipientData?.email, certificateData, downloadUrl, verificationCode);

      // Update certificate as email sent
      await certificateRef.update({ emailSent: true });

      return {
        certificateId: certificateRef.id,
        downloadUrl,
        verificationCode,
        emailSent: true
      };

    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate certificate');
    }
  }),

  // Bulk generate certificates
  bulkGenerateCertificates: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { templateId, recipients, eventId, sessionId } = data;

    try {
      // Check permissions
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();
      
      if (!userData || !['organizer', 'admin', 'speaker'].includes(userData.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
      }

      const results = [];
      
      // Process in batches to avoid timeouts
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipientId: string) => {
          try {
            const result = await certificatesFunctions.generateCertificate({
              templateId,
              recipientId,
              eventId,
              sessionId
            }, context);
            
            return { recipientId, success: true, ...result };
          } catch (error) {
            console.error(`Error generating certificate for ${recipientId}:`, error);
            return { recipientId, success: false, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return {
        total: recipients.length,
        successful: successCount,
        failed: errorCount,
        results
      };

    } catch (error) {
      console.error('Error in bulk certificate generation:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate certificates');
    }
  }),

  // Get user certificates
  getUserCertificates: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, limit = 20 } = data;
    const targetUserId = userId || context.auth.uid;

    // Check if requesting own certificates or has admin permissions
    if (targetUserId !== context.auth.uid) {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();
      
      if (!userData || !['organizer', 'admin'].includes(userData.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
      }
    }

    try {
      const certificates = await db.collection('certificates')
        .where('recipientId', '==', targetUserId)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();

      const certificateList = await Promise.all(
        certificates.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get event details if available
          let eventDetails = null;
          if (data.eventId) {
            const eventDoc = await db.collection('events').doc(data.eventId).get();
            if (eventDoc.exists) {
              eventDetails = {
                id: data.eventId,
                title: eventDoc.data()?.title,
                date: eventDoc.data()?.startDate
              };
            }
          }

          return {
            id: doc.id,
            templateId: data.templateId,
            eventDetails,
            generatedAt: data.generatedAt?.toDate().toISOString(),
            downloadUrl: data.downloadUrl,
            verificationCode: data.verificationCode,
            certificateData: data.certificateData
          };
        })
      );

      return { certificates: certificateList };

    } catch (error) {
      console.error('Error fetching user certificates:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch certificates');
    }
  }),

  // Verify certificate
  verifyCertificate: functions.https.onCall(async (data: any) => {
    const { verificationCode } = data;

    if (!verificationCode) {
      throw new functions.https.HttpsError('invalid-argument', 'Verification code required');
    }

    try {
      const certificateQuery = await db.collection('certificates')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();

      if (certificateQuery.empty) {
        return { valid: false, message: 'Certificate not found' };
      }

      const certificateDoc = certificateQuery.docs[0];
      const certificateData = certificateDoc.data();

      // Get event details if available
      let eventDetails = null;
      if (certificateData.eventId) {
        const eventDoc = await db.collection('events').doc(certificateData.eventId).get();
        if (eventDoc.exists) {
          eventDetails = {
            title: eventDoc.data()?.title,
            date: eventDoc.data()?.startDate?.toDate().toISOString(),
            organizer: eventDoc.data()?.organizer
          };
        }
      }

      return {
        valid: true,
        certificate: {
          recipientName: certificateData.recipientName,
          generatedAt: certificateData.generatedAt?.toDate().toISOString(),
          eventDetails,
          certificateData: certificateData.certificateData
        }
      };

    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw new functions.https.HttpsError('internal', 'Failed to verify certificate');
    }
  }),

  // Get certificate templates
  getCertificateTemplates: functions.https.onCall(async (data: any, context: any) => {
    const { category, active = true } = data;

    try {
      let query = db.collection('certificateTemplates')
        .where('active', '==', active)
        .orderBy('createdAt', 'desc');

      if (category) {
        query = query.where('category', '==', category);
      }

      const templates = await query.get();

      const templateList = templates.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        design: doc.data().design,
        fields: doc.data().fields,
        usageCount: doc.data().usageCount || 0,
        createdAt: doc.data().createdAt?.toDate().toISOString()
      }));

      return { templates: templateList };

    } catch (error) {
      console.error('Error fetching certificate templates:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch templates');
    }
  }),

  // Auto-generate certificates on event completion
  onEventCompleted: functions.firestore
    .document('events/{eventId}')
    .onUpdate(async (change: any, context: any) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const eventId = context.params.eventId;

      // Check if event status changed to completed
      if (beforeData.status !== 'completed' && afterData.status === 'completed') {
        console.log(`Event ${eventId} completed, generating certificates...`);

        try {
          // Get attendance certificate template
          const templateQuery = await db.collection('certificateTemplates')
            .where('category', '==', 'attendance')
            .where('active', '==', true)
            .limit(1)
            .get();

          if (templateQuery.empty) {
            console.log('No attendance certificate template found');
            return;
          }

          const templateId = templateQuery.docs[0].id;

          // Get all attendees who checked in
          const attendeesQuery = await db.collection('eventRegistrations')
            .where('eventId', '==', eventId)
            .where('checkedIn', '==', true)
            .get();

          if (attendeesQuery.empty) {
            console.log('No attendees found for certificate generation');
            return;
          }

          // Generate certificates for all attendees
          const attendeeIds = attendeesQuery.docs.map(doc => doc.data().userId);

          // Process in smaller batches to avoid function timeout
          const batchSize = 5;
          for (let i = 0; i < attendeeIds.length; i += batchSize) {
            const batch = attendeeIds.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (recipientId: string) => {
              try {
                await generateCertificateForUser(templateId, recipientId, eventId);
              } catch (error) {
                console.error(`Error generating certificate for user ${recipientId}:`, error);
              }
            });

            await Promise.all(batchPromises);
          }

          console.log(`Generated certificates for ${attendeeIds.length} attendees`);

        } catch (error) {
          console.error('Error in auto-certificate generation:', error);
        }
      }
    })
};

// Helper functions
async function prepareCertificateData(params: any): Promise<any> {
  const { templateData, recipientData, eventId, sessionId, customData } = params;

  const certificateData: any = {
    recipientName: recipientData.name,
    generatedDate: new Date().toLocaleDateString(),
    ...customData
  };

  // Add event data if available
  if (eventId) {
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (eventDoc.exists) {
      const eventData = eventDoc.data();
      certificateData.eventTitle = eventData?.title;
      certificateData.eventDate = eventData?.startDate?.toDate().toLocaleDateString();
      certificateData.eventOrganizer = eventData?.organizer;
    }
  }

  // Add session data if available
  if (sessionId) {
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (sessionDoc.exists) {
      const sessionData = sessionDoc.data();
      certificateData.sessionTitle = sessionData?.title;
      certificateData.sessionSpeaker = sessionData?.speaker;
    }
  }

  return certificateData;
}

async function generateCertificateHTML(templateData: any, certificateData: any): Promise<string> {
  let html = templateData.template || getDefaultTemplate(templateData.category);

  // Replace template variables
  Object.keys(certificateData).forEach(key => {
    const placeholder = `{${key}}`;
    html = html.replace(new RegExp(placeholder, 'g'), certificateData[key] || '');
  });

  // Apply design settings
  html = html.replace('{backgroundColor}', templateData.design?.backgroundColor || '#ffffff');
  html = html.replace('{textColor}', templateData.design?.textColor || '#333333');
  html = html.replace('{accentColor}', templateData.design?.accentColor || '#007bff');
  
  if (templateData.design?.logoUrl) {
    html = html.replace('{logoUrl}', templateData.design.logoUrl);
  }

  return html;
}

async function generateCertificatePDF(html: string): Promise<Buffer> {
  const puppeteer = require('puppeteer');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    printBackground: true
  });
  
  await browser.close();
  return pdfBuffer;
}

async function uploadCertificatePDF(pdfBuffer: Buffer, fileName: string): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        generatedAt: new Date().toISOString()
      }
    }
  });

  // Get signed URL for download (valid for 1 year)
  const [downloadUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000
  });

  return downloadUrl;
}

function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

async function sendCertificateEmail(email: string, certificateData: any, downloadUrl: string, verificationCode: string): Promise<void> {
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
    subject: `🏆 Your Certificate - ${certificateData.eventTitle || 'Achievement'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Congratulations, ${certificateData.recipientName}!</h2>
        
        <p>We're excited to share your certificate for:</p>
        <h3 style="color: #007bff;">${certificateData.eventTitle || 'Your Achievement'}</h3>
        
        <p><strong>Certificate Details:</strong></p>
        <ul>
          <li>Recipient: ${certificateData.recipientName}</li>
          <li>Date: ${certificateData.generatedDate}</li>
          <li>Verification Code: <code>${verificationCode}</code></li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            📥 Download Certificate
          </a>
        </div>
        
        <p><small>
          You can verify this certificate at our verification portal using the code above.
          This certificate download link is valid for one year.
        </small></p>
        
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

function getDefaultTemplate(category: string): string {
  const templates = {
    attendance: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Georgia', serif; 
              background-color: {backgroundColor}; 
              color: {textColor}; 
              margin: 0; 
              padding: 40px;
              text-align: center;
            }
            .certificate {
              border: 8px solid {accentColor};
              padding: 60px;
              max-width: 800px;
              margin: 0 auto;
              background: linear-gradient(45deg, #f8f9fa, #ffffff);
            }
            h1 { font-size: 48px; margin-bottom: 20px; color: {accentColor}; }
            h2 { font-size: 32px; margin: 30px 0; }
            .recipient { font-size: 36px; font-weight: bold; color: {accentColor}; margin: 30px 0; }
            .event { font-size: 24px; font-style: italic; margin: 20px 0; }
            .date { font-size: 18px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>🏆 CERTIFICATE OF ATTENDANCE</h1>
            <p>This is to certify that</p>
            <div class="recipient">{recipientName}</div>
            <p>has successfully attended</p>
            <div class="event">{eventTitle}</div>
            <p>organized by {eventOrganizer}</p>
            <div class="date">Date: {eventDate}</div>
            <div class="date">Issued: {generatedDate}</div>
          </div>
        </body>
      </html>
    `,
    completion: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Georgia', serif; 
              background-color: {backgroundColor}; 
              color: {textColor}; 
              margin: 0; 
              padding: 40px;
              text-align: center;
            }
            .certificate {
              border: 8px solid {accentColor};
              padding: 60px;
              max-width: 800px;
              margin: 0 auto;
              background: linear-gradient(45deg, #f8f9fa, #ffffff);
            }
            h1 { font-size: 48px; margin-bottom: 20px; color: {accentColor}; }
            .recipient { font-size: 36px; font-weight: bold; color: {accentColor}; margin: 30px 0; }
            .achievement { font-size: 24px; font-style: italic; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>🎓 CERTIFICATE OF COMPLETION</h1>
            <p>This is to certify that</p>
            <div class="recipient">{recipientName}</div>
            <p>has successfully completed</p>
            <div class="achievement">{eventTitle}</div>
            <div class="date">Completed: {generatedDate}</div>
          </div>
        </body>
      </html>
    `
  };

  return templates[category as keyof typeof templates] || templates.attendance;
}

async function generateCertificateForUser(templateId: string, recipientId: string, eventId: string): Promise<void> {
  // This is a simplified version for automated certificate generation
  const templateDoc = await db.collection('certificateTemplates').doc(templateId).get();
  if (!templateDoc.exists) return;

  const recipientDoc = await db.collection('users').doc(recipientId).get();
  if (!recipientDoc.exists) return;

  const templateData = templateDoc.data();
  const recipientData = recipientDoc.data();

  const certificateData = await prepareCertificateData({
    templateData,
    recipientData,
    eventId,
    sessionId: null,
    customData: {}
  });

  const verificationCode = generateVerificationCode();
  const certificateHtml = await generateCertificateHTML(templateData, certificateData);
  const pdfBuffer = await generateCertificatePDF(certificateHtml);
  const fileName = `certificates/${recipientId}/${Date.now()}_${templateId}.pdf`;
  const downloadUrl = await uploadCertificatePDF(pdfBuffer, fileName);

  await db.collection('certificates').add({
    templateId,
    recipientId,
    recipientEmail: recipientData?.email,
    recipientName: recipientData?.name,
    eventId,
    sessionId: null,
    certificateData,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    downloadUrl,
    emailSent: false,
    verificationCode,
    fileName
  });

  // Send email
  if (recipientData?.email) {
    await sendCertificateEmail(recipientData.email, certificateData, downloadUrl, verificationCode);
    
    // Update email sent status
    const certQuery = await db.collection('certificates')
      .where('verificationCode', '==', verificationCode)
      .limit(1)
      .get();
    
    if (!certQuery.empty) {
      await certQuery.docs[0].ref.update({ emailSent: true });
    }
  }
}