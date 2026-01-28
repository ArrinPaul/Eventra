'use client';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Medal, Award } from 'lucide-react';
import type { User } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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


export default function LeaderboardClient() {
    const { users } = useAuth();
    const rankedUsers = users
        .filter(u => u.role !== 'organizer')
        .sort((a, b) => (b.points || 0) - (a.points || 0));

    return (
        <div className="container py-8">
            <h1 className="text-4xl font-bold font-headline mb-4">Leaderboard</h1>
            <p className="text-muted-foreground mb-8">See who's making the biggest impact at EventOS!</p>
            
            <Card className="glass-effect">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] text-center">Rank</TableHead>
                                <TableHead>Attendee</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedUsers.map((user, index) => {
                                const rank = index + 1;
                                return (
                                    <TableRow key={user.id} className={rank <= 3 ? 'bg-accent/50' : ''}>
                                        <TableCell className={`text-center font-bold ${getRankingColor(rank)}`}>
                                            <div className="flex items-center justify-center">
                                                {getRankingIcon(rank)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-lg">{user.points || 0}</TableCell>
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
