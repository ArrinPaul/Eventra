'use server';

import { validateRole } from '@/lib/auth-utils';

export async function moderateContent(_content: string) {
  // Guard: Admin only
  await validateRole(['admin']);
  
  return { approved: true, reason: 'Mocked moderation' };
}
