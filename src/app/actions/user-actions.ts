'use server';

/**
 * User Action Processing Service
 * 
 * This module processes user actions and triggers appropriate gamification rewards:
 * - Badge awards
 * - Challenge progress updates  
 * - XP rewards
 * 
 * Call processUserAction() after relevant user actions like:
 * - Event registration
 * - Check-in
 * - Creating a post
 * - Making a connection
 * - Completing a session
 */

import { checkAndAwardBadges, awardXP, type BadgeDefinition } from './badges';
import { getUserChallenges, getActiveChallenges, updateChallengeProgress } from './challenges';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

export type UserActionType = 
  | 'event_registration'
  | 'event_check_in'
  | 'session_attended'
  | 'post_created'
  | 'connection_made'
  | 'comment_posted'
  | 'event_completed'
  | 'feedback_submitted'
  | 'profile_completed'
  | 'first_login'
  | 'daily_login';

interface ActionResult {
  success: boolean;
  xpAwarded: number;
  badgesEarned: BadgeDefinition[];
  challengesUpdated: string[];
}

// XP rewards for different actions
const XP_REWARDS: Record<UserActionType, number> = {
  event_registration: 25,
  event_check_in: 50,
  session_attended: 30,
  post_created: 15,
  connection_made: 20,
  comment_posted: 10,
  event_completed: 100,
  feedback_submitted: 25,
  profile_completed: 75,
  first_login: 50,
  daily_login: 10,
};

/**
 * Get current user stats from Firestore
 */
async function getUserStats(userId: string): Promise<{
  eventsAttended: number;
  connections: number;
  posts: number;
  checkIns: number;
  currentStreak: number;
  totalPoints: number;
  eventCategories: { [category: string]: number };
}> {
  if (!db) {
    return {
      eventsAttended: 0,
      connections: 0,
      posts: 0,
      checkIns: 0,
      currentStreak: 0,
      totalPoints: 0,
      eventCategories: {},
    };
  }

  try {
    // Get user profile for basic stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    // Get event attendance count
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      where('status', '==', 'confirmed')
    );
    const ticketsSnapshot = await getDocs(ticketsQuery);
    const eventsAttended = ticketsSnapshot.size;

    // Get check-in count
    const checkedInTickets = ticketsSnapshot.docs.filter(
      doc => doc.data().checkedIn
    ).length;

    // Get connections count
    const connectionsQuery = query(
      collection(db, 'connections'),
      where('userId', '==', userId)
    );
    const connectionsSnapshot = await getDocs(connectionsQuery);
    const connections = connectionsSnapshot.size;

    // Get posts count
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const posts = postsSnapshot.size;

    // Get XP data
    const xpRef = doc(db, 'userXP', userId);
    const xpDoc = await getDoc(xpRef);
    const xpData = xpDoc.exists() ? xpDoc.data() : { totalXP: 0 };

    // Get streak data
    const streakRef = doc(db, 'userStreaks', userId);
    const streakDoc = await getDoc(streakRef);
    const streakData = streakDoc.exists() ? streakDoc.data() : { currentStreak: 0 };

    // Get event categories attended
    const eventCategories: { [category: string]: number } = {};
    for (const ticketDoc of ticketsSnapshot.docs) {
      const ticket = ticketDoc.data();
      if (ticket.eventCategory) {
        eventCategories[ticket.eventCategory] = (eventCategories[ticket.eventCategory] || 0) + 1;
      }
    }

    return {
      eventsAttended,
      connections,
      posts,
      checkIns: checkedInTickets,
      currentStreak: streakData.currentStreak || 0,
      totalPoints: xpData.totalXP || 0,
      eventCategories,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      eventsAttended: 0,
      connections: 0,
      posts: 0,
      checkIns: 0,
      currentStreak: 0,
      totalPoints: 0,
      eventCategories: {},
    };
  }
}

/**
 * Process a user action and trigger gamification rewards
 */
export async function processUserAction(
  userId: string,
  action: UserActionType,
  metadata?: {
    eventId?: string;
    eventCategory?: string;
    sessionId?: string;
    targetUserId?: string;
  }
): Promise<ActionResult> {
  const result: ActionResult = {
    success: false,
    xpAwarded: 0,
    badgesEarned: [],
    challengesUpdated: [],
  };

  try {
    // 1. Award XP for the action
    const xpAmount = XP_REWARDS[action] || 0;
    if (xpAmount > 0) {
      await awardXP(userId, xpAmount, getActionDescription(action, metadata));
      result.xpAwarded = xpAmount;
    }

    // 2. Update user stats based on action
    await updateUserStatsForAction(userId, action, metadata);

    // 3. Get updated user stats
    const stats = await getUserStats(userId);

    // 4. Check and award any new badges
    const newBadges = await checkAndAwardBadges(userId, stats);
    result.badgesEarned = newBadges;

    // 5. Update challenge progress
    const challengeResult = await updateChallengeProgressForAction(
      userId,
      action,
      metadata
    );
    result.challengesUpdated = challengeResult;

    // 6. Update daily streak if applicable
    if (['event_check_in', 'daily_login', 'session_attended'].includes(action)) {
      await updateDailyStreak(userId);
    }

    result.success = true;
  } catch (error) {
    console.error('Error processing user action:', error);
  }

  return result;
}

/**
 * Update user stats in Firestore based on action
 */
async function updateUserStatsForAction(
  userId: string,
  action: UserActionType,
  metadata?: { eventId?: string; eventCategory?: string }
): Promise<void> {
  if (!db) return;

  try {
    const userStatsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(userStatsRef);
    
    let updates: Record<string, any> = {};
    
    switch (action) {
      case 'event_registration':
        updates = { eventsRegistered: (statsDoc.data()?.eventsRegistered || 0) + 1 };
        break;
      case 'event_check_in':
        updates = { eventsCheckedIn: (statsDoc.data()?.eventsCheckedIn || 0) + 1 };
        break;
      case 'post_created':
        updates = { postsCreated: (statsDoc.data()?.postsCreated || 0) + 1 };
        break;
      case 'connection_made':
        updates = { connectionsMade: (statsDoc.data()?.connectionsMade || 0) + 1 };
        break;
    }

    if (Object.keys(updates).length > 0) {
      if (statsDoc.exists()) {
        await updateDoc(userStatsRef, updates);
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userStatsRef, { 
          userId,
          ...updates,
          createdAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

/**
 * Update challenge progress based on action
 */
async function updateChallengeProgressForAction(
  userId: string,
  action: UserActionType,
  metadata?: { eventId?: string; sessionId?: string }
): Promise<string[]> {
  const updatedChallenges: string[] = [];

  // Map actions to challenge task types
  const actionToTaskType: Record<string, string> = {
    event_check_in: 'check_in',
    session_attended: 'attend_session',
    connection_made: 'make_connection',
    post_created: 'create_post',
    feedback_submitted: 'submit_feedback',
    event_registration: 'register_event',
  };

  const taskType = actionToTaskType[action];
  if (!taskType) return updatedChallenges;

  try {
    // Get user's active challenges
    const userChallenges = await getUserChallenges(userId);
    const activeChallenges = await getActiveChallenges();
    
    // Find challenges that have tasks matching this action type
    for (const userChallenge of userChallenges) {
      if (userChallenge.isCompleted) continue;
      
      const challenge = activeChallenges.find(c => c.id === userChallenge.challengeId);
      if (!challenge) continue;
      
      // Find matching task in this challenge
      const matchingTask = challenge.tasks.find(t => 
        t.type === taskType || 
        t.name.toLowerCase().includes(taskType.replace('_', ' '))
      );
      
      if (matchingTask && !userChallenge.completedTasks.includes(matchingTask.id)) {
        const result = await updateChallengeProgress(
          userId, 
          userChallenge.challengeId, 
          matchingTask.id, 
          1
        );
        if (result.success) {
          updatedChallenges.push(userChallenge.challengeId);
        }
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }

  return updatedChallenges;
}

/**
 * Update user's daily activity streak
 */
async function updateDailyStreak(userId: string): Promise<void> {
  if (!db) return;

  try {
    const streakRef = doc(db, 'userStreaks', userId);
    const streakDoc = await getDoc(streakRef);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (streakDoc.exists()) {
      const data = streakDoc.data();
      const lastActivity = data.lastActivityDate?.toDate();
      
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        lastDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          // Same day, no update needed
          return;
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          await updateDoc(streakRef, {
            currentStreak: (data.currentStreak || 0) + 1,
            longestStreak: Math.max(
              (data.longestStreak || 0),
              (data.currentStreak || 0) + 1
            ),
            lastActivityDate: today,
          });
        } else {
          // Streak broken, reset
          await updateDoc(streakRef, {
            currentStreak: 1,
            lastActivityDate: today,
          });
        }
      }
    } else {
      // Create new streak record
      const { setDoc } = await import('firebase/firestore');
      await setDoc(streakRef, {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating daily streak:', error);
  }
}

/**
 * Get human-readable description for an action
 */
function getActionDescription(
  action: UserActionType,
  metadata?: { eventId?: string }
): string {
  const descriptions: Record<UserActionType, string> = {
    event_registration: 'Registered for an event',
    event_check_in: 'Checked in to an event',
    session_attended: 'Attended a session',
    post_created: 'Created a new post',
    connection_made: 'Made a new connection',
    comment_posted: 'Posted a comment',
    event_completed: 'Completed event participation',
    feedback_submitted: 'Submitted feedback',
    profile_completed: 'Completed profile setup',
    first_login: 'First login bonus',
    daily_login: 'Daily login bonus',
  };

  return descriptions[action] || 'Activity reward';
}

/**
 * Batch process multiple actions (useful for syncing)
 */
export async function batchProcessActions(
  userId: string,
  actions: Array<{ action: UserActionType; metadata?: any }>
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const { action, metadata } of actions) {
    const result = await processUserAction(userId, action, metadata);
    results.push(result);
  }

  return results;
}
