'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRecommendedSessions } from '@/core/actions/actions';
import { AGENDA_STRING, SESSIONS } from '@/core/data/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Minus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LegacySession } from '@/types';

type Recommendation = {
    id: string;
    title: string;
}

export default function RecommendedSessions() {
    const { user, addEventToUser, removeEventFromUser } = useAuth();
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<LegacySession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const userRole = user.role || 'student';
                const validRole = (['student', 'professional', 'organizer'].includes(userRole) ? userRole : 'student') as 'student' | 'professional' | 'organizer';
                const userInterests = Array.isArray(user.interests) ? user.interests.join(', ') : (user.interests || '');
                const result = await getRecommendedSessions({
                    role: validRole,
                    interests: userInterests,
                    agenda: AGENDA_STRING,
                    myEvents: user.myEvents || [],
                });
                // Get top 3 recommendations and ensure they exist in SESSIONS
                const validRecommendations = result.recommendations
                    .map(rec => SESSIONS.find(s => s.id === rec.id))
                    .filter((session): session is LegacySession => !!session)
                    .slice(0,3);

                setRecommendations(validRecommendations);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
                toast({
                    variant: "destructive",
                    title: "Recommendation Error",
                    description: "Could not fetch AI recommendations at this time."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [user, toast]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary" /> AI Recommendations
                    </CardTitle>
                    <CardDescription>Our AI is crafting a personalized agenda just for you...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    if(recommendations.length === 0) {
        return null; // Don't show the card if there are no recommendations
    }

    const handleToggleEvent = (sessionId: string, sessionTitle: string, isAdded: boolean) => {
        if (isAdded) {
          removeEventFromUser(sessionId);
          toast({ title: 'Removed from your events', description: sessionTitle });
        } else {
          addEventToUser(sessionId);
          toast({ title: 'Added to your events!', description: sessionTitle });
        }
    };
    
    const getGoogleCalendarUrl = (session: LegacySession) => {
        const { title, description, time } = session;
        const timeStr = time || '09:00 AM - 10:00 AM';
        const startTime = timeStr.split(' - ')[0].replace(':', '');
        const endTime = timeStr.split(' - ')[1]?.replace(':', '').split(' ')[0] || '';
        const date = `20241026T${startTime.padStart(4, '0')}00`;
        const endDate = `20241026T${endTime.padStart(4, '0')}00`;

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=IPX%20Hub&dates=${date}/${endDate}`;
    }

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Sparkles className="text-primary w-5 h-5" /> Recommended For You
                </CardTitle>
                <CardDescription>Based on your profile, we think you'll like these sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recommendations.map(rec => {
                        const isAdded = (user?.myEvents || []).includes(rec.id);
                        return (
                            <div key={rec.id} className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                                <div>
                                    <p className="font-medium text-sm">{rec.title}</p>
                                    <p className="text-xs text-muted-foreground">{rec.speaker} &middot; {rec.track}</p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button size="icon" variant="ghost" asChild className="h-8 w-8">
                                        <a href={getGoogleCalendarUrl(rec)} target="_blank" rel="noopener noreferrer">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                        </a>

                                    </Button>
                                    <Button size="icon" variant={isAdded ? 'secondary' : 'default'} className="h-8 w-8" onClick={() => handleToggleEvent(rec.id, rec.title, !!isAdded)}>
                                        {isAdded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
