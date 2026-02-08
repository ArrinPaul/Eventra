'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Crown, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/core/utils/utils';

export default function LeaderboardClient() {
    const { user: currentUser } = useAuth();
    const allUsersRaw = useQuery(api.users.list);
    const [timeFilter] = useState('all');

    const rankedUsers = (allUsersRaw || [])
        .filter((u: any) => u.role !== 'organizer' && u.role !== 'admin')
        .map((u: any) => ({
            ...u,
            id: u._id,
            displayPoints: u.points || 0,
            avatar: u.image || '',
        }))
        .sort((a: any, b: any) => b.displayPoints - a.displayPoints);

    const currentUserRank = rankedUsers.findIndex((u: any) => u.id === (currentUser?._id || currentUser?.id)) + 1;
    const currentUserData = rankedUsers.find((u: any) => u.id === (currentUser?._id || currentUser?.id));

    return (
        <div className="container py-8 space-y-8 text-white">
            <h1 className="text-4xl font-bold flex items-center gap-3"><Trophy className="text-primary" /> Leaderboard</h1>
            <Card className="bg-white/5 border-white/10 text-white">
                <Table>
                    <TableHeader><TableRow><TableHead className="text-white">Rank</TableHead><TableHead className="text-white">User</TableHead><TableHead className="text-right text-white">Points</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {rankedUsers.map((u: any, i: number) => (
                            <TableRow key={u.id} className={cn((currentUser?._id || currentUser?.id) === u.id && "bg-primary/10")}>
                                <TableCell className="font-bold">{i + 1}</TableCell>
                                <TableCell><div className="flex items-center gap-3"><Avatar><AvatarImage src={u.avatar} /><AvatarFallback>{u.name?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium">{u.name}</p><p className="text-xs text-gray-400 capitalize">{u.role}</p></div></div></TableCell>
                                <TableCell className="text-right font-bold text-lg">{u.displayPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
