// @ts-nocheck
'use server';

export interface ModerationResult {
  success: boolean;
  isFlagged: boolean;
  reason?: string;
}

export async function moderateContent(content: string, _authorName?: string): Promise<ModerationResult> {
  const text = (content || '').toLowerCase();
  const suspicious = ['spam', 'scam', 'hate', 'abuse'].some((k) => text.includes(k));

  return {
    success: true,
    isFlagged: suspicious,
    reason: suspicious ? 'Potential policy violation detected.' : undefined,
  };
}
