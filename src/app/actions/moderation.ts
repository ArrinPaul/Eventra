'use server';

import { contentModeratorFlow } from '@/ai/flows/ai-moderator';

export async function moderateContent(content: string, authorName?: string) {
  try {
    const result = await contentModeratorFlow({ content, authorName });
    return { success: true, ...result };
  } catch (error: any) {
    console.error('Moderation action error:', error);
    return { success: false, error: error.message || 'Moderation failed' };
  }
}
