'use client';
// import { useMemo } from 'react';
// import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RecommendedSessions() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
// 
//     const recommendations = useMemo(() => {
//         if (!user) return [];
// 
//         const interests = (user.interests || '')
//             .split(',')
//             .map((i: string) => i.trim().toLowerCase())
//             .filter(Boolean);

        return publishedEvents
            .filter((event: any) => !(user.myEvents || []).includes(event._id))
            .map((event: any) => {
                const haystack = `${event.title} ${event.description} ${event.category} ${(event.tags || []).join(' ')}`.toLowerCase();
                const score = interests.reduce((acc: number, interest: string) => acc + (haystack.includes(interest) ? 1 : 0), 0);
                return { ...event, score };
            })
            .filter((event: any) => event.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3);
    }, [publishedEvents, user]);

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

    if (recommendations.length === 0) return null;

    return (
        <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="text-cyan-400" size={20} /> Recommended</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                {recommendations.map(rec => {
                    const eventId = String(rec._id);
                    const isAdded = (user?.myEvents || []).includes(eventId);
                    return (
                        <div key={eventId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div>
                                <p className="font-medium text-sm">{rec.title}</p>
                                <p className="text-xs text-gray-400">{rec.category}</p>
                            </div>
                            <Button size="icon" variant={isAdded ? 'secondary' : 'default'} className="h-8 w-8" onClick={() => handleToggleEvent(eventId, !!isAdded)}>
                                {isAdded ? <Minus size={16} /> : <Plus size={16} />}
                            </Button>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}

