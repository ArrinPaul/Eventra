'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Crown, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/core/utils/utils';

interface LeaderboardClientProps {
    initialUsers?: any[];
}

export default function LeaderboardClient({ initialUsers = [] }: LeaderboardClientProps) {
    const { user: currentUser } = useAuth();

    const rankedUsers = (initialUsers || [])
        .map((u: any) => ({
            ...u,
            id: u.id,
            displayPoints: u.points || 0,
            avatar: u.image || '',
        }))
        .sort((a: any, b: any) => b.displayPoints - a.displayPoints);

    return (
        <div className="container py-8 space-y-8 text-foreground">
            <h1 className="text-4xl font-bold flex items-center gap-3"><Trophy className="text-primary" /> Leaderboard</h1>
            <Card className="bg-card border-border text-foreground">
                <Table>
                    <TableHeader><TableRow><TableHead className="text-foreground w-12">Rank</TableHead><TableHead className="text-foreground">User</TableHead><TableHead className="text-right text-foreground">Points</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {rankedUsers.map((u: any, i: number) => (
                            <TableRow key={u.id} className={cn(currentUser?.id === u.id && "bg-primary/10")}>
                                <TableCell className="font-bold">
                                    {i === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                                    {i === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                                    {i === 2 && <Award className="h-5 w-5 text-amber-600" />}
                                    {i > 2 && i + 1}
                                </TableCell>
                                <TableCell><div className="flex items-center gap-3"><Avatar><AvatarImage src={u.avatar} /><AvatarFallback>{u.name?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground capitalize">{u.role}</p></div></div></TableCell>
                                <TableCell className="text-right font-bold text-lg">{u.displayPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
