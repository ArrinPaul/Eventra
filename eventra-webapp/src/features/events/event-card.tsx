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
  Zap,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
// import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { EventraEvent } from '@/types';

export function EventCard({ event, variant = 'default' }: { event: EventraEvent, variant?: 'default' | 'compact' | 'featured' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  const displayDate = new Date(event.startDate || event.date || Date.now());

  const handleQuickRegister = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    setIsRegistering(true);
    try {
      // Mock registration for development
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({ title: 'Success!', description: `Registered for ${event.title}` });
    } catch (error) {
      toast({ title: 'Failed', variant: 'destructive' });
    } finally { setIsRegistering(false); }
  };

  return (
    <Link href={`/events/${event.id}`}>
      <Card variant="default" className="group h-full overflow-hidden border-white/5 hover:border-primary/50 transition-all duration-500 rounded-3xl bg-zinc-900/30 backdrop-blur-md">
        <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Badge variant="glass" className="absolute top-4 left-4 z-10 backdrop-blur-md border-white/5 text-[9px] font-bold">
              {event.category || 'General'}
            </Badge>
            {/* Visual pattern for placeholder */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-105 transition-transform duration-500">
               <Zap size={50} className="text-white/20" />
            </div>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl font-medium text-white group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-300 uppercase tracking-widest">
              <span className="flex items-center gap-1.5 font-bold"><Calendar size={12} className="text-primary" /> {format(displayDate, 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1.5 font-bold"><MapPin size={12} className="text-primary" /> {typeof event.location === 'string' ? event.location : (event.location as any)?.venue || 'Virtual'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-300 font-bold">Registration</span>
              <span className="text-sm font-semibold text-white">{event.isPaid ? `$${event.price}` : 'Free Access'}</span>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="rounded-full font-bold px-6 bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
            >
              {isRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Register'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

