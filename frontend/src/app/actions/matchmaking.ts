'use server';

export interface MatchRecommendation {
  userId: string;
  name: string;
  score: number;
  rationale?: string;
}

export interface MatchmakingResult {
  recommendations: MatchRecommendation[];
  strategy?: { weeklyPlan: string };
  error?: string;
}

export async function getMatchmakingRecommendations(_userId?: string): Promise<MatchmakingResult> {
  return {
    recommendations: [],
    strategy: {
      weeklyPlan: 'Review suggested profiles and send 2-3 focused connection requests.',
    },
  };
}
