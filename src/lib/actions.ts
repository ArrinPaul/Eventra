'use server';

import { recommendSessions, RecommendSessionsInput, RecommendSessionsOutput } from '@/ai/flows/ai-powered-agenda-recommendations';
import { generateAnnouncement, GenerateAnnouncementOutput } from '@/ai/flows/announcer-bot';

export async function getRecommendedSessions(input: RecommendSessionsInput): Promise<RecommendSessionsOutput> {
    try {
        const recommendations = await recommendSessions(input);
        return recommendations;
    } catch(error) {
        console.error("Error getting recommendations:", error);
        return { recommendations: [] };
    }
}

export async function getBotAnnouncement(): Promise<GenerateAnnouncementOutput> {
    try {
        const announcement = await generateAnnouncement();
        return announcement;
    } catch(error) {
        console.error("Error getting bot announcement:", error);
        throw new Error("Failed to get announcement from bot.");
    }
}
