'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Loader2,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { EventraEvent } from '@/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/core/utils/utils';

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
      // Simulate registration logic
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({ title: "Registration Successful", description: `You're now synced for ${event.title}` });
    } catch (error) {
      toast({ title: commonT('failed'), variant: 'destructive' });
    } finally { setIsRegistering(false); }
  };

  return (
    <Link href={`/events/${event.id}`} className="block h-full group">
      <Card className="h-full flex flex-col border-notion-hairline bg-white dark:bg-zinc-950 hover:shadow-notion-elevated transition-all duration-500 rounded-[1.5rem] overflow-hidden">
        {/* IMAGE AREA */}
        <div className="relative aspect-[16/10] overflow-hidden bg-notion-canvas-soft border-b border-notion-hairline/50">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-border/10">
               <Sparkles className="w-10 h-10 text-notion-ink-faint/10" />
            </div>
          )}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Badge className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-notion-ink border-none text-[9px] font-black px-2.5 py-0.5 uppercase tracking-widest shadow-sm">
               {event.category || "General"}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* CONTENT AREA */}
        <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold text-notion-ink line-clamp-2 leading-tight group-hover:text-notion-primary transition-colors">
              {event.title}
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-medium text-notion-ink-muted">
                <div className="w-7 h-7 rounded-lg bg-notion-canvas-soft flex items-center justify-center text-notion-primary shrink-0">
                   <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>{format(displayDate, 'EEEE, MMM do')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-notion-ink-muted">
                <div className="w-7 h-7 rounded-lg bg-notion-canvas-soft flex items-center justify-center text-notion-primary shrink-0">
                   <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.location as any)?.venue || "Virtual Mesh"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-notion-hairline/50">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-notion-ink-faint">Access Protocol</p>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-tight">Open Enrollment</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickRegister} 
              disabled={isRegistering} 
              className="rounded-xl font-black px-5 h-9 shadow-sm hover:shadow-notion-soft group/btn"
            >
              {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                 <span className="flex items-center gap-2">Sync <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" /></span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
