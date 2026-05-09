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
      <Card variant="default" className="group h-full overflow-hidden border-border/50 hover:border-primary/40 hover:shadow-elevated transition-all duration-500 rounded-[2rem] bg-card/50 backdrop-blur-sm">
        <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-info/5 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Badge variant="glass" className="absolute top-4 left-4 z-10 backdrop-blur-md border-white/10 text-[9px]">
              {event.category || 'General'}
            </Badge>
            <div className="absolute top-4 right-4 z-10">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-foreground/50 hover:text-primary transition-colors">
                <Heart size={14} />
              </div>
            </div>
            {/* Visual pattern for placeholder */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
               <Zap size={80} className="text-primary" />
            </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar size={12} className="text-primary" /> {format(displayDate, 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1"><MapPin size={12} className="text-primary" /> {event.location?.venue || 'Virtual'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Price</span>
              <span className="font-black text-foreground">{event.isPaid ? `$${event.price}` : 'FREE'}</span>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="rounded-xl font-black px-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-none hover:shadow-neon"
            >
              {isRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Get Ticket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

