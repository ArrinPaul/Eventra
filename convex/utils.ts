/**
 * Calculate user level based on total XP
 * Formula: Each level requires 500 XP
 */
export function calculateLevel(xp: number): number {
  return Math.floor((xp || 0) / 500) + 1;
}

/**
 * Get detailed level information
 */
export function getLevelInfo(xp: number) {
  const level = calculateLevel(xp);
  const xpInCurrentLevel = xp % 500;
  const xpForNextLevel = 500;
  const progress = Math.floor((xpInCurrentLevel / xpForNextLevel) * 100);
  
  return {
    level,
    xpInCurrentLevel,
    xpForNextLevel,
    progress
  };
}

/**
 * Calculate total XP needed for a specific level
 */
export function totalXpForLevel(level: number): number {
  return (level - 1) * 500;
}
