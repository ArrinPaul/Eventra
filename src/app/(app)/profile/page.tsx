'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Mail, User, Star, Trophy, Award, MapPin,
  Settings, Edit, Loader2, UserCircle, CheckCircle, Zap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getUserCertificates } from '@/app/actions/certificates';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { EditProfileDialog } from '@/features/profile/edit-profile-dialog';

export default function ProfilePage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [regs, certs] = await Promise.all([
          getUserRegistrations(),
          getUserCertificates(),
        ]);
        setRegistrations(regs);
        setCertificates(certs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-primary/10 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Node...</p>
        </div>
      </div>
    );
  }

  const eventsAttended = registrations.filter((r: any) => r.ticket.status === 'checked-in').length;

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        {/* Profile Header */}
        <div className="rounded-[3rem] bg-background border border-border/80 shadow-2xl overflow-hidden mb-16">
          <div className="relative h-48 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
             <div className="absolute inset-0 bg-grid-white/[0.02]" />
          </div>
          <div className="p-10 md:p-16 -mt-24 relative z-10">
            <div className="flex flex-col md:flex-row items-end gap-10">
              <EditProfileDialog>
                <div className="relative group cursor-pointer">
                  <Avatar className="h-40 w-40 rounded-[2.5rem] border-8 border-background shadow-2xl ring-1 ring-border/50">
                    <AvatarImage src={user.image || ''} alt={user.name || ''} className="object-cover" />
                    <AvatarFallback className="bg-muted text-primary text-4xl font-display font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-[2.5rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit className="w-8 h-8 text-white" />
                  </div>
                </div>
              </EditProfileDialog>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tighter">{user.name || 'Anonymous Node'}</h1>
                  <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">{user.role}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                   <p className="text-muted-foreground font-bold text-sm flex items-center gap-2">
                     <Mail className="w-4 h-4 text-primary" /> {user.email}
                   </p>
                   <p className="text-muted-foreground font-bold text-sm flex items-center gap-2">
                     <UserCircle className="w-4 h-4 text-primary" /> Node_ID: {user.id.slice(0, 8)}
                   </p>
                </div>
                {user.bio && <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">{user.bio}</p>}
              </div>

              <Button variant="outline" size="lg" asChild className="rounded-2xl h-14 px-8 border-2 font-black uppercase tracking-widest text-[11px] hover:bg-muted transition-all">
                <Link href="/preferences">
                  <Settings className="w-4 h-4 mr-3" /> Preferences
                </Link>
              </Button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-border/60">
              {[
                { label: 'Registered', value: registrations.length, icon: Calendar },
                { label: 'Attended', value: eventsAttended, icon: CheckCircle },
                { label: 'Experience', value: user.xp || user.points || 0, icon: Zap },
                { label: 'Certificates', value: certificates.length, icon: Award },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <p className="text-3xl font-display font-bold tracking-tighter leading-none">{stat.value}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">{stat.label}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events" className="w-full space-y-12">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-10">
            <TabsTrigger value="events" className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] pb-4 px-0 transition-all">Missions</TabsTrigger>
            <TabsTrigger value="certificates" className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] pb-4 px-0 transition-all">Intel_Certs</TabsTrigger>
            <TabsTrigger value="badges" className="bg-transparent border-none rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] pb-4 px-0 transition-all">Node_Ranks</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
            {registrations.length > 0 ? (
              <div className="grid gap-6">
                {registrations.map((reg: any) => (
                  <Link key={reg.ticket.id} href={`/events/${reg.event?.id}`} className="group block">
                    <div className="p-8 rounded-[2rem] bg-background border border-border/80 shadow-xl hover:shadow-2xl transition-all flex items-center gap-8 group-hover:-translate-x-1">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-muted flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/20">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                          {format(new Date(reg.event?.startDate || 0), 'MMM')}
                        </span>
                        <span className="block text-3xl font-display font-bold text-foreground leading-none">
                          {format(new Date(reg.event?.startDate || 0), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-display font-bold text-foreground truncate group-hover:text-primary transition-colors tracking-tight">{reg.event?.title}</h3>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-2">
                          <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {typeof reg.event?.location === 'string' ? reg.event.location : reg.event?.location?.venue || 'TBD'}</span>
                          <span className="flex items-center gap-2 text-primary">{reg.ticket.ticketNumber}</span>
                        </div>
                      </div>
                      <Badge className={cn(
                         "capitalize text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full border-none",
                         reg.ticket.status === 'checked-in' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}>
                        {reg.ticket.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                <p className="text-lg font-bold text-muted-foreground">No active nodes registered.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="p-8 rounded-[2.5rem] bg-background border border-border/80 shadow-xl hover:shadow-2xl transition-all flex items-center gap-8 group">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{cert.event?.title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                        Node Synchronized: {cert.issueDate ? format(new Date(cert.issueDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-2 font-black uppercase tracking-widest text-[9px] hover:bg-muted" asChild>
                      <Link href="/certificates">View Intel</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border">
                <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                <p className="text-lg font-bold text-muted-foreground">No certifications issued yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
            <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border opacity-60">
              <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <p className="text-xl font-display font-bold">Badges: Attend events to earn rewards and recognition.</p>

            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
