import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Track user events for analytics
export const trackUserEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventType, eventData, timestamp = new Date() } = data;
  
  try {
    // Store the event in analytics collection
    await db.collection('analytics').add({
      userId: context.auth.uid,
      eventType,
      eventData,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
      sessionId: eventData.sessionId || null,
      deviceInfo: eventData.deviceInfo || null,
      metadata: eventData.metadata || {}
    });

    // Update user activity summary
    await updateUserActivitySummary(context.auth.uid, eventType);

    // Update global engagement metrics
    await updateEngagementMetrics(eventType, eventData);

    return { success: true };
  } catch (error) {
    console.error('Error tracking user event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track event');
  }
});

// Update user activity summary
async function updateUserActivitySummary(userId: string, eventType: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const summaryRef = db.collection('userActivitySummary').doc(`${userId}_${today}`);
  
  const increment = admin.firestore.FieldValue.increment(1);
  
  await summaryRef.set({
    userId,
    date: today,
    [`events.${eventType}`]: increment,
    totalEvents: increment,
    lastActivity: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Update global engagement metrics
export const updateEngagementMetrics = functions.https.onCall(async (data) => {
  const { eventType, eventData } = data;
  
  try {
    const metricsRef = db.collection('engagementMetrics').doc('global');
    const increment = admin.firestore.FieldValue.increment(1);
    
    const updates: any = {
      [`events.${eventType}`]: increment,
      totalEvents: increment,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add specific metrics based on event type
    switch (eventType) {
      case 'user_login':
        updates.dailyActiveUsers = increment;
        break;
      case 'event_attend':
        updates.eventAttendance = increment;
        break;
      case 'connection_made':
        updates.connectionsMade = increment;
        break;
      case 'message_sent':
        updates.messagesSent = increment;
        break;
      case 'post_created':
        updates.postsCreated = increment;
        break;
    }

    await metricsRef.set(updates, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating engagement metrics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update metrics');
  }
});

// Generate analytics report
export const generateAnalyticsReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { reportType, startDate, endDate, filters = {} } = data;
  
  try {
    let query = db.collection('analytics');
    
    // Apply date filters
    if (startDate) {
      query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    // Apply additional filters
    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    if (filters.eventType) {
      query = query.where('eventType', '==', filters.eventType);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let report: any = {};

    switch (reportType) {
      case 'engagement':
        report = generateEngagementReport(events);
        break;
      case 'user_behavior':
        report = generateUserBehaviorReport(events);
        break;
      case 'event_analytics':
        report = generateEventAnalyticsReport(events);
        break;
      case 'conversion':
        report = generateConversionReport(events);
        break;
      default:
        report = generateGenericReport(events);
    }

    return { report, totalEvents: events.length };
  } catch (error) {
    console.error('Error generating analytics report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

// Generate engagement report
function generateEngagementReport(events: any[]): any {
  const eventsByType = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {});

  const eventsByDate = events.reduce((acc, event) => {
    const date = event.timestamp.toDate().toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const uniqueUsers = new Set(events.map(event => event.userId)).size;

  return {
    totalEvents: events.length,
    uniqueUsers,
    eventsByType,
    eventsByDate,
    avgEventsPerUser: events.length / uniqueUsers || 0
  };
}

// Generate user behavior report
function generateUserBehaviorReport(events: any[]): any {
  const userSessions = events.reduce((acc, event) => {
    const userId = event.userId;
    if (!acc[userId]) {
      acc[userId] = {
        totalEvents: 0,
        sessions: {},
        eventTypes: {}
      };
    }
    
    acc[userId].totalEvents++;
    acc[userId].eventTypes[event.eventType] = (acc[userId].eventTypes[event.eventType] || 0) + 1;
    
    if (event.sessionId) {
      if (!acc[userId].sessions[event.sessionId]) {
        acc[userId].sessions[event.sessionId] = [];
      }
      acc[userId].sessions[event.sessionId].push(event);
    }
    
    return acc;
  }, {});

  const sessionAnalysis = Object.values(userSessions).map((user: any) => {
    const sessionLengths = Object.values(user.sessions).map((session: any) => {
      if (session.length < 2) return 0;
      const start = Math.min(...session.map((e: any) => e.timestamp.toDate().getTime()));
      const end = Math.max(...session.map((e: any) => e.timestamp.toDate().getTime()));
      return (end - start) / 1000 / 60; // minutes
    });

    return {
      totalEvents: user.totalEvents,
      avgSessionLength: sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length || 0,
      topEventTypes: Object.entries(user.eventTypes)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
    };
  });

  return {
    totalUsers: Object.keys(userSessions).length,
    avgEventsPerUser: sessionAnalysis.reduce((acc, user) => acc + user.totalEvents, 0) / sessionAnalysis.length || 0,
    avgSessionLength: sessionAnalysis.reduce((acc, user) => acc + user.avgSessionLength, 0) / sessionAnalysis.length || 0,
    topEventTypes: events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {})
  };
}

// Generate event analytics report
function generateEventAnalyticsReport(events: any[]): any {
  const eventEvents = events.filter(e => e.eventType === 'event_attend' || e.eventType === 'event_register');
  
  const eventStats = eventEvents.reduce((acc, event) => {
    const eventId = event.eventData?.eventId;
    if (!eventId) return acc;
    
    if (!acc[eventId]) {
      acc[eventId] = {
        registrations: 0,
        attendances: 0,
        uniqueUsers: new Set()
      };
    }
    
    if (event.eventType === 'event_register') {
      acc[eventId].registrations++;
    } else if (event.eventType === 'event_attend') {
      acc[eventId].attendances++;
    }
    
    acc[eventId].uniqueUsers.add(event.userId);
    
    return acc;
  }, {});

  return {
    totalEvents: Object.keys(eventStats).length,
    totalRegistrations: Object.values(eventStats).reduce((acc: number, event: any) => acc + event.registrations, 0),
    totalAttendances: Object.values(eventStats).reduce((acc: number, event: any) => acc + event.attendances, 0),
    avgAttendanceRate: Object.values(eventStats).reduce((acc: number, event: any) => {
      return acc + (event.registrations > 0 ? event.attendances / event.registrations : 0);
    }, 0) / Object.keys(eventStats).length || 0,
    eventBreakdown: Object.fromEntries(
      Object.entries(eventStats).map(([eventId, stats]: [string, any]) => [
        eventId,
        {
          ...stats,
          uniqueUsers: stats.uniqueUsers.size,
          attendanceRate: stats.registrations > 0 ? stats.attendances / stats.registrations : 0
        }
      ])
    )
  };
}

// Generate conversion report
function generateConversionReport(events: any[]): any {
  const funnelSteps = [
    'user_register',
    'profile_complete',
    'first_event_view',
    'event_register',
    'event_attend',
    'connection_made'
  ];

  const userJourneys = events.reduce((acc, event) => {
    const userId = event.userId;
    if (!acc[userId]) {
      acc[userId] = {};
    }
    
    if (funnelSteps.includes(event.eventType)) {
      acc[userId][event.eventType] = true;
    }
    
    return acc;
  }, {});

  const funnelStats = funnelSteps.map((step, index) => {
    const usersAtStep = Object.values(userJourneys).filter((journey: any) => journey[step]).length;
    const previousStep = index > 0 ? funnelSteps[index - 1] : null;
    const usersAtPreviousStep = previousStep 
      ? Object.values(userJourneys).filter((journey: any) => journey[previousStep]).length
      : Object.keys(userJourneys).length;
    
    return {
      step,
      users: usersAtStep,
      conversionRate: usersAtPreviousStep > 0 ? usersAtStep / usersAtPreviousStep : 0
    };
  });

  return {
    totalUsers: Object.keys(userJourneys).length,
    funnelStats,
    overallConversionRate: funnelStats[funnelStats.length - 1]?.conversionRate || 0
  };
}

// Generate generic report
function generateGenericReport(events: any[]): any {
  return {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(event => event.userId)).size,
    eventTypes: events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {}),
    timeDistribution: events.reduce((acc, event) => {
      const hour = event.timestamp.toDate().getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {})
  };
}

// Generate daily report (scheduled function)
export const generateDailyReport = async (): Promise<void> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await db.collection('analytics')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(today))
      .get();

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const report = {
      date: yesterday.toISOString().split('T')[0],
      engagement: generateEngagementReport(events),
      userBehavior: generateUserBehaviorReport(events),
      eventAnalytics: generateEventAnalyticsReport(events),
      conversion: generateConversionReport(events),
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('dailyReports').doc(yesterday.toISOString().split('T')[0]).set(report);
    
    console.log('Daily report generated successfully');
  } catch (error) {
    console.error('Error generating daily report:', error);
  }
};

export const analyticsFunctions = {
  trackUserEvent,
  generateAnalyticsReport,
  updateEngagementMetrics,
  generateDailyReport
};