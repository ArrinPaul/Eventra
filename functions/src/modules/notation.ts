import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const notationFunctions = {
  // Create a new notation document
  createNotation: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { eventId, sessionId, title, content, isPublic = false, tags = [] } = data;

    try {
      const notationRef = await db.collection('notations').add({
        userId: context.auth.uid,
        eventId,
        sessionId,
        title,
        content,
        isPublic,
        tags,
        collaborators: [context.auth.uid],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        version: 1,
        lastEditBy: context.auth.uid
      });

      // Create initial version in history
      await db.collection('notations').doc(notationRef.id).collection('history').add({
        content,
        version: 1,
        editedBy: context.auth.uid,
        editedAt: admin.firestore.FieldValue.serverTimestamp(),
        changeType: 'created'
      });

      return { notationId: notationRef.id };
    } catch (error) {
      console.error('Error creating notation:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create notation');
    }
  }),

  // Update notation content
  updateNotation: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { notationId, content, title } = data;

    try {
      const notationRef = db.collection('notations').doc(notationId);
      const notation = await notationRef.get();

      if (!notation.exists) {
        throw new functions.https.HttpsError('not-found', 'Notation not found');
      }

      const notationData = notation.data();
      
      // Check if user has permission to edit
      if (!notationData?.collaborators.includes(context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'User not authorized to edit this notation');
      }

      const newVersion = (notationData?.version || 0) + 1;

      // Update notation
      await notationRef.update({
        content,
        title: title || notationData?.title,
        version: newVersion,
        lastEditBy: context.auth.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add to version history
      await notationRef.collection('history').add({
        content,
        version: newVersion,
        editedBy: context.auth.uid,
        editedAt: admin.firestore.FieldValue.serverTimestamp(),
        changeType: 'updated'
      });

      return { success: true, version: newVersion };
    } catch (error) {
      console.error('Error updating notation:', error);
      throw new functions.https.HttpsError('internal', 'Failed to update notation');
    }
  }),

  // Share notation with collaborators
  shareNotation: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { notationId, collaboratorEmails, permission = 'edit' } = data;

    try {
      const notationRef = db.collection('notations').doc(notationId);
      const notation = await notationRef.get();

      if (!notation.exists) {
        throw new functions.https.HttpsError('not-found', 'Notation not found');
      }

      const notationData = notation.data();

      // Check if user owns the notation
      if (notationData?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only owner can share notation');
      }

      // Find users by email
      const batch = db.batch();
      const collaboratorIds = [];

      for (const email of collaboratorEmails) {
        const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          collaboratorIds.push(userId);

          // Create collaboration record
          const collaborationRef = db.collection('notations').doc(notationId).collection('collaborations').doc(userId);
          batch.set(collaborationRef, {
            userId,
            email,
            permission,
            invitedAt: admin.firestore.FieldValue.serverTimestamp(),
            invitedBy: context.auth.uid,
            status: 'active'
          });
        }
      }

      // Update notation with new collaborators
      const currentCollaborators = notationData?.collaborators || [];
      const updatedCollaborators = [...new Set([...currentCollaborators, ...collaboratorIds])];

      batch.update(notationRef, {
        collaborators: updatedCollaborators,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      return { success: true, newCollaborators: collaboratorIds.length };
    } catch (error) {
      console.error('Error sharing notation:', error);
      throw new functions.https.HttpsError('internal', 'Failed to share notation');
    }
  }),

  // Generate AI summary of notation
  generateAISummary: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { notationId } = data;

    try {
      const notationRef = db.collection('notations').doc(notationId);
      const notation = await notationRef.get();

      if (!notation.exists) {
        throw new functions.https.HttpsError('not-found', 'Notation not found');
      }

      const notationData = notation.data();

      // Check if user has access
      if (!notationData?.collaborators.includes(context.auth.uid) && !notationData?.isPublic) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
      }

      // Generate AI summary (integrate with existing AI flows)
      const aiSummary = await generateNotationSummary(notationData?.content || '');
      const aiTags = await generateNotationTags(notationData?.content || '');

      // Update notation with AI-generated content
      await notationRef.update({
        aiSummary,
        aiTags,
        aiProcessedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { summary: aiSummary, tags: aiTags };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate AI summary');
    }
  }),

  // Export notation as PDF
  exportNotationToPDF: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { notationId, format = 'pdf' } = data;

    try {
      const notationRef = db.collection('notations').doc(notationId);
      const notation = await notationRef.get();

      if (!notation.exists) {
        throw new functions.https.HttpsError('not-found', 'Notation not found');
      }

      const notationData = notation.data();

      // Check permissions
      if (!notationData?.collaborators.includes(context.auth.uid) && !notationData?.isPublic) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
      }

      // Generate PDF using puppeteer
      const pdfBuffer = await generateNotationPDF(notationData);

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `notations/${notationId}/export_${Date.now()}.${format}`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            notationId,
            exportedBy: context.auth.uid,
            exportedAt: new Date().toISOString()
          }
        }
      });

      // Get signed URL for download
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      return { downloadUrl, fileName };
    } catch (error) {
      console.error('Error exporting notation:', error);
      throw new functions.https.HttpsError('internal', 'Failed to export notation');
    }
  }),

  // Real-time collaboration trigger
  onNotationUpdated: functions.firestore
    .document('notations/{notationId}')
    .onUpdate(async (change: any, context: any) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const notationId = context.params.notationId;

      // Notify collaborators of changes
      if (beforeData.content !== afterData.content) {
        const collaborators = afterData.collaborators || [];
        
        for (const collaboratorId of collaborators) {
          if (collaboratorId !== afterData.lastEditBy) {
            // Send real-time notification
            await db.collection('users').doc(collaboratorId).collection('notifications').add({
              type: 'notation_updated',
              notationId,
              notationTitle: afterData.title,
              editedBy: afterData.lastEditBy,
              message: `Notation "${afterData.title}" was updated`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            });
          }
        }
      }
    })
};

// Helper functions
async function generateNotationSummary(content: string): Promise<string> {
  // Integrate with existing AI services or use OpenAI/Gemini
  // For now, return a simple summary
  const words = content.split(' ');
  if (words.length <= 50) return content;
  
  return words.slice(0, 50).join(' ') + '...';
}

async function generateNotationTags(content: string): Promise<string[]> {
  // Simple tag extraction - can be enhanced with AI
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being'];
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount = words.reduce((acc: any, word: string) => {
    if (!commonWords.includes(word) && word.length > 3) {
      acc[word] = (acc[word] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(wordCount)
    .sort(([,a]: any, [,b]: any) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([word]: any) => word);
}

async function generateNotationPDF(notationData: any): Promise<Buffer> {
  const puppeteer = require('puppeteer');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${notationData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
          .content { margin-top: 20px; }
          .tags { margin-top: 20px; }
          .tag { background: #f0f0f0; padding: 4px 8px; margin-right: 5px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>${notationData.title}</h1>
        <div class="meta">
          Created: ${notationData.createdAt?.toDate().toLocaleString()}<br>
          Last updated: ${notationData.updatedAt?.toDate().toLocaleString()}
        </div>
        <div class="content">${notationData.content}</div>
        ${notationData.tags?.length ? `
          <div class="tags">
            <strong>Tags:</strong>
            ${notationData.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
  });
  await browser.close();

  return pdfBuffer;
}