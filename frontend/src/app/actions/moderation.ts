'use server';

import { validateRole } from '@/lib/auth-utils';
import { aiModerationFlow } from '@/lib/ai';

/**
 * Moderate content using AI
 */
export async function moderateContent(content: string) {
  // Guard: Authenticated
  await validateRole(['attendee', 'organizer', 'admin', 'professional']);

  try {
    const result = await aiModerationFlow({ content });
    return {
      ...result,
      approved: !result.isFlagged
    };
  } catch (error) {
    console.error('Moderation Error:', error);
    return { isFlagged: false, approved: true }; // Default to safe if AI fails
  }
}
