'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRecommendedSessions } from '@/lib/actions';
import { AGENDA_STRING, SESSIONS } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Minus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Recommendation = {
    id: string;
    title: string;
}

export default function RecommendedSessions() {
    const { user, addEventToUser, removeEventFromUser } = useAuth();
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const result = await getRecommendedSessions({
                    role: user.role,
                    interests: user.interests,
                    agenda: AGENDA_STRING,
                    myEvents: user.myEvents,
                });
                setRecommendations(result.recommendations);
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
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Sparkles /> AI Recommendations
                    </CardTitle>
                    <CardDescription>Our AI is crafting a personalized agenda just for you...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
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
    
    const getGoogleCalendarUrl = (session: {id: string, title: string}) => {
        const sessionDetails = SESSIONS.find(s => s.id === session.id);
        if (!sessionDetails) return '#';
        const { title, description, time } = sessionDetails;
        const startTime = time.split(' - ')[0].replace(':', '');
        const endTime = time.split(' - ')[1].replace(':', '').split(' ')[0];
        const date = `20241026T${startTime.padStart(4, '0')}00`;
        const endDate = `20241026T${endTime.padStart(4, '0')}00`;

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=IPX%20Hub&dates=${date}/${endDate}`;
    }

    return (
        <Card className="bg-card/50 border-primary/20 border-2">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="text-primary" /> Recommended For You
                </CardTitle>
                <CardDescription>Based on your profile, we think you'll like these sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recommendations.map(rec => {
                        const isAdded = user?.myEvents.includes(rec.id);
                        return (
                            <div key={rec.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <p className="font-medium text-sm">{rec.title}</p>
                                <div className='flex items-center gap-2'>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={getGoogleCalendarUrl(rec)} target="_blank" rel="noopener noreferrer">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Calendar
                                        </a>
                                    </Button>
                                    <Button size="sm" onClick={() => handleToggleEvent(rec.id, rec.title, !!isAdded)}>
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