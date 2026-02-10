'use server';

import { recommendSessions, RecommendSessionsInput, RecommendSessionsOutput } from '@/ai/flows/ai-powered-agenda-recommendations';
import { generateAnnouncement, GenerateAnnouncementOutput } from '@/ai/flows/announcer-bot';
import { answerQuestion, AnswerQuestionInput, AnswerQuestionOutput } from '@/ai/flows/event-knowledge-bot';
import { generateAnalyticsInsights, GenerateAnalyticsInsightsInput, GenerateAnalyticsInsightsOutput } from '@/ai/flows/analytics-insights';
import { broadcastEmail, BroadcastEmailInput, BroadcastEmailOutput } from '@/ai/flows/broadcast-email';
import { validateAIAction } from '@/core/utils/ai-auth';


export async function getRecommendedSessions(input: RecommendSessionsInput): Promise<RecommendSessionsOutput> {
    try {
        await validateAIAction('recommendations');
        const recommendations = await recommendSessions(input);
        return recommendations;
    } catch(error) {
        console.error("Error getting recommendations:", error);
        return { recommendations: [] };
    }
}

export async function getBotAnnouncement(session: any): Promise<GenerateAnnouncementOutput> {
    try {
        await validateAIAction('chatbot');
        const announcement = await generateAnnouncement({ session });
        return announcement;
    } catch(error) {
        console.error("Error getting bot announcement:", error);
        throw new Error("Failed to get announcement from bot.");
    }
}

export async function getKnowledgeBotAnswer(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
    try {
        await validateAIAction('chatbot');
        const result = await answerQuestion(input);
        return result;
    } catch(error) {
        console.error("Error getting knowledge bot answer:", error);
        throw new Error("Failed to get answer from AI assistant.");
    }
}

export async function getAnalyticsInsights(input: GenerateAnalyticsInsightsInput): Promise<GenerateAnalyticsInsightsOutput> {
    try {
        await validateAIAction('insights');
        const result = await generateAnalyticsInsights(input);
        return result;
    } catch (error) {
        console.error("Error getting analytics insights:", error);
        throw new Error("Failed to get insights from AI assistant.");
    }
}

export async function sendBroadcastEmail(input: BroadcastEmailInput): Promise<BroadcastEmailOutput> {
    try {
        await validateAIAction('automation');
        const result = await broadcastEmail(input);
        return result;
    } catch (error) {
        console.error("Error sending broadcast email:", error);
        throw new Error("Failed to send broadcast from AI assistant.");
    }
}
