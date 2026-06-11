'use client';
// 
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { useTranslations } from 'next-intl';

export function EventCard({ event, variant = 'default' }: { event: EventraEvent, variant?: 'default' | 'compact' | 'featured' }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Events');
  const commonT = useTranslations('Common');
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
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({ title: commonT('success'), description: t('registeredToast', { title: event.title }) });
    } catch (error) {
      toast({ title: commonT('failed'), variant: 'destructive' });
    } finally { setIsRegistering(false); }
  };

  return (
    <Link href={`/events/${event.id}`} className="block h-full group">
      <div className="h-full bg-background border border-border/80 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col group-hover:-translate-y-1">
        {/* IMAGE AREA */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted m-3 rounded-[2rem]">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
               <Zap className="w-12 h-12 text-primary/10" />
            </div>
          )}
          <Badge className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md text-foreground border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
            {event.category || t('generalCategory')}
          </Badge>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* CONTENT AREA */}
        <div className="p-8 pt-4 flex-1 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold tracking-tight text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(displayDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.location as any)?.venue || t('virtual')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border/60">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{t('registrationLabel')}</p>
              <p className="text-sm font-bold text-foreground italic">{t('freeAccess')}</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="rounded-xl h-10 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-glow shadow-primary/20 border-none transition-all active:scale-95"
            >
              {isRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : commonT('register')}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

