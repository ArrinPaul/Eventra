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
      <Card className="h-full border-none shadow-2xl overflow-hidden flex flex-col group-hover:shadow-glow group-hover:shadow-primary/5 group-hover:-translate-y-2 duration-700">
        {/* IMAGE AREA */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted m-4 rounded-[2.5rem]">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
               <Zap className="w-12 h-12 text-primary/10" />
            </div>
          )}
          <Badge variant="glass" className="absolute top-5 left-5 z-10 rounded-full px-4 py-1">
            {event.category || t('generalCategory')}
          </Badge>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        {/* CONTENT AREA */}
        <div className="p-10 pt-4 flex-1 flex flex-col justify-between space-y-10">
          <div className="space-y-6">
            <h3 className="text-3xl font-display font-bold tracking-tight text-foreground line-clamp-2 leading-[1.1] group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/80">
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span>{format(displayDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/80">
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.location as any)?.venue || t('virtual')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-border/40">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 leading-none">{t('registrationLabel')}</p>
              <p className="text-base font-display font-bold text-foreground italic">{t('freeAccess')}</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="rounded-full h-11 px-8 shadow-glow"
            >
              {isRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : commonT('register')}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

