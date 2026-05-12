import { GamificationClient } from '@/features/gamification/gamification-client';
import { auth } from '@/auth';
import { getUserBadges, getUserStats } from '@/app/actions/gamification';
import { db } from '@/lib/db';
import { badges } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export default async function GamificationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

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
