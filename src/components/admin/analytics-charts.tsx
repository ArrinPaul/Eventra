'use client';
import { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { User, Session } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import useLocalStorage from '@/hooks/use-local-storage';
import { SESSIONS as initialSessions } from '@/lib/data';
import { getAnalyticsInsights } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  students: { label: 'Students', color: 'hsl(var(--chart-1))' },
  professionals: { label: 'Professionals', color: 'hsl(var(--chart-2))' },
  checkedIn: { label: 'Checked In', color: 'hsl(var(--chart-1))' },
  notCheckedIn: { label: 'Not Checked In', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const COLORS = [chartConfig.students.color, chartConfig.professionals.color];

function AiInsights({ popularityData }: { popularityData: { name: string, count: number }[] }) {
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInsights = async () => {
            if (popularityData.length === 0) {
                setLoading(false);
                return;
            };
            setLoading(true);
            setError('');
            try {
                const popularityString = popularityData.map(p => `${p.name}: ${p.count} attendees`).join(', ');
                const result = await getAnalyticsInsights({ sessionPopularity: popularityString });
                setInsights(result.insights);
            } catch (err) {
                console.error(err);
                setError('Could not load AI insights. The model may be overloaded.');
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [popularityData]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating AI insights...
            </div>
        );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-primary">AI-Generated Insights</AlertTitle>
            <AlertDescription>
                {insights}
            </AlertDescription>
        </Alert>
    );
}

export default function AnalyticsCharts({ allUsers }: { allUsers: User[] }) {
    const attendees = useMemo(() => allUsers.filter(u => u.role !== 'organizer'), [allUsers]);
    const [sessions] = useLocalStorage<Session[]>('ipx-sessions', initialSessions);

    const registrationData = useMemo(() => {
        const studentCount = attendees.filter(u => u.role === 'student').length;
        const professionalCount = attendees.filter(u => u.role === 'professional').length;
        return [
            { name: 'Students', value: studentCount, fill: chartConfig.students.color },
            { name: 'Professionals', value: professionalCount, fill: chartConfig.professionals.color },
        ];
    }, [attendees]);

    const checkInData = useMemo(() => {
        const checkedInCount = attendees.filter(u => u.checkedIn).length;
        return [
            { name: 'Checked In', value: checkedInCount, fill: chartConfig.checkedIn.color },
            { name: 'Not Checked In', value: attendees.length - checkedInCount, fill: chartConfig.notCheckedIn.color },
        ];
    }, [attendees]);

    const sessionPopularityData = useMemo(() => {
        const popularityMap = new Map<string, number>();
        attendees.forEach(user => {
            user.myEvents.forEach(sessionId => {
                popularityMap.set(sessionId, (popularityMap.get(sessionId) || 0) + 1);
            });
        });

        return sessions.map(session => ({
            name: session.title,
            count: popularityMap.get(session.id) || 0,
        })).sort((a, b) => b.count - a.count);

    }, [attendees, sessions]);


    return (
        <div className="space-y-6">
             <AiInsights popularityData={sessionPopularityData} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 glass-effect">
                    <CardHeader>
                        <CardTitle className="font-headline">Registrations by Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={registrationData} dataKey="value" nameKey="name" innerRadius={50}>
                                     {registrationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 glass-effect">
                    <CardHeader>
                        <CardTitle className="font-headline">Check-in Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <BarChart accessibilityLayer data={checkInData} layout="vertical" margin={{ left: 20 }}>
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} hide />
                                <XAxis dataKey="value" type="number" hide />
                                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="value" radius={5}>
                                     {checkInData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle className="font-headline">Session Popularity</CardTitle>
                    <CardDescription>Number of attendees who have added each session to their schedule.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={sessionPopularityData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} angle={-45} textAnchor="end" height={80} interval={0} />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
