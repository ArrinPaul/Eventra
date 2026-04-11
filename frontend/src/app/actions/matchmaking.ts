'use server';

export interface MatchmakingResult {
  id: string;
  name: string;
  role: string;
  matchScore: number;
  reason: string;
}

export async function getMatchmakingRecommendations(_userId: string): Promise<MatchmakingResult[]> {
  return [];
}
