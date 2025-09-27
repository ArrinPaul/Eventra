'use server';

import { recommendSessions, RecommendSessionsInput, RecommendSessionsOutput } from '@/ai/flows/ai-powered-agenda-recommendations';

export async function getRecommendedSessions(input: RecommendSessionsInput): Promise<RecommendSessionsOutput> {
    try {
        const recommendations = await recommendSessions(input);
        return recommendations;
    } catch(error) {
        console.error("Error getting recommendations:", error);
        return { recommendations: [] };
    }
}
