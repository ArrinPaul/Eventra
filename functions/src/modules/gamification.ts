import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const gamificationFunctions = {
  awardXP: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { userId, amount, reason, category } = data;

    try {
      const xpTransaction = {
        id: admin.firestore.FieldValue.serverTimestamp().toString(),
        amount,
        reason,
        category: category || 'general',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update user XP
      await db.collection('userXP').doc(userId).set({
        totalXP: admin.firestore.FieldValue.increment(amount),
        xpHistory: admin.firestore.FieldValue.arrayUnion(xpTransaction),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Check for achievements
      await triggerAchievementCheck(userId);

      // Update leaderboard
      await updateUserLeaderboardPosition(userId);

      return { success: true, xpAwarded: amount };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw new functions.https.HttpsError('internal', 'Failed to award XP');
    }
  }),

  checkAchievements: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    return await triggerAchievementCheck(context.auth.uid);
  }),

  updateStreaks: functions.pubsub.schedule('0 0 * * *').onRun(async () => {
    console.log('Updating user streaks...');
    
    try {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        await updateUserStreaks(userId, batch);
      }
      
      await batch.commit();
      console.log('Streaks updated successfully');
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  }),

  processLeaderboard: functions.pubsub.schedule('0 1 * * *').onRun(async () => {
    console.log('Processing leaderboard updates...');
    
    try {
      // Get all user XP data
      const userXPSnapshot = await db.collection('userXP').orderBy('totalXP', 'desc').limit(100).get();
      
      const leaderboardEntries = [];
      let rank = 1;
      
      for (const doc of userXPSnapshot.docs) {
        const userData = doc.data();
        const userId = doc.id;
        
        // Get user's additional stats
        const userStats = await getUserStats(userId);
        
        leaderboardEntries.push({
          userId,
          points: userData.totalXP,
          rank,
          badgeCount: userStats.badgeCount,
          eventCount: userStats.eventCount,
          connectionCount: userStats.connectionCount
        });
        
        rank++;
      }
      
      // Update global leaderboard
      await db.collection('leaderboards').doc('global').set({
        type: 'global',
        entries: leaderboardEntries,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Leaderboard processed successfully');
    } catch (error) {
      console.error('Error processing leaderboard:', error);
    }
  }),

  createChallenge: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { name, description, type, startDate, endDate, tasks, rewards, maxParticipants } = data;

    try {
      const challenge = {
        name,
        description,
        type, // 'monthly', 'weekly', 'seasonal', 'special'
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tasks,
        rewards,
        maxParticipants: maxParticipants || null,
        participants: [],
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      const challengeRef = await db.collection('challenges').add(challenge);
      
      return { id: challengeRef.id, ...challenge };
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create challenge');
    }
  }),

  updateChallengeProgress: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { challengeId, taskId, progress } = data;

    try {
      const progressRef = db.collection('challengeProgress').doc(`${challengeId}_${context.auth.uid}_${taskId}`);
      
      await progressRef.set({
        challengeId,
        taskId,
        userId: context.auth.uid,
        progress,
        isCompleted: progress >= 100,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Check if task is completed and award XP
      if (progress >= 100) {
        const challengeDoc = await db.collection('challenges').doc(challengeId).get();
        const challengeData = challengeDoc.data();
        
        if (challengeData) {
          const task = challengeData.tasks.find((t: any) => t.id === taskId);
          if (task) {
            await awardUserXP(context.auth.uid, task.xpReward, `Completed challenge task: ${task.name}`);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw new functions.https.HttpsError('internal', 'Failed to update challenge progress');
    }
  }),

  // Triggered when user performs an action
  onUserAction: functions.firestore.document('userActions/{actionId}').onCreate(async (snap, context) => {
    const actionData = snap.data();
    
    try {
      // Award XP based on action type
      const xpRewards: { [key: string]: number } = {
        'event_created': 25,
        'event_attended': 15,
        'connection_made': 10,
        'message_sent': 2,
        'discussion_created': 15,
        'comment_added': 5,
        'profile_updated': 5,
        'feedback_given': 10
      };

      const xpAmount = xpRewards[actionData.actionType] || 1;
      await awardUserXP(actionData.userId, xpAmount, `Action: ${actionData.actionType}`);

      // Update relevant streaks
      await updateActionStreak(actionData.userId, actionData.actionType);

    } catch (error) {
      console.error('Error processing user action:', error);
    }
  })
};

// Helper functions
async function triggerAchievementCheck(userId: string): Promise<any[]> {
  try {
    const userXPDoc = await db.collection('userXP').doc(userId).get();
    const userXPData = userXPDoc.data();
    
    if (!userXPData) return [];

    const userStats = await getUserStats(userId);
    const achievements = await db.collection('achievements').get();
    const userAchievements = await db.collection('userAchievements')
      .where('userId', '==', userId)
      .get();
    
    const earnedAchievementIds = new Set(userAchievements.docs.map(doc => doc.data().achievementId));
    const newAchievements = [];

    for (const achievementDoc of achievements.docs) {
      const achievement = achievementDoc.data();
      const achievementId = achievementDoc.id;
      
      if (earnedAchievementIds.has(achievementId)) continue;

      let isEarned = false;

      // Check achievement criteria
      switch (achievement.type) {
        case 'milestone':
          if (achievement.criteria.xp && userXPData.totalXP >= achievement.criteria.xp) {
            isEarned = true;
          }
          break;
          
        case 'social':
          if (achievement.criteria.connections && userStats.connectionCount >= achievement.criteria.connections) {
            isEarned = true;
          }
          break;
          
        case 'streak':
          if (achievement.criteria.streak) {
            const streakData = await getUserStreak(userId, achievement.criteria.streakType);
            if (streakData && streakData.longestStreak >= achievement.criteria.streak) {
              isEarned = true;
            }
          }
          break;
      }

      if (isEarned) {
        // Award achievement
        await db.collection('userAchievements').add({
          userId,
          achievementId,
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          isNew: true
        });

        // Award XP reward
        if (achievement.reward.xp) {
          await awardUserXP(userId, achievement.reward.xp, `Achievement: ${achievement.name}`);
        }

        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

async function updateUserStreaks(userId: string, batch: FirebaseFirestore.WriteBatch): Promise<void> {
  try {
    const streaksSnapshot = await db.collection('userStreaks').where('userId', '==', userId).get();
    
    for (const streakDoc of streaksSnapshot.docs) {
      const streakData = streakDoc.data();
      const today = new Date();
      const lastActive = streakData.lastActiveDate?.toDate();
      
      if (lastActive) {
        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          // Streak broken
          batch.update(streakDoc.ref, {
            currentStreak: 0,
            isActive: false
          });
        } else if (daysDiff === 1) {
          // Maintain streak status, will be updated when user is active today
          batch.update(streakDoc.ref, {
            isActive: false
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error updating streaks for user ${userId}:`, error);
  }
}

async function updateActionStreak(userId: string, actionType: string): Promise<void> {
  try {
    const streakType = getStreakTypeFromAction(actionType);
    if (!streakType) return;

    const streakRef = db.collection('userStreaks').doc(`${userId}_${streakType}`);
    const streakDoc = await streakRef.get();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (streakDoc.exists) {
      const streakData = streakDoc.data()!;
      const lastActive = streakData.lastActiveDate?.toDate();
      
      if (lastActive) {
        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Continue streak
          const newStreak = streakData.currentStreak + 1;
          await streakRef.update({
            currentStreak: newStreak,
            longestStreak: Math.max(streakData.longestStreak, newStreak),
            lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
          });
        } else if (daysDiff === 0) {
          // Same day, just update activity
          await streakRef.update({
            lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
          });
        } else {
          // Streak broken, start new
          await streakRef.update({
            currentStreak: 1,
            lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
          });
        }
      }
    } else {
      // Create new streak
      await streakRef.set({
        userId,
        type: streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating action streak:', error);
  }
}

function getStreakTypeFromAction(actionType: string): string | null {
  const actionToStreakMap: { [key: string]: string } = {
    'event_attended': 'event_attendance',
    'message_sent': 'daily_activity',
    'discussion_created': 'daily_activity',
    'comment_added': 'daily_activity',
    'connection_made': 'networking'
  };
  
  return actionToStreakMap[actionType] || 'daily_activity';
}

async function getUserStats(userId: string): Promise<any> {
  try {
    const [connectionsSnapshot, eventsSnapshot, achievementsSnapshot] = await Promise.all([
      db.collection('connections').where('userId', '==', userId).get(),
      db.collection('eventAttendees').where('userId', '==', userId).get(),
      db.collection('userAchievements').where('userId', '==', userId).get()
    ]);

    return {
      connectionCount: connectionsSnapshot.size,
      eventCount: eventsSnapshot.size,
      badgeCount: achievementsSnapshot.size
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { connectionCount: 0, eventCount: 0, badgeCount: 0 };
  }
}

async function getUserStreak(userId: string, streakType: string): Promise<any> {
  try {
    const streakDoc = await db.collection('userStreaks').doc(`${userId}_${streakType}`).get();
    return streakDoc.exists ? streakDoc.data() : null;
  } catch (error) {
    console.error('Error getting user streak:', error);
    return null;
  }
}

async function updateUserLeaderboardPosition(userId: string): Promise<void> {
  // This will be handled by the scheduled leaderboard update function
  // for performance reasons
}

async function awardUserXP(userId: string, amount: number, reason: string): Promise<void> {
  try {
    await db.collection('userXP').doc(userId).set({
      totalXP: admin.firestore.FieldValue.increment(amount),
      xpHistory: admin.firestore.FieldValue.arrayUnion({
        id: Date.now().toString(),
        amount,
        reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}