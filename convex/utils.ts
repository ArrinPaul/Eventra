/**
 * Calculate user level based on total XP
 * Formula: Math.floor(xp / 500) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor((xp || 0) / 500) + 1;
}

/**
 * Calculate XP needed for the next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 500;
}
