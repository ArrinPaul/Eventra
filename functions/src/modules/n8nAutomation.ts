import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  triggers: string[];
  description?: string;
}

interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'running' | 'success' | 'error';
  startedAt: Date;
  finishedAt?: Date;
  data?: any;
  error?: string;
}

export const n8nAutomationFunctions = {
  // Initialize n8n webhook endpoints
  setupN8nWebhooks: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const webhookEndpoints = [
        {
          event: 'user_registered',
          url: process.env.N8N_BASE_URL + '/webhook/user-registration',
          workflowName: 'User Registration Automation'
        },
        {
          event: 'event_created',
          url: process.env.N8N_BASE_URL + '/webhook/event-created',
          workflowName: 'Event Creation Automation'
        },
        {
          event: 'ticket_purchased',
          url: process.env.N8N_BASE_URL + '/webhook/ticket-purchase',
          workflowName: 'Ticket Purchase Automation'
        },
        {
          event: 'feedback_submitted',
          url: process.env.N8N_BASE_URL + '/webhook/feedback-submitted',
          workflowName: 'Feedback Processing Automation'
        },
        {
          event: 'session_completed',
          url: process.env.N8N_BASE_URL + '/webhook/session-completed',
          workflowName: 'Session Completion Automation'
        }
      ];

      // Store webhook configurations
      const batch = db.batch();
      webhookEndpoints.forEach(endpoint => {
        const webhookRef = db.collection('n8nWebhooks').doc(endpoint.event);
        batch.set(webhookRef, {
          event: endpoint.event,
          url: endpoint.url,
          workflowName: endpoint.workflowName,
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: context.auth.uid
        });
      });

      await batch.commit();
      return { webhooks: webhookEndpoints };
    } catch (error) {
      console.error('Error setting up n8n webhooks:', error);
      throw new functions.https.HttpsError('internal', 'Failed to setup n8n webhooks');
    }
  }),

  // Trigger n8n workflow
  triggerWorkflow: functions.https.onCall(async (data: any, context: any) => {
    const { workflowEvent, payload, userId } = data;

    try {
      // Get webhook configuration
      const webhookDoc = await db.collection('n8nWebhooks').doc(workflowEvent).get();
      
      if (!webhookDoc.exists || !webhookDoc.data()?.active) {
        console.log(`No active webhook found for event: ${workflowEvent}`);
        return { success: false, message: 'Webhook not configured or inactive' };
      }

      const webhookConfig = webhookDoc.data();
      const n8nUrl = webhookConfig?.url;

      if (!n8nUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Webhook URL not configured');
      }

      // Prepare payload for n8n
      const n8nPayload = {
        event: workflowEvent,
        timestamp: new Date().toISOString(),
        userId: userId || context.auth?.uid,
        data: payload,
        source: 'vibeathon-platform'
      };

      // Execute workflow
      const response = await axios.post(n8nUrl, n8nPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': process.env.N8N_API_KEY
        },
        timeout: 30000
      });

      // Log execution
      const executionRef = await db.collection('workflowExecutions').add({
        workflowEvent,
        executionId: response.data.executionId || `exec_${Date.now()}`,
        status: 'success',
        payload: n8nPayload,
        response: response.data,
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId || context.auth?.uid
      });

      return {
        success: true,
        executionId: executionRef.id,
        workflowResponse: response.data
      };

    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
      
      // Log failed execution
      await db.collection('workflowExecutions').add({
        workflowEvent,
        status: 'error',
        error: error.message,
        payload: data.payload,
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId || context.auth?.uid
      });

      throw new functions.https.HttpsError('internal', 'Failed to execute workflow');
    }
  }),

  // Get workflow execution status
  getWorkflowExecutions: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { workflowEvent, limit = 50, userId } = data;

    try {
      let query = db.collection('workflowExecutions')
        .orderBy('executedAt', 'desc')
        .limit(limit);

      if (workflowEvent) {
        query = query.where('workflowEvent', '==', workflowEvent);
      }

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const executions = await query.get();
      
      const results = executions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        executedAt: doc.data().executedAt?.toDate().toISOString()
      }));

      return { executions: results };
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch executions');
    }
  }),

  // Manage workflow configurations
  manageWorkflowConfig: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin/organizer
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !['organizer', 'admin'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    const { action, workflowEvent, config } = data;

    try {
      switch (action) {
        case 'enable':
          await db.collection('n8nWebhooks').doc(workflowEvent).update({
            active: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
          });
          break;

        case 'disable':
          await db.collection('n8nWebhooks').doc(workflowEvent).update({
            active: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
          });
          break;

        case 'update':
          await db.collection('n8nWebhooks').doc(workflowEvent).update({
            ...config,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
          });
          break;

        default:
          throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
      }

      return { success: true };
    } catch (error) {
      console.error('Error managing workflow config:', error);
      throw new functions.https.HttpsError('internal', 'Failed to manage workflow config');
    }
  }),

  // Handle n8n webhook responses (for status updates)
  handleN8nCallback: functions.https.onRequest(async (req: any, res: any) => {
    try {
      // Verify webhook signature if needed
      const signature = req.headers['x-n8n-signature'];
      if (!verifyN8nSignature(req.body, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { executionId, status, data, error } = req.body;

      // Update execution status
      const executionQuery = await db.collection('workflowExecutions')
        .where('executionId', '==', executionId)
        .limit(1)
        .get();

      if (!executionQuery.empty) {
        const executionDoc = executionQuery.docs[0];
        await executionDoc.ref.update({
          status,
          finishedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: data,
          error: error || null
        });

        // Process specific workflow results
        await processWorkflowResult(executionDoc.data(), { status, data, error });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling n8n callback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }),

  // Scheduled workflow monitoring
  monitorWorkflows: functions.pubsub.schedule('*/15 * * * *').onRun(async (context: any) => {
    console.log('Monitoring n8n workflows...');

    try {
      // Check for stuck executions (running for more than 30 minutes)
      const stuckExecutions = await db.collection('workflowExecutions')
        .where('status', '==', 'running')
        .where('executedAt', '<', new Date(Date.now() - 30 * 60 * 1000))
        .get();

      const batch = db.batch();
      stuckExecutions.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'timeout',
          error: 'Execution timeout after 30 minutes',
          finishedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      if (!batch._writes.length) {
        await batch.commit();
        console.log(`Marked ${stuckExecutions.size} executions as timeout`);
      }

      // Generate workflow statistics
      await generateWorkflowStats();

    } catch (error) {
      console.error('Error monitoring workflows:', error);
    }
  })
};

// Helper functions
function verifyN8nSignature(payload: any, signature: string): boolean {
  // Implement signature verification for n8n webhooks
  // For now, return true if signature exists
  return !!signature;
}

async function processWorkflowResult(executionData: any, result: any): Promise<void> {
  const { workflowEvent, userId } = executionData;

  try {
    switch (workflowEvent) {
      case 'user_registered':
        if (result.status === 'success' && result.data?.welcomeEmailSent) {
          await db.collection('users').doc(userId).update({
            welcomeEmailSent: true,
            welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;

      case 'event_created':
        if (result.status === 'success' && result.data?.promotionCampaignId) {
          await db.collection('events').doc(result.data.eventId).update({
            promotionCampaignId: result.data.promotionCampaignId,
            automationProcessed: true
          });
        }
        break;

      case 'feedback_submitted':
        if (result.status === 'success' && result.data?.aiAnalysisComplete) {
          await db.collection('feedback').doc(result.data.feedbackId).update({
            aiProcessed: true,
            sentiment: result.data.sentiment,
            categories: result.data.categories
          });
        }
        break;

      default:
        console.log(`No specific processing for workflow: ${workflowEvent}`);
    }
  } catch (error) {
    console.error('Error processing workflow result:', error);
  }
}

async function generateWorkflowStats(): Promise<void> {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const executions = await db.collection('workflowExecutions')
      .where('executedAt', '>=', last24Hours)
      .get();

    const stats: {
      total: number;
      success: number;
      error: number;
      timeout: number;
      byWorkflow: Record<string, { total: number; success: number; error: number; timeout: number }>;
    } = {
      total: executions.size,
      success: 0,
      error: 0,
      timeout: 0,
      byWorkflow: {}
    };

    executions.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status as 'success' | 'error' | 'timeout';
      if (status in stats && status !== 'total' && status !== 'byWorkflow') {
        stats[status]++;
      }
      
      if (!stats.byWorkflow[data.workflowEvent]) {
        stats.byWorkflow[data.workflowEvent] = { total: 0, success: 0, error: 0, timeout: 0 };
      }
      stats.byWorkflow[data.workflowEvent].total++;
      if (status in stats.byWorkflow[data.workflowEvent]) {
        stats.byWorkflow[data.workflowEvent][status]++;
      }
    });

    // Store stats
    await db.collection('workflowStats').doc('daily').set({
      date: now.toISOString().split('T')[0],
      stats,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error generating workflow stats:', error);
  }
}