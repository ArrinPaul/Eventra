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

export default function RecommendedSessions() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<LegacySession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const userInterests = user.interests || '';
                const result = await getRecommendedSessions({
                    role: user.role,
                    interests: userInterests,
                    agenda: AGENDA_STRING,
                    myEvents: user.myEvents || [],
                });
                const validRecommendations = result.recommendations
                    .map(rec => SESSIONS.find(s => s.id === rec.id))
                    .filter((session): session is LegacySession => !!session)
                    .slice(0,3);
                setRecommendations(validRecommendations);
            } catch (error) {
                toast({ variant: "destructive", title: "Recommendation Error" });
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [user, toast]);

    const handleToggleEvent = async (sessionId: string, isAdded: boolean) => {
        if (!user) return;
        const newEvents = isAdded 
            ? (user.myEvents || []).filter((id: string) => id !== sessionId)
            : [...(user.myEvents || []), sessionId];
        
        try {
            await updateUser({ myEvents: newEvents });
            toast({ title: isAdded ? 'Removed' : 'Added' });
        } catch (e) {}
    };

    if (loading || recommendations.length === 0) return null;

    return (
        <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="text-cyan-400" size={20} /> Recommended</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                {recommendations.map(rec => {
                    const isAdded = (user?.myEvents || []).includes(rec.id);
                    return (
                        <div key={rec.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div><p className="font-medium text-sm">{rec.title}</p><p className="text-xs text-gray-400">{rec.speaker}</p></div>
                            <Button size="icon" variant={isAdded ? 'secondary' : 'default'} className="h-8 w-8" onClick={() => handleToggleEvent(rec.id, !!isAdded)}>
                                {isAdded ? <Minus size={16} /> : <Plus size={16} />}
                            </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}