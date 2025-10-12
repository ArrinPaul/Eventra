import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { communityFunctions } from './modules/community';
import { chatFunctions } from './modules/chat';
import { feedFunctions } from './modules/feed';
import { networkingFunctions } from './modules/networking';
import { ticketingFunctions } from './modules/ticketing';
import { groupsFunctions } from './modules/groups';
import { matchmakingFunctions } from './modules/matchmaking';
import { gamificationFunctions } from './modules/gamification';
import { notificationFunctions } from './modules/notifications';
import { analyticsFunctions } from './modules/analytics';
import { googleCalendarFunctions } from './modules/google-calendar';
import { googleWorkspaceFunctions } from './modules/google-workspace';
import { notationFunctions } from './modules/notation';
import { n8nAutomationFunctions } from './modules/n8nAutomation';
import { webScraperFunctions } from './modules/webScraper';
import { aiChatbotFunctions } from './modules/aiChatbot';
import { certificatesFunctions } from './modules/certificates';
import { userManagementFunctions } from './modules/userManagement';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "cis-sap.appspot.com",
});

// Initialize Firestore settings
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Community & Discussion System Functions
export const createCommunity = communityFunctions.createCommunity;
export const joinCommunity = communityFunctions.joinCommunity;
export const createDiscussion = communityFunctions.createDiscussion;
export const addComment = communityFunctions.addComment;
export const voteOnComment = communityFunctions.voteOnComment;
export const moderateContent = communityFunctions.moderateContent;
export const updateCommunityStats = communityFunctions.updateCommunityStats;

// Real-Time Chat Functions
export const createChatRoom = chatFunctions.createChatRoom;
export const sendMessage = chatFunctions.sendMessage;
export const joinChatRoom = chatFunctions.joinChatRoom;
export const sendDirectMessage = chatFunctions.sendDirectMessage;
export const updateChatRoomActivity = chatFunctions.updateChatRoomActivity;
export const processMessageNotifications = chatFunctions.processMessageNotifications;

// Live Event Feed Functions
export const createFeedPost = feedFunctions.createFeedPost;
export const likeFeedPost = feedFunctions.likeFeedPost;
export const commentOnPost = feedFunctions.commentOnPost;
export const updateFeedStats = feedFunctions.updateFeedStats;
export const generateFeedNotifications = feedFunctions.generateFeedNotifications;

// Professional Networking Functions
export const sendConnectionRequest = networkingFunctions.sendConnectionRequest;
export const acceptConnectionRequest = networkingFunctions.acceptConnectionRequest;
export const updateNetworkingStats = networkingFunctions.updateNetworkingStats;
export const generateSkillRecommendations = networkingFunctions.generateSkillRecommendations;
export const processNetworkingNotifications = networkingFunctions.processNetworkingNotifications;

// Event Management & Ticketing Functions
export const createTicketedEvent = ticketingFunctions.createTicketedEvent;
export const purchaseTicket = ticketingFunctions.purchaseTicket;
export const validateTicket = ticketingFunctions.validateTicket;
export const checkInAttendee = ticketingFunctions.checkInAttendee;
export const processRefund = ticketingFunctions.processRefund;
export const sendTicketReminders = ticketingFunctions.sendTicketReminders;
export const updateEventCapacity = ticketingFunctions.updateEventCapacity;

// Recurring Groups Functions
export const createGroup = groupsFunctions.createGroup;
export const joinGroup = groupsFunctions.joinGroup;
export const createGroupEvent = groupsFunctions.createGroupEvent;
export const updateGroupMembership = groupsFunctions.updateGroupMembership;
export const processGroupNotifications = groupsFunctions.processGroupNotifications;

// AI Matchmaking Functions
export const calculateCompatibilityScore = matchmakingFunctions.calculateCompatibilityScore;
export const generateTeamSuggestions = matchmakingFunctions.generateTeamSuggestions;
export const processMatchmakingRequests = matchmakingFunctions.processMatchmakingRequests;
export const updateMatchingPreferences = matchmakingFunctions.updateMatchingPreferences;

// Gamification Functions
export const awardXP = gamificationFunctions.awardXP;
export const checkAchievements = gamificationFunctions.checkAchievements;
export const updateStreaks = gamificationFunctions.updateStreaks;
export const processLeaderboard = gamificationFunctions.processLeaderboard;
export const createChallenge = gamificationFunctions.createChallenge;
export const updateChallengeProgress = gamificationFunctions.updateChallengeProgress;

// Notification Functions  
export const sendNotification = notificationFunctions.sendNotification;
export const sendBulkNotifications = notificationFunctions.sendBulkNotifications;
export const processScheduledNotifications = notificationFunctions.processScheduledNotifications;
export const markNotificationsAsRead = notificationFunctions.markNotificationsAsRead;

// Analytics Functions
export const trackUserEvent = analyticsFunctions.trackUserEvent;
export const generateAnalyticsReport = analyticsFunctions.generateAnalyticsReport;
export const updateEngagementMetrics = analyticsFunctions.updateEngagementMetrics;

// Scheduled Functions
export const dailyMaintenance = functions.pubsub.schedule('0 2 * * *').onRun(async (context: any) => {
  console.log('Running daily maintenance tasks...');
  
  // Update gamification streaks - these are scheduled functions
  console.log('Streaks and leaderboard updates run on separate schedules');
  
  // Clean up expired data
  await cleanupExpiredData();
  
  // Generate daily analytics
  await analyticsFunctions.generateDailyReport();
  
  console.log('Daily maintenance completed');
});

// Helper function for cleanup
async function cleanupExpiredData(): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();
  
  // Clean up expired notifications (older than 30 days)
  const expiredNotifications = await db.collection('notifications')
    .where('createdAt', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .get();
  
  expiredNotifications.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // Clean up expired feed cache (older than 7 days)
  const expiredFeedCache = await db.collection('feedCache')
    .where('createdAt', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .get();
  
  expiredFeedCache.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// Google Calendar Integration Functions
export const getGoogleCalendarAuthUrl = googleCalendarFunctions.getGoogleCalendarAuthUrl;
export const handleGoogleCalendarCallback = googleCalendarFunctions.handleGoogleCalendarCallback;
export const syncEventToGoogleCalendar = googleCalendarFunctions.syncEventToGoogleCalendar;
export const autoSyncUserEvents = googleCalendarFunctions.autoSyncUserEvents;
export const disconnectGoogleCalendar = googleCalendarFunctions.disconnectGoogleCalendar;
export const refreshGoogleCalendarTokens = googleCalendarFunctions.refreshGoogleCalendarTokens;
export const onEventUpdated = googleCalendarFunctions.onEventUpdated;

// Google Workspace Integration Functions
export const getGoogleWorkspaceAuthUrl = googleWorkspaceFunctions.getGoogleWorkspaceAuthUrl;
export const handleGoogleWorkspaceCallback = googleWorkspaceFunctions.handleGoogleWorkspaceCallback;
export const createEventDocument = googleWorkspaceFunctions.createEventDocument;
export const createEventSpreadsheet = googleWorkspaceFunctions.createEventSpreadsheet;
export const syncRegistrationsToSheet = googleWorkspaceFunctions.syncRegistrationsToSheet;
export const disconnectGoogleWorkspace = googleWorkspaceFunctions.disconnectGoogleWorkspace;
export const onRegistrationCreated = googleWorkspaceFunctions.onRegistrationCreated;

// Notation System Functions
export const createNotation = notationFunctions.createNotation;
export const updateNotation = notationFunctions.updateNotation;
export const shareNotation = notationFunctions.shareNotation;
export const generateAISummary = notationFunctions.generateAISummary;
export const exportNotationToPDF = notationFunctions.exportNotationToPDF;
export const onNotationUpdated = notationFunctions.onNotationUpdated;

// n8n Automation Functions
export const setupN8nWebhooks = n8nAutomationFunctions.setupN8nWebhooks;
export const triggerWorkflow = n8nAutomationFunctions.triggerWorkflow;
export const getWorkflowExecutions = n8nAutomationFunctions.getWorkflowExecutions;
export const manageWorkflowConfig = n8nAutomationFunctions.manageWorkflowConfig;
export const handleN8nCallback = n8nAutomationFunctions.handleN8nCallback;
export const monitorWorkflows = n8nAutomationFunctions.monitorWorkflows;

// Web Scraper Functions
export const scrapeEventbrite = webScraperFunctions.scrapeEventbrite;
export const scrapeMeetup = webScraperFunctions.scrapeMeetup;
export const scrapeIEEE = webScraperFunctions.scrapeIEEE;
export const getScrapedEvents = webScraperFunctions.getScrapedEvents;
export const processScrapedEvent = webScraperFunctions.processScrapedEvent;
export const generateTrends = webScraperFunctions.generateTrends;
export const scheduledScraping = webScraperFunctions.scheduledScraping;

// AI Chatbot Functions
export const startChatSession = aiChatbotFunctions.startChatSession;
export const sendAIMessage = aiChatbotFunctions.sendMessage;
export const getChatHistory = aiChatbotFunctions.getChatHistory;
export const getUserChatSessions = aiChatbotFunctions.getUserChatSessions;
export const processVoiceMessage = aiChatbotFunctions.processVoiceMessage;
export const getContextualAssistance = aiChatbotFunctions.getContextualAssistance;
export const submitAIFeedback = aiChatbotFunctions.submitFeedback;

// Certificate Functions
export const createCertificateTemplate = certificatesFunctions.createCertificateTemplate;
export const generateCertificate = certificatesFunctions.generateCertificate;
export const bulkGenerateCertificates = certificatesFunctions.bulkGenerateCertificates;
export const getUserCertificates = certificatesFunctions.getUserCertificates;
export const verifyCertificate = certificatesFunctions.verifyCertificate;
export const getCertificateTemplates = certificatesFunctions.getCertificateTemplates;
export const onEventCompleted = certificatesFunctions.onEventCompleted;

// User Management Functions
export const registerForEvent = userManagementFunctions.registerForEvent;
export const checkInWithQR = userManagementFunctions.checkInWithQR;
export const updateRegistration = userManagementFunctions.updateRegistration;
export const getUserRegistrations = userManagementFunctions.getUserRegistrations;
export const cancelRegistration = userManagementFunctions.cancelRegistration;
export const sendEventReminders = userManagementFunctions.sendEventReminders;

// Health check function
export const healthCheck = functions.https.onRequest((req: any, res: any) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    modules: {
      community: true,
      chat: true,
      feed: true,
      networking: true,
      ticketing: true,
      groups: true,
      matchmaking: true,
      gamification: true,
      notifications: true,
      analytics: true,
      googleCalendar: true,
      googleWorkspace: true,
      notation: true,
      n8nAutomation: true,
      webScraper: true,
      aiChatbot: true,
      certificates: true,
      userManagement: true
    }
  });
});