/**
 * Unit Tests for Gamification System
 * Tests points, badges, and leaderboard logic
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Types
interface UserStats {
  eventsAttended: number;
  eventsOrganized: number;
  connectionsCount: number;
  postsCreated: number;
  commentsCount: number;
  checkInsCount: number;
  feedbackGiven: number;
  certificatesEarned: number;
  totalPoints: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'attendance' | 'networking' | 'engagement' | 'achievement' | 'special';
  requirement: (stats: UserStats) => boolean;
  points: number;
}

interface PointAction {
  type: string;
  points: number;
  description: string;
}

// Point values
const POINT_VALUES: Record<string, number> = {
  REGISTER_EVENT: 10,
  ATTEND_EVENT: 25,
  CHECK_IN: 15,
  CONNECT_USER: 5,
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  RECEIVE_LIKE: 2,
  GIVE_FEEDBACK: 15,
  EARN_CERTIFICATE: 50,
  ORGANIZE_EVENT: 100,
  REFER_USER: 30,
  COMPLETE_PROFILE: 20,
  STREAK_BONUS: 10,
};

// Badge definitions
const BADGES: Badge[] = [
  {
    id: 'first_event',
    name: 'First Steps',
    description: 'Attend your first event',
    icon: '🎯',
    rarity: 'common',
    category: 'attendance',
    requirement: (stats) => stats.eventsAttended >= 1,
    points: 25,
  },
  {
    id: 'event_regular',
    name: 'Event Regular',
    description: 'Attend 5 events',
    icon: '🏃',
    rarity: 'uncommon',
    category: 'attendance',
    requirement: (stats) => stats.eventsAttended >= 5,
    points: 100,
  },
  {
    id: 'event_enthusiast',
    name: 'Event Enthusiast',
    description: 'Attend 25 events',
    icon: '🔥',
    rarity: 'rare',
    category: 'attendance',
    requirement: (stats) => stats.eventsAttended >= 25,
    points: 500,
  },
  {
    id: 'networking_starter',
    name: 'Networking Starter',
    description: 'Make 5 connections',
    icon: '🤝',
    rarity: 'common',
    category: 'networking',
    requirement: (stats) => stats.connectionsCount >= 5,
    points: 50,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Make 50 connections',
    icon: '🦋',
    rarity: 'epic',
    category: 'networking',
    requirement: (stats) => stats.connectionsCount >= 50,
    points: 750,
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Create 10 posts',
    icon: '✍️',
    rarity: 'uncommon',
    category: 'engagement',
    requirement: (stats) => stats.postsCreated >= 10,
    points: 150,
  },
  {
    id: 'organizer',
    name: 'Event Organizer',
    description: 'Organize your first event',
    icon: '🎪',
    rarity: 'rare',
    category: 'achievement',
    requirement: (stats) => stats.eventsOrganized >= 1,
    points: 300,
  },
  {
    id: 'master_organizer',
    name: 'Master Organizer',
    description: 'Organize 10 events',
    icon: '👑',
    rarity: 'legendary',
    category: 'achievement',
    requirement: (stats) => stats.eventsOrganized >= 10,
    points: 2000,
  },
  {
    id: 'feedback_champion',
    name: 'Feedback Champion',
    description: 'Give feedback on 20 events',
    icon: '⭐',
    rarity: 'rare',
    category: 'engagement',
    requirement: (stats) => stats.feedbackGiven >= 20,
    points: 400,
  },
];

// Gamification functions
function calculateLevel(points: number): { level: number; currentXP: number; xpForNextLevel: number; progress: number } {
  // XP required for level n: 100 * n * (n + 1) / 2
  let level = 1;
  let totalXPRequired = 0;
  
  while (true) {
    const xpForLevel = 100 * level;
    if (totalXPRequired + xpForLevel > points) {
      const currentXP = points - totalXPRequired;
      return {
        level,
        currentXP,
        xpForNextLevel: xpForLevel,
        progress: Math.round((currentXP / xpForLevel) * 100),
      };
    }
    totalXPRequired += xpForLevel;
    level++;
  }
}

function awardPoints(currentPoints: number, action: keyof typeof POINT_VALUES): { newTotal: number; awarded: number } {
  const awarded = POINT_VALUES[action] || 0;
  return {
    newTotal: currentPoints + awarded,
    awarded,
  };
}

function checkBadgeEligibility(stats: UserStats, earnedBadgeIds: string[]): Badge[] {
  return BADGES.filter(
    badge => !earnedBadgeIds.includes(badge.id) && badge.requirement(stats)
  );
}

function calculateLeaderboardPosition(
  userPoints: number,
  allUserPoints: number[]
): { rank: number; percentile: number; totalUsers: number } {
  const sortedPoints = [...allUserPoints].sort((a, b) => b - a);
  const rank = sortedPoints.findIndex(p => p === userPoints) + 1;
  const percentile = Math.round(((allUserPoints.length - rank) / allUserPoints.length) * 100);
  
  return {
    rank,
    percentile,
    totalUsers: allUserPoints.length,
  };
}

function calculateStreak(attendanceDates: Date[]): { currentStreak: number; longestStreak: number } {
  if (attendanceDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates
  const sortedDates = [...attendanceDates].sort((a, b) => a.getTime() - b.getTime());
  
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = Math.floor(
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (dayDiff <= 7) { // Within a week counts as streak
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  // Check if current streak is active (last attendance within 7 days)
  const lastDate = sortedDates[sortedDates.length - 1];
  const daysSinceLastAttendance = Math.floor(
    (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  currentStreak = daysSinceLastAttendance <= 7 ? tempStreak : 0;
  
  return { currentStreak, longestStreak };
}

// Tests
describe('Point System', () => {
  it('should award correct points for actions', () => {
    expect(awardPoints(0, 'REGISTER_EVENT')).toEqual({ newTotal: 10, awarded: 10 });
    expect(awardPoints(100, 'ATTEND_EVENT')).toEqual({ newTotal: 125, awarded: 25 });
    expect(awardPoints(50, 'ORGANIZE_EVENT')).toEqual({ newTotal: 150, awarded: 100 });
  });

  it('should handle unknown actions', () => {
    expect(awardPoints(100, 'UNKNOWN_ACTION' as any)).toEqual({ newTotal: 100, awarded: 0 });
  });

  it('should accumulate points correctly', () => {
    let points = 0;
    
    const r1 = awardPoints(points, 'REGISTER_EVENT');
    points = r1.newTotal;
    
    const r2 = awardPoints(points, 'ATTEND_EVENT');
    points = r2.newTotal;
    
    const r3 = awardPoints(points, 'GIVE_FEEDBACK');
    points = r3.newTotal;
    
    expect(points).toBe(50); // 10 + 25 + 15
  });
});

describe('Level Calculation', () => {
  it('should start at level 1 with 0 points', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(0);
    expect(result.xpForNextLevel).toBe(100);
    expect(result.progress).toBe(0);
  });

  it('should calculate progress within a level', () => {
    const result = calculateLevel(50);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(50);
    expect(result.progress).toBe(50);
  });

  it('should level up correctly', () => {
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(0);
    expect(result.xpForNextLevel).toBe(200);
  });

  it('should handle high point values', () => {
    const result = calculateLevel(1000);
    expect(result.level).toBeGreaterThan(3);
  });
});

describe('Badge System', () => {
  let stats: UserStats;

  beforeEach(() => {
    stats = {
      eventsAttended: 0,
      eventsOrganized: 0,
      connectionsCount: 0,
      postsCreated: 0,
      commentsCount: 0,
      checkInsCount: 0,
      feedbackGiven: 0,
      certificatesEarned: 0,
      totalPoints: 0,
    };
  });

  it('should award first event badge', () => {
    stats.eventsAttended = 1;
    const eligible = checkBadgeEligibility(stats, []);
    
    expect(eligible.some(b => b.id === 'first_event')).toBe(true);
  });

  it('should not award already earned badges', () => {
    stats.eventsAttended = 1;
    const eligible = checkBadgeEligibility(stats, ['first_event']);
    
    expect(eligible.some(b => b.id === 'first_event')).toBe(false);
  });

  it('should award multiple badges when criteria met', () => {
    stats.eventsAttended = 5;
    stats.connectionsCount = 5;
    const eligible = checkBadgeEligibility(stats, []);
    
    expect(eligible.length).toBeGreaterThanOrEqual(3);
    expect(eligible.some(b => b.id === 'first_event')).toBe(true);
    expect(eligible.some(b => b.id === 'event_regular')).toBe(true);
    expect(eligible.some(b => b.id === 'networking_starter')).toBe(true);
  });

  it('should not award badges when criteria not met', () => {
    stats.eventsAttended = 4;
    const eligible = checkBadgeEligibility(stats, []);
    
    expect(eligible.some(b => b.id === 'event_regular')).toBe(false);
  });

  it('should award legendary badge for master organizer', () => {
    stats.eventsOrganized = 10;
    const eligible = checkBadgeEligibility(stats, []);
    
    const masterOrganizer = eligible.find(b => b.id === 'master_organizer');
    expect(masterOrganizer).toBeDefined();
    expect(masterOrganizer!.rarity).toBe('legendary');
  });
});

describe('Leaderboard', () => {
  const samplePoints = [1000, 850, 720, 650, 500, 450, 300, 200, 150, 100];

  it('should calculate rank correctly', () => {
    const result = calculateLeaderboardPosition(850, samplePoints);
    expect(result.rank).toBe(2);
  });

  it('should calculate first place', () => {
    const result = calculateLeaderboardPosition(1000, samplePoints);
    expect(result.rank).toBe(1);
    expect(result.percentile).toBe(90);
  });

  it('should calculate last place', () => {
    const result = calculateLeaderboardPosition(100, samplePoints);
    expect(result.rank).toBe(10);
    expect(result.percentile).toBe(0);
  });

  it('should return total users count', () => {
    const result = calculateLeaderboardPosition(500, samplePoints);
    expect(result.totalUsers).toBe(10);
  });
});

describe('Streak Calculation', () => {
  it('should return 0 for no attendance', () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('should count single attendance', () => {
    const result = calculateStreak([new Date()]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('should count consecutive weekly attendance', () => {
    const now = Date.now();
    const dates = [
      new Date(now - 14 * 24 * 60 * 60 * 1000),
      new Date(now - 7 * 24 * 60 * 60 * 1000),
      new Date(now),
    ];
    
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('should break streak after 7 days', () => {
    const now = Date.now();
    const dates = [
      new Date(now - 30 * 24 * 60 * 60 * 1000),
      new Date(now - 20 * 24 * 60 * 60 * 1000),
    ];
    
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(0); // More than 7 days ago
    expect(result.longestStreak).toBe(1); // No consecutive
  });
});

describe('Badge Rarity Distribution', () => {
  it('should have badges of all rarities', () => {
    const rarities = new Set(BADGES.map(b => b.rarity));
    expect(rarities.has('common')).toBe(true);
    expect(rarities.has('uncommon')).toBe(true);
    expect(rarities.has('rare')).toBe(true);
    expect(rarities.has('epic')).toBe(true);
    expect(rarities.has('legendary')).toBe(true);
  });

  it('should have more common badges than legendary', () => {
    const commonCount = BADGES.filter(b => b.rarity === 'common').length;
    const legendaryCount = BADGES.filter(b => b.rarity === 'legendary').length;
    expect(commonCount).toBeGreaterThanOrEqual(legendaryCount);
  });

  it('should award more points for rarer badges', () => {
    const commonBadge = BADGES.find(b => b.rarity === 'common');
    const legendaryBadge = BADGES.find(b => b.rarity === 'legendary');
    expect(legendaryBadge!.points).toBeGreaterThan(commonBadge!.points);
  });
});
