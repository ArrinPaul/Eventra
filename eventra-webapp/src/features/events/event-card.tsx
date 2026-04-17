'use client';
// 
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Heart, 
  Clock, 
  ChevronRight,
  Zap
} from 'lucide-react';
// import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { EventraEvent } from '@/types';

export function EventCard({ event, variant = 'default' }: { event: EventraEvent, variant?: 'default' | 'compact' | 'featured' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const registerMutation = async (_data: any) => Promise.resolve();

  const displayDate = new Date(event.startDate || event.date || Date.now());

  const handleQuickRegister = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    setIsRegistering(true);
    try {
      await registerMutation({ eventId: event.id as any });
      toast({ title: 'Registered!' });
    } catch (error) {
      toast({ title: 'Failed', variant: 'destructive' });
    } finally { setIsRegistering(false); }
  };

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="bg-muted/40 border-border hover:bg-muted transition-colors text-white overflow-hidden rounded-xl">
        <div className="h-32 bg-primary/10 relative">
            <Badge className="absolute top-2 left-2">{event.category}</Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold truncate">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar size={12} /> {displayDate.toLocaleDateString()}</p>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-primary">{event.isPaid ? `$${event.price}` : 'Free'}</span>
            <Button size="sm" onClick={handleQuickRegister} disabled={isRegistering} className="rounded-full">Register</Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

