import LeaderboardClient from '@/features/leaderboard/leaderboard-client';
import { getLeaderboard } from '@/app/actions/users';

export default async function LeaderboardPage() {
  const users = await getLeaderboard();
  return <LeaderboardClient initialUsers={users} />;
}
