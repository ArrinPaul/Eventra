'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Medal, Award, Trophy, TrendingUp, Users, Flame, Sparkles, Calendar, Filter } from 'lucide-react';
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
    if (rank === 1) return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">ðŸ¥‡ Champion</Badge>;
    if (rank === 2) return <Badge className="bg-gradient-to-r from-slate-400 to-slate-300 text-white">ðŸ¥ˆ Runner-up</Badge>;
    if (rank === 3) return <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white">ðŸ¥‰ Third Place</Badge>;
    return null;
}

type TimeFilter = 'all' | 'weekly' | 'monthly';
type CategoryFilter = 'all' | 'tech' | 'business' | 'design' | 'marketing';

export default function LeaderboardClient() {
    const { user, users } = useAuth();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [showOnlyFollowing, setShowOnlyFollowing] = useState(false);

    // In a real app, these would be filtered by actual time-based points
    // For now, we simulate with point multipliers
    const getFilteredPoints = (basePoints: number, filter: TimeFilter) => {
        switch (filter) {
            case 'weekly':
                return Math.floor(basePoints * 0.15); // ~15% of total as weekly
            case 'monthly':
                return Math.floor(basePoints * 0.4); // ~40% of total as monthly
            default:
                return basePoints;
        }
    };

    const rankedUsers = users
        .filter((u): u is User & { points?: number } => u.role !== 'organizer')
        .map((u) => ({
            ...u,
            displayPoints: getFilteredPoints(u.points || 0, timeFilter),
            photoURL: u.photoURL || (u as any).avatar || undefined,
            // Mock category - in real app, would come from user profile
            category: ['tech', 'business', 'design', 'marketing'][Math.floor(Math.random() * 4)] as CategoryFilter
        }))
        .filter(u => categoryFilter === 'all' || u.category === categoryFilter)
        .sort((a, b) => b.displayPoints - a.displayPoints);

    const currentUserRank = rankedUsers.findIndex(u => u.id === user?.id) + 1;
    const currentUserData = rankedUsers.find(u => u.id === user?.id);

    // Top 3 for podium display
    const topThree = rankedUsers.slice(0, 3);

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-primary" />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground mt-2">See who's making the biggest impact at EventOS!</p>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="tech">ðŸ–¥ï¸ Tech</SelectItem>
                            <SelectItem value="business">ðŸ’¼ Business</SelectItem>
                            <SelectItem value="design">ðŸŽ¨ Design</SelectItem>
                            <SelectItem value="marketing">ðŸ“¢ Marketing</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Time Filter Tabs */}
            <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="weekly" className="gap-2">
                        <Flame className="h-4 w-4" />
                        This Week
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        This Month
                    </TabsTrigger>
                    <TabsTrigger value="all" className="gap-2">
                        <Trophy className="h-4 w-4" />
                        All Time
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Top 3 Podium */}
            {topThree.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {/* Second Place */}
                    <div className="flex flex-col items-center pt-8">
                        <Avatar className="h-16 w-16 border-4 border-slate-400 mb-2">
                            <AvatarImage src={topThree[1]?.photoURL} />
                            <AvatarFallback className="bg-slate-100">{topThree[1]?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Medal className="h-6 w-6 text-slate-400 -mt-4 bg-background rounded-full p-0.5" />
                        <p className="font-semibold text-sm mt-2 text-center">{topThree[1]?.name}</p>
                        <p className="text-lg font-bold text-slate-500">{topThree[1]?.displayPoints} pts</p>
                        <div className="h-24 w-full bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg mt-2" />
                    </div>
                    
                    {/* First Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-amber-400 mb-2">
                                <AvatarImage src={topThree[0]?.photoURL} />
                                <AvatarFallback className="bg-amber-100">{topThree[0]?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Crown className="h-8 w-8 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2" />
                        </div>
                        <p className="font-bold mt-2 text-center">{topThree[0]?.name}</p>
                        <p className="text-xl font-bold text-amber-500">{topThree[0]?.displayPoints} pts</p>
                        <div className="h-32 w-full bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg mt-2" />
                    </div>
                    
                    {/* Third Place */}
                    <div className="flex flex-col items-center pt-12">
                        <Avatar className="h-14 w-14 border-4 border-orange-400 mb-2">
                            <AvatarImage src={topThree[2]?.photoURL} />
                            <AvatarFallback className="bg-orange-100">{topThree[2]?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Award className="h-5 w-5 text-orange-400 -mt-3 bg-background rounded-full p-0.5" />
                        <p className="font-semibold text-sm mt-2 text-center">{topThree[2]?.name}</p>
                        <p className="text-lg font-bold text-orange-500">{topThree[2]?.displayPoints} pts</p>
                        <div className="h-16 w-full bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-lg mt-2" />
                    </div>
                </div>
            )}

            {/* Current User Stats (if logged in and not in top 3) */}
            {user && currentUserRank > 3 && currentUserData && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-primary">#{currentUserRank}</div>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold flex items-center gap-2">
                                        {user.name}
                                        <Badge variant="outline" className="text-xs">You</Badge>
                                    </p>
                                    <p className="text-sm text-muted-foreground">Keep going! You're doing great!</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{currentUserData.displayPoints}</p>
                                <p className="text-sm text-muted-foreground">points</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Full Rankings Table */}
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Full Rankings
                    </CardTitle>
                    <CardDescription>
                        {rankedUsers.length} participants Â· {timeFilter === 'weekly' ? 'This week' : timeFilter === 'monthly' ? 'This month' : 'All time'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] text-center">Rank</TableHead>
                                <TableHead>Attendee</TableHead>
                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedUsers.map((rankedUser, index) => {
                                const rank = index + 1;
                                const isCurrentUser = rankedUser.id === user?.id;
                                return (
                                    <TableRow 
                                        key={rankedUser.id} 
                                        className={cn(
                                            rank <= 3 && 'bg-accent/50',
                                            isCurrentUser && 'bg-primary/10 border-primary/30'
                                        )}
                                    >
                                        <TableCell className={`text-center font-bold ${getRankingColor(rank)}`}>
                                            <div className="flex items-center justify-center">
                                                {getRankingIcon(rank)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={rankedUser.photoURL || undefined} />
                                                    <AvatarFallback>{rankedUser.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        {rankedUser.name}
                                                        {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">{rankedUser.role}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {getRankBadge(rank)}
                                            {rank > 3 && rank <= 10 && (
                                                <Badge variant="outline" className="text-xs">
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                    Top 10
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-lg">
                                            {rankedUser.displayPoints}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {rankedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No users found for this filter
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
