'use server';

export async function moderateContent(_content: string) {
  return { approved: true, reason: 'Mocked moderation' };
}
