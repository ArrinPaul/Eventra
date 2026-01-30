'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';

// Challenge definitions
export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'event' | 'special';
  category: 'attendance' | 'networking' | 'engagement' | 'exploration';
  startDate: Date;
  endDate: Date;
  tasks: ChallengeTask[];
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };
  maxParticipants?: number;
  isActive: boolean;
}

export interface ChallengeTask {
  id: string;
  name: string;
  description: string;
  type: 'attend_event' | 'make_connections' | 'post_content' | 'check_in' | 'explore_category' | 'feedback';
  target: number;
  xpReward: number;
  eventCategory?: string;
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: Date;
  progress: { [taskId: string]: number };
  completedTasks: string[];
  isCompleted: boolean;
  completedAt?: Date;
  rewardsClaimed: boolean;
}

// Default weekly challenges
export async function getDefaultWeeklyChallenges(): Promise<Omit<ChallengeDefinition, 'startDate' | 'endDate'>[]> {
  return [
    {
      id: 'weekly_explorer',
      name: 'Weekly Explorer',
      description: 'Discover and attend events across different categories this week',
      icon: '🗺️',
      type: 'weekly',
      category: 'exploration',
      tasks: [
        {
          id: 'attend_any_2',
          name: 'Attend 2 Events',
          description: 'Attend any 2 events this week',
          type: 'attend_event',
          target: 2,
          xpReward: 50
        },
        {
          id: 'different_categories',
          name: 'Try Something New',
          description: 'Attend events from 2 different categories',
          type: 'explore_category',
          target: 2,
          xpReward: 75
        }
      ],
      rewards: { xp: 200 },
      isActive: true
    },
    {
      id: 'weekly_networker',
      name: 'Social Spark',
      description: 'Expand your network and make meaningful connections',
      icon: '🌐',
      type: 'weekly',
      category: 'networking',
      tasks: [
        {
          id: 'connect_5',
          name: 'Make 5 Connections',
          description: 'Connect with 5 new people',
          type: 'make_connections',
          target: 5,
          xpReward: 75
        },
        {
          id: 'attend_networking',
          name: 'Networking Event',
          description: 'Attend a networking or business event',
          type: 'attend_event',
          target: 1,
          xpReward: 50,
          eventCategory: 'Networking'
        }
      ],
      rewards: { xp: 250 },
      isActive: true
    },
    {
      id: 'weekly_contributor',
      name: 'Voice of the Community',
      description: 'Share your thoughts and engage with the community',
      icon: '💬',
      type: 'weekly',
      category: 'engagement',
      tasks: [
        {
          id: 'post_3',
          name: 'Share 3 Posts',
          description: 'Create 3 community posts or discussions',
          type: 'post_content',
          target: 3,
          xpReward: 60
        },
        {
          id: 'feedback_2',
          name: 'Leave Feedback',
          description: 'Provide feedback on 2 events you attended',
          type: 'feedback',
          target: 2,
          xpReward: 40
        }
      ],
      rewards: { xp: 175 },
      isActive: true
    }
  ];
}

// Daily challenge templates
export async function getDailyChallengeTemplates(): Promise<Omit<ChallengeDefinition, 'id' | 'startDate' | 'endDate'>[]> {
  return [
    {
      name: 'Daily Check-In',
      description: 'Start your day by checking in to the platform',
      icon: '☀️',
      type: 'daily',
      category: 'engagement',
      tasks: [
        {
          id: 'daily_login',
          name: 'Log In',
          description: 'Log in to the platform today',
          type: 'check_in',
          target: 1,
          xpReward: 10
        }
      ],
      rewards: { xp: 15 },
      isActive: true
    },
    {
      name: 'Connect Today',
      description: 'Make a new connection today',
      icon: '🤝',
      type: 'daily',
      category: 'networking',
      tasks: [
        {
          id: 'daily_connect',
          name: 'New Connection',
          description: 'Connect with 1 new person',
          type: 'make_connections',
          target: 1,
          xpReward: 20
        }
      ],
      rewards: { xp: 25 },
      isActive: true
    },
    {
      name: 'Share Your Thoughts',
      description: 'Contribute to a community discussion',
      icon: '💭',
      type: 'daily',
      category: 'engagement',
      tasks: [
        {
          id: 'daily_post',
          name: 'Post or Comment',
          description: 'Create a post or comment on a discussion',
          type: 'post_content',
          target: 1,
          xpReward: 15
        }
      ],
      rewards: { xp: 20 },
      isActive: true
    }
  ];
}

// Get active challenges
export async function getActiveChallenges(): Promise<ChallengeDefinition[]> {
  // For now, generate weekly challenges dynamically
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weeklyTemplates = await getDefaultWeeklyChallenges();
  const weeklyChallenges = weeklyTemplates.map(challenge => ({
    ...challenge,
    startDate: weekStart,
    endDate: weekEnd
  }));

  // Add daily challenges
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);

  const dailyTemplates = await getDailyChallengeTemplates();
  const dailyChallenges: ChallengeDefinition[] = dailyTemplates.map((template, index) => ({
    ...template,
    id: `daily_${dayStart.toISOString().split('T')[0]}_${index}`,
    startDate: dayStart,
    endDate: dayEnd
  }));

  return [...dailyChallenges, ...weeklyChallenges];
}

// Get user's challenge progress
export async function getUserChallenges(userId: string): Promise<UserChallenge[]> {
  if (!db) return [];
  
  try {
    const challengesRef = collection(db, 'userChallenges');
    const q = query(challengesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate()
    })) as UserChallenge[];
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return [];
  }
}

// Join a challenge
export async function joinChallenge(
  userId: string, 
  challengeId: string
): Promise<{ success: boolean; userChallenge?: UserChallenge }> {
  if (!db) return { success: false };
  
  try {
    // Check if already joined
    const existingChallenges = await getUserChallenges(userId);
    const existing = existingChallenges.find(c => c.challengeId === challengeId);
    if (existing) {
      return { success: true, userChallenge: existing };
    }

    const challenges = await getActiveChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false };
    }

    // Create user challenge entry
    const userChallengeRef = doc(collection(db, 'userChallenges'));
    const progress: { [taskId: string]: number } = {};
    challenge.tasks.forEach(task => {
      progress[task.id] = 0;
    });

    const userChallenge: Omit<UserChallenge, 'id'> = {
      challengeId,
      userId,
      joinedAt: new Date(),
      progress,
      completedTasks: [],
      isCompleted: false,
      rewardsClaimed: false
    };

    await setDoc(userChallengeRef, {
      ...userChallenge,
      joinedAt: serverTimestamp()
    });

    return { 
      success: true, 
      userChallenge: { id: userChallengeRef.id, ...userChallenge } 
    };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { success: false };
  }
}

// Update challenge progress
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  taskId: string,
  incrementBy: number = 1
): Promise<{ success: boolean; taskCompleted?: boolean; challengeCompleted?: boolean }> {
  if (!db) return { success: false };
  
  try {
    const userChallenges = await getUserChallenges(userId);
    const userChallenge = userChallenges.find(c => c.challengeId === challengeId);
    
    if (!userChallenge) {
      return { success: false };
    }

    const challenges = await getActiveChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false };
    }

    const task = challenge.tasks.find(t => t.id === taskId);
    if (!task) {
      return { success: false };
    }

    // Update progress
    const newProgress = Math.min((userChallenge.progress[taskId] || 0) + incrementBy, task.target);
    const taskCompleted = newProgress >= task.target && !userChallenge.completedTasks.includes(taskId);
    
    const updates: any = {
      [`progress.${taskId}`]: newProgress
    };

    const newCompletedTasks = [...userChallenge.completedTasks];
    if (taskCompleted) {
      newCompletedTasks.push(taskId);
      updates.completedTasks = newCompletedTasks;

      // Award task XP
      await awardXPForTask(userId, task.xpReward, task.name);
    }

    // Check if all tasks completed
    const challengeCompleted = challenge.tasks.every(t => 
      newCompletedTasks.includes(t.id) || (t.id === taskId && newProgress >= t.target)
    );

    if (challengeCompleted && !userChallenge.isCompleted) {
      updates.isCompleted = true;
      updates.completedAt = serverTimestamp();
    }

    // Update in Firestore
    const userChallengeRef = doc(db, 'userChallenges', userChallenge.id);
    await updateDoc(userChallengeRef, updates);

    return { success: true, taskCompleted, challengeCompleted };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { success: false };
  }
}

// Claim challenge rewards
export async function claimChallengeRewards(
  userId: string,
  challengeId: string
): Promise<{ success: boolean; rewards?: { xp: number; badge?: string; title?: string } }> {
  if (!db) return { success: false };
  
  try {
    const userChallenges = await getUserChallenges(userId);
    const userChallenge = userChallenges.find(c => c.challengeId === challengeId);
    
    if (!userChallenge || !userChallenge.isCompleted || userChallenge.rewardsClaimed) {
      return { success: false };
    }

    const challenges = await getActiveChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false };
    }

    // Award completion bonus XP
    await awardXPForTask(userId, challenge.rewards.xp, `${challenge.name} Completion Bonus`);

    // Award badge if applicable
    if (challenge.rewards.badge) {
      // Import and call awardBadge from badges.ts
      const { awardBadge } = await import('./badges');
      await awardBadge(userId, challenge.rewards.badge);
    }

    // Mark as claimed
    const userChallengeRef = doc(db, 'userChallenges', userChallenge.id);
    await updateDoc(userChallengeRef, { rewardsClaimed: true });

    return { success: true, rewards: challenge.rewards };
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return { success: false };
  }
}

// Award XP for task completion
async function awardXPForTask(userId: string, amount: number, taskName: string): Promise<void> {
  if (!db) return;
  
  try {
    const userXPRef = doc(db, 'userXP', userId);
    const userXPDoc = await getDoc(userXPRef);
    
    const xpTransaction = {
      id: `task_${Date.now()}`,
      amount,
      reason: `Challenge task: ${taskName}`,
      category: 'challenge',
      createdAt: new Date()
    };
    
    if (userXPDoc.exists()) {
      const currentData = userXPDoc.data();
      await updateDoc(userXPRef, {
        totalXP: (currentData.totalXP || 0) + amount,
        xpHistory: [...(currentData.xpHistory || []), xpTransaction]
      });
    } else {
      await setDoc(userXPRef, {
        userId,
        totalXP: amount,
        level: 1,
        xpHistory: [xpTransaction]
      });
    }
  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}

// Auto-update progress based on user actions
export async function processUserAction(
  userId: string,
  action: {
    type: 'event_attendance' | 'connection' | 'post' | 'check_in' | 'feedback';
    eventCategory?: string;
    eventId?: string;
  }
): Promise<void> {
  try {
    const userChallenges = await getUserChallenges(userId);
    const activeChallenges = await getActiveChallenges();

    for (const userChallenge of userChallenges) {
      if (userChallenge.isCompleted) continue;

      const challenge = activeChallenges.find(c => c.id === userChallenge.challengeId);
      if (!challenge) continue;

      for (const task of challenge.tasks) {
        if (userChallenge.completedTasks.includes(task.id)) continue;

        let shouldIncrement = false;

        switch (task.type) {
          case 'attend_event':
            if (action.type === 'event_attendance') {
              if (task.eventCategory) {
                shouldIncrement = action.eventCategory === task.eventCategory;
              } else {
                shouldIncrement = true;
              }
            }
            break;

          case 'make_connections':
            shouldIncrement = action.type === 'connection';
            break;

          case 'post_content':
            shouldIncrement = action.type === 'post';
            break;

          case 'check_in':
            shouldIncrement = action.type === 'check_in';
            break;

          case 'feedback':
            shouldIncrement = action.type === 'feedback';
            break;

          case 'explore_category':
            // This needs to track unique categories - simplified here
            if (action.type === 'event_attendance' && action.eventCategory) {
              shouldIncrement = true;
            }
            break;
        }

        if (shouldIncrement) {
          await updateChallengeProgress(userId, challenge.id, task.id);
        }
      }
    }
  } catch (error) {
    console.error('Error processing user action:', error);
  }
}

// Get challenge leaderboard
export async function getChallengeLeaderboard(
  challengeId: string
): Promise<Array<{ userId: string; completedTasks: number; progress: number }>> {
  if (!db) return [];
  
  try {
    const challengesRef = collection(db, 'userChallenges');
    const q = query(challengesRef, where('challengeId', '==', challengeId));
    const snapshot = await getDocs(q);

    const challenges = await getActiveChallenges();
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return [];

    const leaderboard = snapshot.docs.map(doc => {
      const data = doc.data();
      const totalProgress = challenge.tasks.reduce((sum, task) => {
        return sum + Math.min((data.progress?.[task.id] || 0) / task.target, 1);
      }, 0);

      return {
        userId: data.userId,
        completedTasks: (data.completedTasks || []).length,
        progress: Math.round((totalProgress / challenge.tasks.length) * 100)
      };
    });

    // Sort by completed tasks, then by progress
    return leaderboard.sort((a, b) => {
      if (b.completedTasks !== a.completedTasks) {
        return b.completedTasks - a.completedTasks;
      }
      return b.progress - a.progress;
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}
