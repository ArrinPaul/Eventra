'use server';

import { recommendSessions, RecommendSessionsInput, RecommendSessionsOutput } from '@/ai/flows/ai-powered-agenda-recommendations';
import { generateAnnouncement, GenerateAnnouncementOutput } from '@/ai/flows/announcer-bot';
import { answerQuestion, AnswerQuestionInput, AnswerQuestionOutput } from '@/ai/flows/event-knowledge-bot';


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

export async function getKnowledgeBotAnswer(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
    try {
        const result = await answerQuestion(input);
        return result;
    } catch(error) {
        console.error("Error getting knowledge bot answer:", error);
        throw new Error("Failed to get answer from AI assistant.");
    }
}
