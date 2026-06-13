'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Ticket, 
  Activity, 
  Zap, 
  Sparkles,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/core/utils/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ActivityFeed } from '@/features/feed/activity-feed';
import { EngagementMetrics } from './engagement-metrics';
import { ReferralSystem } from './referral-system';
import { getDashboardData } from '@/app/actions/dashboard';
import { QRCodeSVG } from 'qrcode.react';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const res = await getDashboardData();
        setData(res);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
          <p className="text-sm font-medium text-notion-ink-muted">Syncing data...</p>
        </div>
      </div>
    );
  }

  const registrations = data?.registrations || [];
  const featuredEvents = data?.featuredEvents || [];
  const activities = data?.activities || [];
  const upcomingEvent = registrations.length > 0 ? registrations[0].event : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 pb-24 px-6 md:px-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-notion-canvas border-notion-hairline text-notion-ink-muted font-bold px-3 py-0.5 rounded-md shadow-sm">
                Dashboard
             </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-notion-ink">
            Hey, <span className="text-notion-primary">{user.name?.split(' ')[0]}</span>.
          </h1>
          <p className="text-lg text-notion-ink-muted font-medium">Your event mesh is operational.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" className="rounded-xl font-bold bg-white dark:bg-zinc-950 border-notion-hairline hover:bg-notion-canvas-soft transition-all" asChild>
            <Link href="/my-events">Manage Passes</Link>
          </Button>
          <Button variant="primary" size="lg" className="rounded-xl font-bold shadow-notion-elevated px-8" asChild>
            <Link href="/explore">Find Events</Link>
          </Button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Passes', value: registrations.length, icon: Ticket, color: 'text-notion-primary', bg: 'bg-notion-primary/5' },
          { label: 'XP Points', value: user.xp || 0, icon: Trophy, color: 'text-notion-accent-orange', bg: 'bg-notion-accent-orange/5' },
          { label: 'Node Level', value: user.level || 1, icon: Zap, color: 'text-notion-accent-teal', bg: 'bg-notion-accent-teal/5' },
          { label: 'Total Syncs', value: registrations.filter((r: any) => r.ticket.status === 'checked-in').length, icon: Activity, color: 'text-notion-accent-green', bg: 'bg-notion-accent-green/5' },
        ].map((stat, i) => (
          <Card key={i} className="border-notion-hairline bg-white dark:bg-zinc-950 shadow-notion-soft overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
               <div className="flex items-center gap-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-notion-ink leading-none mb-1">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-notion-ink-faint leading-none">{stat.label}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* UP NEXT */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-xl font-bold tracking-tight text-notion-ink flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-notion-primary animate-pulse" />
                 Upcoming Experience
               </h2>
               {upcomingEvent && (
                  <Link href="/my-events" className="text-xs font-bold text-notion-primary hover:underline">View all</Link>
               )}
            </div>
            
            {upcomingEvent ? (
              <Card className="overflow-hidden border-notion-hairline bg-white dark:bg-zinc-950 shadow-notion-elevated group">
                <Link href={`/events/${upcomingEvent.id}`}>
                  <div className="grid md:grid-cols-12">
                    <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between space-y-10">
                       <div className="space-y-6">
                          <Badge className="bg-notion-accent-green/10 text-notion-accent-green border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Confirmed Access</Badge>
                          <h3 className="text-3xl font-display font-bold leading-[1.1] group-hover:text-notion-primary transition-colors">
                             {upcomingEvent.title}
                          </h3>
                          <div className="space-y-4">
                             <div className="flex items-center gap-4 text-sm font-medium text-notion-ink-muted">
                                <div className="w-8 h-8 rounded-lg bg-notion-canvas-soft flex items-center justify-center text-notion-primary">
                                   <Calendar className="w-4 h-4" />
                                </div>
                                <span>{format(new Date(upcomingEvent.startDate), 'EEEE, MMM do')} • {format(new Date(upcomingEvent.startDate), 'h:mm a')}</span>
                             </div>
                             <div className="flex items-center gap-4 text-sm font-medium text-notion-ink-muted">
                                <div className="w-8 h-8 rounded-lg bg-notion-canvas-soft flex items-center justify-center text-notion-primary">
                                   <MapPin className="w-4 h-4" />
                                </div>
                                <span className="truncate">{upcomingEvent.location?.venue || upcomingEvent.location || 'Virtual Mesh'}</span>
                             </div>
                          </div>
                       </div>
                       <Button variant="outline" className="w-fit rounded-xl font-bold border-notion-hairline hover:bg-notion-canvas-soft group/btn">
                          Launch Pass <ChevronRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                       </Button>
                    </div>
                    <div className="md:col-span-5 relative h-64 md:h-auto min-h-[300px] bg-notion-canvas-soft overflow-hidden">
                       {upcomingEvent.imageUrl ? (
                          <Image 
                             src={upcomingEvent.imageUrl} 
                             alt={upcomingEvent.title}
                             fill
                             className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                          />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-notion-canvas-soft to-border/30">
                             <Sparkles className="w-16 h-16 text-notion-ink-faint/10" />
                          </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:bg-gradient-to-l opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                </Link>
              </Card>
            ) : (
              <div className="p-16 text-center border-2 border-dashed border-notion-hairline rounded-[2.5rem] bg-notion-canvas/50 backdrop-blur-sm space-y-6">
                 <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-950 border border-notion-hairline flex items-center justify-center mx-auto shadow-sm">
                    <Calendar className="w-6 h-6 text-notion-ink-faint" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-lg font-bold">Your agenda is clear.</h3>
                    <p className="text-sm text-notion-ink-muted max-w-[260px] mx-auto leading-relaxed">No upcoming events found. Explore the mesh to join new experiences.</p>
                 </div>
                 <Button asChild variant="primary" className="rounded-xl px-8 shadow-notion-soft">
                   <Link href="/explore">Start Exploring</Link>
                 </Button>
              </div>
            )}
          </section>

          {/* METRICS */}
          <EngagementMetrics userId={user.id} />

          {/* SUGGESTIONS */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-notion-ink flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-notion-primary" />
                  Neural Suggestions
                </h2>
                <p className="text-xs font-medium text-notion-ink-muted">Tailored to your activity and interests.</p>
              </div>
              <Link href="/explore" className="text-[10px] font-black uppercase tracking-widest text-notion-primary hover:underline flex items-center gap-1">
                View Network <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuredEvents.map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group block">
                  <Card className="p-0 overflow-hidden border-notion-hairline bg-white dark:bg-zinc-950 hover:shadow-notion-elevated transition-all duration-300 rounded-[1.5rem]">
                    <div className="aspect-[16/9] relative overflow-hidden bg-notion-canvas-soft">
                      {event.imageUrl ? (
                        <Image src={event.imageUrl} alt={event.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted/20">
                          <Calendar size={32} className="text-notion-ink-faint/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-notion-ink border-none text-[9px] font-black px-2.5 py-0.5 uppercase tracking-widest shadow-sm">
                           {event.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <h3 className="text-lg font-bold truncate group-hover:text-notion-primary transition-colors leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] font-bold text-notion-ink-muted uppercase tracking-widest">
                         <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-notion-primary" />
                            <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                         </div>
                         <ArrowRight className="w-4 h-4 -rotate-45 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-10">
          {/* DIGITAL PASS */}
          <Card className="border-notion-hairline bg-white dark:bg-zinc-950 shadow-notion-elevated overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-notion-primary/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-notion-primary/10 transition-colors duration-500" />
               <div className="p-8 space-y-8 relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <Badge variant="outline" className="text-notion-primary border-notion-primary/20 bg-notion-primary/5 uppercase text-[9px] font-black tracking-widest px-2 py-0">Active Pass</Badge>
                        <h3 className="text-lg font-bold">Node Access</h3>
                     </div>
                     <button className="text-notion-ink-faint hover:text-notion-ink transition-colors">
                        <MoreVertical className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                     {registrations && registrations.length > 0 ? (
                       <>
                         <div className="bg-white p-5 rounded-[2rem] mb-8 shadow-2xl ring-1 ring-black/5 relative overflow-hidden group/qr">
                           <QRCodeSVG 
                             value={registrations[0].ticket.ticketNumber || 'EV-000-000'}
                             size={180}
                             level="H"
                             includeMargin={false}
                           />
                           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                         </div>
                         <div className="w-full text-center space-y-6">
                           <div className="space-y-1.5 p-4 rounded-2xl bg-notion-canvas-soft/50 border border-notion-hairline">
                             <p className="text-[9px] font-black text-notion-ink-faint uppercase tracking-[0.2em]">Verification_Key</p>
                             <p className="font-mono text-sm font-black text-notion-ink tracking-[0.2em]">
                               {registrations[0].ticket.ticketNumber || 'EV-000-000'}
                             </p>
                           </div>
                           <Button variant="primary" className="w-full rounded-xl font-bold h-11 shadow-sm" asChild>
                             <Link href="/tickets">View Full Pass</Link>
                           </Button>
                         </div>
                       </>
                     ) : (
                       <div className="text-center py-16 space-y-4 opacity-40">
                         <div className="w-16 h-16 rounded-full bg-notion-canvas-soft flex items-center justify-center mx-auto">
                            <Activity className="h-8 w-8 text-notion-ink-faint" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest">No active nodes</p>
                       </div>
                     )}
                  </div>
               </div>
          </Card>

          <ReferralSystem />
          
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-notion-ink-faint">Mesh Activity</h3>
                <Link href="/feed" className="text-[9px] font-black uppercase tracking-widest text-notion-primary hover:underline">Full Log</Link>
             </div>
             <ActivityFeed initialActivities={activities} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
