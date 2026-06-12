'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { EventraEvent } from '@/types';
import { useTranslations } from 'next-intl';

export function EventCard({ event }: { event: EventraEvent }) {
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
      <Card className="h-full flex flex-col border-notion-hairline hover:shadow-notion-soft transition-all duration-300">
        {/* IMAGE AREA */}
        <div className="relative aspect-video overflow-hidden bg-notion-canvas-soft border-b border-notion-hairline">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <Sparkles className="w-10 h-10 text-notion-ink-faint/20" />
            </div>
          )}
          <Badge variant="secondary" className="absolute top-3 left-3 z-10 bg-white/80 backdrop-blur-md text-notion-ink border-none">
            {event.category || t('generalCategory')}
          </Badge>
        </div>

        {/* CONTENT AREA */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-h3 font-bold text-notion-ink line-clamp-2 leading-tight group-hover:text-notion-primary transition-colors">
              {event.title}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-body-sm text-notion-ink-secondary">
                <Calendar className="w-3.5 h-3.5 text-notion-primary" />
                <span>{format(displayDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-notion-ink-secondary">
                <MapPin className="w-3.5 h-3.5 text-notion-primary" />
                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.location as any)?.venue || t('virtual')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-notion-hairline">
            <div className="space-y-0.5">
              <p className="text-eyebrow text-notion-ink-faint uppercase">{t('registrationLabel')}</p>
              <p className="text-body-sm font-bold text-notion-ink">{t('freeAccess')}</p>
            </div>
            <Button 
              size="sm" 
              variant="utility"
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="h-8 shadow-notion-soft"
            >
              {isRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : commonT('register')}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
