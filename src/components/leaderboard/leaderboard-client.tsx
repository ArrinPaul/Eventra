'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Medal, Award, Trophy, TrendingUp, Users, Flame, Calendar, Filter } from 'lucide-react';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/core/utils/utils';

const getRankingColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-muted-foreground';
}

const getRankingIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5" />;
    if (rank === 2) return <Medal className="h-5 w-5" />;
    if (rank === 3) return <Award className="h-5 w-5" />;
    return <span className="font-mono text-sm">{rank}</span>;
}

const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">🏆 Champion</Badge>;
    if (rank === 2) return <Badge className="bg-gradient-to-r from-slate-400 to-slate-300 text-white">🥈 Runner-up</Badge>;
    if (rank === 3) return <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white">🥉 Third Place</Badge>;
    return null;
}

type TimeFilter = 'all' | 'weekly' | 'monthly';
type CategoryFilter = 'all' | 'tech' | 'business' | 'design' | 'marketing';

export default function LeaderboardClient() {
    const { user: currentUser } = useAuth();
    const allUsersRaw = useQuery(api.users.list);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

    const getFilteredPoints = (basePoints: number, filter: TimeFilter) => {
        switch (filter) {
            case 'weekly': return Math.floor(basePoints * 0.15);
            case 'monthly': return Math.floor(basePoints * 0.4);
            default: return basePoints;
        }
    };

    const rankedUsers = (allUsersRaw || [])
        .filter((u: any) => u.role !== 'organizer' && u.role !== 'admin')
        .map((u: any) => ({
            ...u,
            id: u._id,
            displayPoints: getFilteredPoints(u.points || 0, timeFilter),
            photoURL: u.image || u.photoURL || undefined,
            category: 'tech' // Placeholder
        }))
        .sort((a, b) => b.displayPoints - a.displayPoints);

    const currentUserRank = rankedUsers.findIndex(u => u.id === (currentUser?._id || currentUser?.id)) + 1;
    const currentUserData = rankedUsers.find(u => u.id === (currentUser?._id || currentUser?.id));

    const topThree = rankedUsers.slice(0, 3);

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-primary" /> Leaderboard
                    </h1>
                    <p className="text-muted-foreground mt-2">See who&apos;s making the biggest impact at Eventra!</p>
                </div>
            </div>

            {topThree.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center pt-8">
                        <Avatar className="h-16 w-16 border-4 border-slate-400 mb-2">
                            <AvatarImage src={topThree[1]?.photoURL} />
                            <AvatarFallback>{topThree[1]?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Medal className="h-6 w-6 text-slate-400 -mt-4 bg-background rounded-full p-0.5" />
                        <p className="font-semibold text-sm mt-2 text-center text-white">{topThree[1]?.name}</p>
                        <p className="text-lg font-bold text-slate-500">{topThree[1]?.displayPoints} pts</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-amber-400 mb-2">
                                <AvatarImage src={topThree[0]?.photoURL} />
                                <AvatarFallback>{topThree[0]?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Crown className="h-8 w-8 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2" />
                        </div>
                        <p className="font-bold mt-2 text-center text-white">{topThree[0]?.name}</p>
                        <p className="text-xl font-bold text-amber-500">{topThree[0]?.displayPoints} pts</p>
                    </div>
                    <div className="flex flex-col items-center pt-12">
                        <Avatar className="h-14 w-14 border-4 border-orange-400 mb-2">
                            <AvatarImage src={topThree[2]?.photoURL} />
                            <AvatarFallback>{topThree[2]?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Award className="h-5 w-5 text-orange-400 -mt-3 bg-background rounded-full p-0.5" />
                        <p className="font-semibold text-sm mt-2 text-center text-white">{topThree[2]?.name}</p>
                        <p className="text-lg font-bold text-orange-500">{topThree[2]?.displayPoints} pts</p>
                    </div>
                </div>
            )}

            {currentUserData && currentUserRank > 3 && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-white">
                            <div className="text-2xl font-bold text-primary">#{currentUserRank}</div>
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={currentUserData.photoURL} />
                                <AvatarFallback>{currentUserData.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{currentUserData.name} <Badge variant="outline" className="text-xs">You</Badge></p>
                            </div>
                        </div>
                        <div className="text-right text-white">
                            <p className="text-2xl font-bold">{currentUserData.displayPoints}</p>
                            <p className="text-sm text-muted-foreground">points</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Users className="h-5 w-5" /> Full Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] text-center text-white">Rank</TableHead>
                                <TableHead className="text-white">Attendee</TableHead>
                                <TableHead className="text-right text-white">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedUsers.map((rankedUser, index) => {
                                const rank = index + 1;
                                const isCurrentUser = rankedUser.id === (currentUser?._id || currentUser?.id);
                                return (
                                    <TableRow key={rankedUser.id} className={cn(isCurrentUser && 'bg-primary/10')}>
                                        <TableCell className={cn("text-center font-bold", getRankingColor(rank))}>
                                            {getRankingIcon(rank)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 text-white">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={rankedUser.photoURL} />
                                                    <AvatarFallback>{rankedUser.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{rankedUser.name} {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{rankedUser.role}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-lg text-white">
                                            {rankedUser.displayPoints}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}