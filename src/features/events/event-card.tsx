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
  ArrowRight,
  Clock,
  ExternalLink
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
  const isExternal = !!event.externalUrl;

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isExternal) {
      window.open(event.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsRegistering(true);
    try {
      // Simulate registration logic for native events
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({ title: "Registration Successful", description: `You're now synced for ${event.title.replace(/-/g, ' ')}` });
    } catch (error) {
      toast({ title: commonT('failed'), variant: 'destructive' });
    } finally { setIsRegistering(false); }
  };

  return (
    <Link href={`/events/${event.id}`} className="block h-full group">
      <Card className="h-full flex flex-col border-border bg-card hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
        {/* IMAGE AREA */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
               <Calendar className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Badge className="bg-background/90 backdrop-blur-md text-foreground border-none text-[10px] font-bold px-3 py-1 shadow-sm">
               {event.category || "General"}
            </Badge>
            {isExternal && (
              <Badge className="bg-primary text-primary-foreground border-none text-[10px] font-bold px-3 py-1 shadow-sm">
                 Partner Event
              </Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* CONTENT AREA */}
        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors capitalize break-words">
              {event.title.replace(/-/g, ' ')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0 text-foreground" />
                <span>{format(displayDate, 'EEEE, MMM do')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-foreground" />
                <span className="truncate">{typeof event.location === 'string' ? event.location : (event.location as any)?.venue || "Virtual Event"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access</p>
              <p className="text-sm font-bold text-foreground">Free</p>
            </div>
            <Button 
              size="sm" 
              onClick={handleQuickAction} 
              disabled={isRegistering} 
              className="rounded-lg font-bold px-4 shadow-sm"
              variant={isExternal ? "secondary" : "default"}
            >
              {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                 <span className="flex items-center gap-2">
                   {isExternal ? "Get Tickets" : "Register"} 
                   {isExternal ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                 </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
