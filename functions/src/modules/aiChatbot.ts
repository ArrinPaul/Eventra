import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: Date;
  context?: any;
  sessionId: string;
  type: 'text' | 'voice' | 'image';
  metadata?: any;
}

interface ChatSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  context: any;
  userRole: 'student' | 'professional' | 'speaker' | 'organizer';
}

export const aiChatbotFunctions = {
  // Start new chat session
  startChatSession: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Get user data for context
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      // Create new chat session
      const sessionRef = await db.collection('chatSessions').add({
        userId: context.auth.uid,
        userRole: userData.role,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: 0,
        context: {
          userPreferences: userData.preferences || {},
          recentEvents: await getUserRecentEvents(context.auth.uid),
          userInterests: userData.interests || []
        },
        active: true
      });

      return { 
        sessionId: sessionRef.id,
        welcomeMessage: generateWelcomeMessage(userData.role, userData.name)
      };

    } catch (error) {
      console.error('Error starting chat session:', error);
      throw new functions.https.HttpsError('internal', 'Failed to start chat session');
    }
  }),

  // Send message to AI chatbot
  sendMessage: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { sessionId, message, messageType = 'text', attachments } = data;

    try {
      // Get chat session
      const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
      
      if (!sessionDoc.exists || sessionDoc.data()?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid session');
      }

      const sessionData = sessionDoc.data();

      // Process message based on user role and context
      const aiResponse = await processAIMessage({
        message,
        messageType,
        attachments,
        userRole: sessionData?.userRole,
        sessionContext: sessionData?.context,
        userId: context.auth.uid
      });

      // Store message and response
      const messageRef = await db.collection('chatSessions').doc(sessionId)
        .collection('messages').add({
          message,
          response: aiResponse.text,
          messageType,
          attachments: attachments || [],
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId: context.auth.uid,
          aiMetadata: aiResponse.metadata
        });

      // Update session
      await sessionDoc.ref.update({
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: admin.firestore.FieldValue.increment(1),
        context: {
          ...sessionData?.context,
          lastIntent: aiResponse.metadata?.intent,
          conversationFlow: aiResponse.metadata?.flow
        }
      });

      return {
        messageId: messageRef.id,
        response: aiResponse.text,
        suggestions: aiResponse.suggestions || [],
        actions: aiResponse.actions || []
      };

    } catch (error) {
      console.error('Error processing chat message:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process message');
    }
  }),

  // Get chat history
  getChatHistory: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { sessionId, limit = 50, offset = 0 } = data;

    try {
      const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
      
      if (!sessionDoc.exists || sessionDoc.data()?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid session');
      }

      const messages = await db.collection('chatSessions').doc(sessionId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const chatHistory = messages.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      })).reverse(); // Reverse to show oldest first

      return { 
        messages: chatHistory,
        sessionInfo: {
          id: sessionId,
          startedAt: sessionDoc.data()?.startedAt?.toDate().toISOString(),
          messageCount: sessionDoc.data()?.messageCount
        }
      };

    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch chat history');
    }
  }),

  // Get user's chat sessions
  getUserChatSessions: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { limit = 20 } = data;

    try {
      const sessions = await db.collection('chatSessions')
        .where('userId', '==', context.auth.uid)
        .orderBy('lastMessageAt', 'desc')
        .limit(limit)
        .get();

      const sessionList = sessions.docs.map(doc => ({
        id: doc.id,
        startedAt: doc.data().startedAt?.toDate().toISOString(),
        lastMessageAt: doc.data().lastMessageAt?.toDate().toISOString(),
        messageCount: doc.data().messageCount,
        active: doc.data().active
      }));

      return { sessions: sessionList };

    } catch (error) {
      console.error('Error fetching user chat sessions:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch chat sessions');
    }
  }),

  // Process voice message
  processVoiceMessage: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { sessionId, audioData, duration } = data;

    try {
      // Transcribe audio using Speech-to-Text API
      const transcription = await transcribeAudio(audioData);

      if (!transcription) {
        throw new functions.https.HttpsError('invalid-argument', 'Could not transcribe audio');
      }

      // Process as regular message
      const messageResponse = await aiChatbotFunctions.sendMessage({
        sessionId,
        message: transcription,
        messageType: 'voice'
      }, context);

      // Generate voice response
      const voiceResponse = await generateVoiceResponse(messageResponse.response);

      return {
        ...messageResponse,
        transcription,
        voiceResponse,
        duration
      };

    } catch (error) {
      console.error('Error processing voice message:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process voice message');
    }
  }),

  // Get contextual assistance based on current page/activity
  getContextualAssistance: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { currentPage, pageData, userAction } = data;

    try {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();

      const assistance = await generateContextualHelp({
        currentPage,
        pageData,
        userAction,
        userRole: userData?.role,
        userId: context.auth.uid
      });

      return assistance;

    } catch (error) {
      console.error('Error getting contextual assistance:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get contextual assistance');
    }
  }),

  // Train AI with user feedback
  submitFeedback: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { messageId, sessionId, feedbackType, rating, comment } = data;

    try {
      // Store feedback for AI improvement
      await db.collection('aiFeedback').add({
        messageId,
        sessionId,
        userId: context.auth.uid,
        feedbackType, // 'helpful', 'not_helpful', 'inaccurate', 'inappropriate'
        rating, // 1-5 scale
        comment,
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update message with feedback
      if (messageId) {
        await db.collection('chatSessions').doc(sessionId)
          .collection('messages').doc(messageId).update({
            userFeedback: {
              type: feedbackType,
              rating,
              comment,
              submittedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          });
      }

      return { success: true };

    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new functions.https.HttpsError('internal', 'Failed to submit feedback');
    }
  })
};

// Helper functions
async function getUserRecentEvents(userId: string): Promise<any[]> {
  try {
    const recentEvents = await db.collection('eventRegistrations')
      .where('userId', '==', userId)
      .orderBy('registeredAt', 'desc')
      .limit(5)
      .get();

    const eventIds = recentEvents.docs.map(doc => doc.data().eventId);
    
    if (eventIds.length === 0) return [];

    const eventsSnapshot = await db.collection('events')
      .where(admin.firestore.FieldPath.documentId(), 'in', eventIds)
      .get();

    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      category: doc.data().category,
      startDate: doc.data().startDate
    }));

  } catch (error) {
    console.error('Error getting user recent events:', error);
    return [];
  }
}

function generateWelcomeMessage(userRole: string, userName?: string): string {
  const name = userName || 'there';
  
  const messages = {
    student: `Hi ${name}! 👋 I'm your Vibeathon AI assistant. I can help you discover events, connect with peers, track your learning progress, and answer questions about student opportunities. What would you like to know?`,
    professional: `Hello ${name}! 👋 I'm here to help you make the most of Vibeathon. I can assist with networking opportunities, professional development events, career insights, and connecting you with industry experts. How can I help today?`,
    speaker: `Welcome ${name}! 👋 As your Vibeathon AI assistant, I can help you manage your speaking engagements, prepare session materials, engage with attendees, and track session analytics. What do you need assistance with?`,
    organizer: `Hi ${name}! 👋 I'm your Vibeathon event management assistant. I can help with event planning, attendee management, analytics insights, automation workflows, and platform administration. What would you like to work on?`
  };

  return messages[userRole as keyof typeof messages] || messages.student;
}

async function processAIMessage(params: any): Promise<any> {
  const { message, messageType, userRole, sessionContext, userId } = params;

  try {
    // Analyze message intent
    const intent = analyzeMessageIntent(message, userRole);

    let response = '';
    let suggestions: string[] = [];
    let actions: any[] = [];

    switch (intent) {
      case 'event_search':
        const eventRecommendations = await getEventRecommendations(message, userId);
        response = `I found some events that might interest you:\n\n${formatEventRecommendations(eventRecommendations)}`;
        suggestions = ['Show more events', 'Filter by date', 'Filter by category'];
        actions = [{ type: 'show_events', data: eventRecommendations }];
        break;

      case 'networking_help':
        response = await generateNetworkingAdvice(userRole, sessionContext);
        suggestions = ['Find networking events', 'View my connections', 'Profile tips'];
        break;

      case 'platform_navigation':
        response = generateNavigationHelp(message, userRole);
        suggestions = ['Dashboard overview', 'Feature guide', 'Settings help'];
        break;

      case 'event_management':
        if (userRole === 'organizer' || userRole === 'speaker') {
          response = await generateEventManagementHelp(message, userId);
          suggestions = ['Create event', 'View analytics', 'Manage attendees'];
        } else {
          response = "I can help you with event-related questions. You might want to register for events or manage your bookings.";
          suggestions = ['Find events', 'My registrations', 'Event calendar'];
        }
        break;

      case 'general_question':
      default:
        response = await generateGeneralResponse(message, userRole, sessionContext);
        suggestions = ['Ask about events', 'Platform features', 'Get recommendations'];
        break;
    }

    return {
      text: response,
      suggestions,
      actions,
      metadata: {
        intent,
        flow: 'conversational',
        confidence: 0.85,
        userRole
      }
    };

  } catch (error) {
    console.error('Error processing AI message:', error);
    return {
      text: "I'm sorry, I encountered an error processing your message. Please try again or contact support if the issue persists.",
      suggestions: ['Try again', 'Contact support'],
      actions: [],
      metadata: { intent: 'error', confidence: 0 }
    };
  }
}

function analyzeMessageIntent(message: string, userRole: string): string {
  const lowerMessage = message.toLowerCase();
  
  const intentPatterns = {
    event_search: ['find events', 'search events', 'event recommendations', 'upcoming events', 'events near me'],
    networking_help: ['networking', 'connect with', 'meet people', 'find professionals', 'make connections'],
    platform_navigation: ['how to', 'where is', 'how do i', 'navigate', 'find the', 'dashboard', 'profile'],
    event_management: ['create event', 'manage event', 'event analytics', 'attendee list', 'speaker management'],
    general_question: ['what is', 'explain', 'help', 'about', 'tell me']
  };

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return intent;
    }
  }

  return 'general_question';
}

async function getEventRecommendations(query: string, userId: string): Promise<any[]> {
  // Implementation would use existing AI recommendation system
  return [
    { id: '1', title: 'AI & Machine Learning Workshop', category: 'Technology', date: '2024-03-15' },
    { id: '2', title: 'Startup Networking Mixer', category: 'Business', date: '2024-03-18' }
  ];
}

function formatEventRecommendations(events: any[]): string {
  return events.map(event => 
    `📅 ${event.title}\n   Category: ${event.category}\n   Date: ${event.date}`
  ).join('\n\n');
}

async function generateNetworkingAdvice(userRole: string, context: any): Promise<string> {
  const adviceByRole = {
    student: "As a student, focus on connecting with peers in your field, attending study groups, and participating in career development events.",
    professional: "Build meaningful professional relationships by attending industry meetups, sharing your expertise, and engaging in collaborative projects.",
    speaker: "Connect with attendees after your sessions, engage with other speakers, and build relationships with event organizers for future opportunities.",
    organizer: "Network with speakers, sponsors, and other organizers to create better events and build a strong professional community."
  };

  return adviceByRole[userRole as keyof typeof adviceByRole] || adviceByRole.student;
}

function generateNavigationHelp(message: string, userRole: string): string {
  // Simple navigation help - can be enhanced with more sophisticated NLP
  if (message.includes('dashboard')) {
    return `Your dashboard is your home base! From there you can see upcoming events, your activity feed, notifications, and quick access to all features based on your ${userRole} role.`;
  }
  
  if (message.includes('profile')) {
    return "You can update your profile by clicking on your avatar in the top right corner. Make sure to complete your interests and skills for better event recommendations!";
  }

  return "I can help you navigate the platform. Try asking about specific features like 'dashboard', 'events', 'networking', or 'profile settings'.";
}

async function generateEventManagementHelp(message: string, userId: string): Promise<string> {
  // Enhanced with actual event management context
  return "I can help you with event creation, attendee management, session scheduling, and analytics. What specific aspect would you like assistance with?";
}

async function generateGeneralResponse(message: string, userRole: string, context: any): Promise<string> {
  // Simple response generation - integrate with more sophisticated AI
  return `I understand you're asking about "${message}". As a ${userRole}, I can help you make the most of the Vibeathon platform. Could you be more specific about what you'd like to know?`;
}

async function transcribeAudio(audioData: string): Promise<string | null> {
  // Integrate with Speech-to-Text service (Google Cloud Speech-to-Text, etc.)
  // For now, return mock transcription
  return "Mock transcription of audio message";
}

async function generateVoiceResponse(text: string): Promise<string> {
  // Integrate with Text-to-Speech service
  // Return audio URL or base64 encoded audio
  return "mock_audio_response_url";
}

async function generateContextualHelp(params: any): Promise<any> {
  const { currentPage, pageData, userAction, userRole } = params;

  const helpContent = {
    '/dashboard': {
      title: 'Dashboard Help',
      content: 'Your dashboard shows upcoming events, recent activity, and personalized recommendations.',
      tips: ['Check notifications regularly', 'Use quick actions for common tasks', 'Customize your feed preferences']
    },
    '/events': {
      title: 'Events Help',
      content: 'Browse and discover events that match your interests and professional goals.',
      tips: ['Use filters to find relevant events', 'Save events to your wishlist', 'Register early for popular events']
    },
    '/networking': {
      title: 'Networking Help',
      content: 'Connect with other professionals and build meaningful relationships.',
      tips: ['Complete your profile for better matches', 'Attend networking mixers', 'Follow up with new connections']
    }
  };

  const pageHelp = helpContent[currentPage as keyof typeof helpContent] || {
    title: 'Platform Help',
    content: 'Welcome to Vibeathon! I\'m here to help you navigate and make the most of the platform.',
    tips: ['Explore different sections', 'Update your profile', 'Join communities of interest']
  };

  return {
    ...pageHelp,
    contextualActions: generateContextualActions(currentPage, userRole),
    quickHelp: generateQuickHelpForPage(currentPage)
  };
}

function generateContextualActions(page: string, role: string): any[] {
  // Generate role-specific actions based on current page
  const actions = [];

  if (page === '/events' && (role === 'organizer' || role === 'speaker')) {
    actions.push({ label: 'Create New Event', action: 'create_event' });
  }

  if (page === '/networking') {
    actions.push({ label: 'Find Connections', action: 'find_people' });
  }

  return actions;
}

function generateQuickHelpForPage(page: string): string[] {
  const quickHelp = {
    '/dashboard': ['View upcoming events', 'Check notifications', 'See recommendations'],
    '/events': ['Browse events', 'Filter by category', 'Register for events'],
    '/networking': ['View connections', 'Send messages', 'Join groups'],
    '/profile': ['Update information', 'Add skills', 'Set preferences']
  };

  return quickHelp[page as keyof typeof quickHelp] || ['Navigate platform', 'Update profile', 'Explore features'];
}