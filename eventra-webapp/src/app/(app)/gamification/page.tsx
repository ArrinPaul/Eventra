import { GamificationClient } from '@/features/gamification/gamification-client';
import { auth } from '@clerk/nextjs/server';
import { getUserBadges, getUserStats } from '@/app/actions/gamification';
import { db } from '@/lib/db';
import { badges } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export default async function GamificationPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const [userBadges, userStats, allBadges] = await Promise.all([
    getUserBadges(userId),
    getUserStats(userId),
    db.select().from(badges)
  ]);

  return (
    <GamificationClient
      initialBadges={userBadges}
      stats={userStats}
      allBadges={allBadges}
    />
  );
}
