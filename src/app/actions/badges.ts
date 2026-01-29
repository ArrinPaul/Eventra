'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';

// Badge definitions
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'attendance' | 'networking' | 'engagement' | 'achievement' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  criteria: {
    type: 'event_attendance' | 'connections' | 'posts' | 'check_ins' | 'streak' | 'points' | 'special';
    threshold: number;
    eventCategory?: string;
  };
  isHidden: boolean;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  userId: string;
  earnedAt: Date;
  isNew: boolean;
  eventId?: string;
}

// Default badge definitions
export const DEFAULT_BADGES: BadgeDefinition[] = [
  // Attendance Badges
  {
    id: 'first_event',
    name: 'First Steps',
    description: 'Attended your first event',
    icon: '🎉',
    category: 'attendance',
    rarity: 'common',
    xpReward: 50,
    criteria: { type: 'event_attendance', threshold: 1 },
    isHidden: false
  },
  {
    id: 'event_explorer',
    name: 'Event Explorer',
    description: 'Attended 5 different events',
    icon: '🔍',
    category: 'attendance',
    rarity: 'uncommon',
    xpReward: 100,
    criteria: { type: 'event_attendance', threshold: 5 },
    isHidden: false
  },
  {
    id: 'event_enthusiast',
    name: 'Event Enthusiast',
    description: 'Attended 10 different events',
    icon: '⭐',
    category: 'attendance',
    rarity: 'rare',
    xpReward: 200,
    criteria: { type: 'event_attendance', threshold: 10 },
    isHidden: false
  },
  {
    id: 'event_master',
    name: 'Event Master',
    description: 'Attended 25 different events',
    icon: '👑',
    category: 'attendance',
    rarity: 'epic',
    xpReward: 500,
    criteria: { type: 'event_attendance', threshold: 25 },
    isHidden: false
  },
  {
    id: 'event_legend',
    name: 'Event Legend',
    description: 'Attended 50 different events',
    icon: '🏆',
    category: 'attendance',
    rarity: 'legendary',
    xpReward: 1000,
    criteria: { type: 'event_attendance', threshold: 50 },
    isHidden: false
  },
  
  // Tech Category Badges
  {
    id: 'tech_curious',
    name: 'Tech Curious',
    description: 'Attended 3 technology events',
    icon: '💻',
    category: 'attendance',
    rarity: 'uncommon',
    xpReward: 75,
    criteria: { type: 'event_attendance', threshold: 3, eventCategory: 'Technology' },
    isHidden: false
  },
  {
    id: 'tech_geek',
    name: 'Tech Geek',
    description: 'Attended 10 technology events',
    icon: '🤖',
    category: 'attendance',
    rarity: 'rare',
    xpReward: 200,
    criteria: { type: 'event_attendance', threshold: 10, eventCategory: 'Technology' },
    isHidden: false
  },

  // Networking Badges
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Connected with 5 people',
    icon: '🦋',
    category: 'networking',
    rarity: 'common',
    xpReward: 50,
    criteria: { type: 'connections', threshold: 5 },
    isHidden: false
  },
  {
    id: 'networking_pro',
    name: 'Networking Pro',
    description: 'Connected with 20 people',
    icon: '🤝',
    category: 'networking',
    rarity: 'uncommon',
    xpReward: 150,
    criteria: { type: 'connections', threshold: 20 },
    isHidden: false
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Connected with 50 people',
    icon: '📢',
    category: 'networking',
    rarity: 'rare',
    xpReward: 300,
    criteria: { type: 'connections', threshold: 50 },
    isHidden: false
  },
  {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Connected with 100 people',
    icon: '🌟',
    category: 'networking',
    rarity: 'epic',
    xpReward: 750,
    criteria: { type: 'connections', threshold: 100 },
    isHidden: false
  },

  // Engagement Badges
  {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Created your first community post',
    icon: '💬',
    category: 'engagement',
    rarity: 'common',
    xpReward: 25,
    criteria: { type: 'posts', threshold: 1 },
    isHidden: false
  },
  {
    id: 'active_contributor',
    name: 'Active Contributor',
    description: 'Created 10 community posts',
    icon: '✍️',
    category: 'engagement',
    rarity: 'uncommon',
    xpReward: 100,
    criteria: { type: 'posts', threshold: 10 },
    isHidden: false
  },
  {
    id: 'thought_leader',
    name: 'Thought Leader',
    description: 'Created 50 community posts',
    icon: '🎓',
    category: 'engagement',
    rarity: 'rare',
    xpReward: 300,
    criteria: { type: 'posts', threshold: 50 },
    isHidden: false
  },

  // Check-in Badges
  {
    id: 'punctual',
    name: 'Punctual',
    description: 'Checked in to 5 events on time',
    icon: '⏰',
    category: 'attendance',
    rarity: 'common',
    xpReward: 50,
    criteria: { type: 'check_ins', threshold: 5 },
    isHidden: false
  },
  {
    id: 'reliable',
    name: 'Reliable Attendee',
    description: 'Checked in to 20 events',
    icon: '✅',
    category: 'attendance',
    rarity: 'uncommon',
    xpReward: 150,
    criteria: { type: 'check_ins', threshold: 20 },
    isHidden: false
  },

  // Streak Badges
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day activity streak',
    icon: '🔥',
    category: 'achievement',
    rarity: 'uncommon',
    xpReward: 100,
    criteria: { type: 'streak', threshold: 7 },
    isHidden: false
  },
  {
    id: 'month_maven',
    name: 'Month Maven',
    description: 'Maintained a 30-day activity streak',
    icon: '🌙',
    category: 'achievement',
    rarity: 'rare',
    xpReward: 300,
    criteria: { type: 'streak', threshold: 30 },
    isHidden: false
  },
  {
    id: 'streak_legend',
    name: 'Streak Legend',
    description: 'Maintained a 100-day activity streak',
    icon: '💎',
    category: 'achievement',
    rarity: 'legendary',
    xpReward: 1000,
    criteria: { type: 'streak', threshold: 100 },
    isHidden: false
  },

  // Points Badges
  {
    id: 'point_collector',
    name: 'Point Collector',
    description: 'Earned 500 total points',
    icon: '🪙',
    category: 'achievement',
    rarity: 'common',
    xpReward: 50,
    criteria: { type: 'points', threshold: 500 },
    isHidden: false
  },
  {
    id: 'point_hoarder',
    name: 'Point Hoarder',
    description: 'Earned 2000 total points',
    icon: '💰',
    category: 'achievement',
    rarity: 'uncommon',
    xpReward: 150,
    criteria: { type: 'points', threshold: 2000 },
    isHidden: false
  },
  {
    id: 'point_mogul',
    name: 'Point Mogul',
    description: 'Earned 5000 total points',
    icon: '💎',
    category: 'achievement',
    rarity: 'rare',
    xpReward: 350,
    criteria: { type: 'points', threshold: 5000 },
    isHidden: false
  },

  // Special/Hidden Badges
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Registered for an event within 24 hours of it being published',
    icon: '🐦',
    category: 'special',
    rarity: 'rare',
    xpReward: 100,
    criteria: { type: 'special', threshold: 1 },
    isHidden: true
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Attended an event that ended after midnight',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    xpReward: 100,
    criteria: { type: 'special', threshold: 1 },
    isHidden: true
  },
  {
    id: 'feedback_champion',
    name: 'Feedback Champion',
    description: 'Left feedback on 10 events',
    icon: '📝',
    category: 'engagement',
    rarity: 'uncommon',
    xpReward: 100,
    criteria: { type: 'special', threshold: 10 },
    isHidden: false
  },
  {
    id: 'perfect_attendance',
    name: 'Perfect Attendance',
    description: 'Attended every session of a multi-day event',
    icon: '🎯',
    category: 'special',
    rarity: 'epic',
    xpReward: 250,
    criteria: { type: 'special', threshold: 1 },
    isHidden: true
  }
];

// Get all badge definitions
export async function getBadgeDefinitions(): Promise<BadgeDefinition[]> {
  return DEFAULT_BADGES;
}

// Get user's earned badges
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (!db) return [];
  
  try {
    const badgesRef = collection(db, 'userBadges');
    const q = query(badgesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      earnedAt: doc.data().earnedAt?.toDate() || new Date()
    })) as UserBadge[];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
}

// Award a badge to a user
export async function awardBadge(
  userId: string, 
  badgeId: string, 
  eventId?: string
): Promise<{ success: boolean; badge?: BadgeDefinition; alreadyEarned?: boolean }> {
  if (!db) return { success: false };
  
  try {
    // Check if user already has this badge
    const existingBadges = await getUserBadges(userId);
    if (existingBadges.some(b => b.badgeId === badgeId)) {
      return { success: true, alreadyEarned: true };
    }

    // Find the badge definition
    const badge = DEFAULT_BADGES.find(b => b.id === badgeId);
    if (!badge) return { success: false };

    // Award the badge
    const userBadgeRef = doc(collection(db, 'userBadges'));
    const userBadge: Omit<UserBadge, 'id'> = {
      badgeId,
      userId,
      earnedAt: new Date(),
      isNew: true,
      eventId
    };
    
    await setDoc(userBadgeRef, {
      ...userBadge,
      earnedAt: serverTimestamp()
    });

    // Award XP for the badge
    await awardXPForBadge(userId, badge.xpReward, badge.name);

    return { success: true, badge };
  } catch (error) {
    console.error('Error awarding badge:', error);
    return { success: false };
  }
}

// Award XP for a badge (internal)
async function awardXPForBadge(userId: string, amount: number, badgeName: string): Promise<void> {
  if (!db) return;
  
  try {
    const userXPRef = doc(db, 'userXP', userId);
    const userXPDoc = await getDoc(userXPRef);
    
    const xpTransaction = {
      id: `badge_${Date.now()}`,
      amount,
      reason: `Earned badge: ${badgeName}`,
      category: 'badge',
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

// Award XP for user actions (exported)
export async function awardXP(userId: string, amount: number, reason: string): Promise<void> {
  if (!db) return;
  
  try {
    const userXPRef = doc(db, 'userXP', userId);
    const userXPDoc = await getDoc(userXPRef);
    
    const xpTransaction = {
      id: `action_${Date.now()}`,
      amount,
      reason,
      category: 'action',
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

// Auto-check and award badges based on user stats
export async function checkAndAwardBadges(
  userId: string,
  stats: {
    eventsAttended?: number;
    connections?: number;
    posts?: number;
    checkIns?: number;
    currentStreak?: number;
    totalPoints?: number;
    eventCategories?: { [category: string]: number };
  }
): Promise<BadgeDefinition[]> {
  const earnedBadges: BadgeDefinition[] = [];
  const existingBadges = await getUserBadges(userId);
  const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

  for (const badge of DEFAULT_BADGES) {
    // Skip if already earned
    if (existingBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.criteria.type) {
      case 'event_attendance':
        if (badge.criteria.eventCategory && stats.eventCategories) {
          shouldAward = (stats.eventCategories[badge.criteria.eventCategory] || 0) >= badge.criteria.threshold;
        } else {
          shouldAward = (stats.eventsAttended || 0) >= badge.criteria.threshold;
        }
        break;
      
      case 'connections':
        shouldAward = (stats.connections || 0) >= badge.criteria.threshold;
        break;
      
      case 'posts':
        shouldAward = (stats.posts || 0) >= badge.criteria.threshold;
        break;
      
      case 'check_ins':
        shouldAward = (stats.checkIns || 0) >= badge.criteria.threshold;
        break;
      
      case 'streak':
        shouldAward = (stats.currentStreak || 0) >= badge.criteria.threshold;
        break;
      
      case 'points':
        shouldAward = (stats.totalPoints || 0) >= badge.criteria.threshold;
        break;
      
      // Special badges require manual triggering
      case 'special':
        break;
    }

    if (shouldAward) {
      const result = await awardBadge(userId, badge.id);
      if (result.success && !result.alreadyEarned) {
        earnedBadges.push(badge);
      }
    }
  }

  return earnedBadges;
}

// Mark badge as seen (no longer new)
export async function markBadgeAsSeen(userBadgeId: string): Promise<boolean> {
  if (!db) return false;
  
  try {
    const badgeRef = doc(db, 'userBadges', userBadgeId);
    await updateDoc(badgeRef, { isNew: false });
    return true;
  } catch (error) {
    console.error('Error marking badge as seen:', error);
    return false;
  }
}

// Get badge progress for a user
export async function getBadgeProgress(
  userId: string,
  stats: {
    eventsAttended?: number;
    connections?: number;
    posts?: number;
    checkIns?: number;
    currentStreak?: number;
    totalPoints?: number;
    eventCategories?: { [category: string]: number };
  }
): Promise<Array<{ badge: BadgeDefinition; progress: number; isEarned: boolean }>> {
  const existingBadges = await getUserBadges(userId);
  const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

  return DEFAULT_BADGES.filter(b => !b.isHidden || existingBadgeIds.has(b.id)).map(badge => {
    const isEarned = existingBadgeIds.has(badge.id);
    let progress = 0;

    if (!isEarned) {
      switch (badge.criteria.type) {
        case 'event_attendance':
          if (badge.criteria.eventCategory && stats.eventCategories) {
            progress = Math.min(100, ((stats.eventCategories[badge.criteria.eventCategory] || 0) / badge.criteria.threshold) * 100);
          } else {
            progress = Math.min(100, ((stats.eventsAttended || 0) / badge.criteria.threshold) * 100);
          }
          break;
        
        case 'connections':
          progress = Math.min(100, ((stats.connections || 0) / badge.criteria.threshold) * 100);
          break;
        
        case 'posts':
          progress = Math.min(100, ((stats.posts || 0) / badge.criteria.threshold) * 100);
          break;
        
        case 'check_ins':
          progress = Math.min(100, ((stats.checkIns || 0) / badge.criteria.threshold) * 100);
          break;
        
        case 'streak':
          progress = Math.min(100, ((stats.currentStreak || 0) / badge.criteria.threshold) * 100);
          break;
        
        case 'points':
          progress = Math.min(100, ((stats.totalPoints || 0) / badge.criteria.threshold) * 100);
          break;
        
        case 'special':
          progress = 0;
          break;
      }
    } else {
      progress = 100;
    }

    return { badge, progress, isEarned };
  });
}
