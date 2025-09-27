'use server';

import { recommendSessions, RecommendSessionsInput } from '@/ai/flows/ai-powered-agenda-recommendations';

export async function getRecommendedSessions(input: RecommendSessionsInput) {
    try {
        const recommendations = await recommendSessions(input);
        return recommendations;
    } catch(error) {
        console.error("Error getting recommendations:", error);
        return { recommendedSessions: "Could not retrieve recommendations at this time." };
    }
}
