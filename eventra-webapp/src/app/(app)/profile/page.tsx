'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Mail, User, Star, Trophy, Award, MapPin,
  Settings, Edit, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUserRegistrations } from '@/app/actions/registrations';
import { getUserCertificates } from '@/app/actions/certificates';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const eventsAttended = registrations.filter((r: any) => r.ticket.status === 'checked-in').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Profile Header */}
        <Card className="border-border mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{user.name || 'User'}</h1>
                  <Badge variant="secondary" className="capitalize text-xs">{user.role}</Badge>
                </div>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-2">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
                {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-lg">
                <Link href="/preferences">
                  <Settings className="w-4 h-4 mr-2" /> Edit Profile
                </Link>
              </Button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                <p className="text-xs text-muted-foreground">Events Registered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{eventsAttended}</p>
                <p className="text-xs text-muted-foreground">Events Attended</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{user.xp || user.points || 0}</p>
                <p className="text-xs text-muted-foreground">XP Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
                <p className="text-xs text-muted-foreground">Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            {registrations.length > 0 ? (
              <div className="space-y-3">
                {registrations.map((reg: any) => (
                  <Card key={reg.ticket.id} className="border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 text-center bg-primary/5 rounded-xl p-2 flex-shrink-0">
                        <span className="block text-xs font-medium text-primary uppercase">
                          {format(new Date(reg.event?.startDate || 0), 'MMM')}
                        </span>
                        <span className="block text-lg font-bold text-foreground">
                          {format(new Date(reg.event?.startDate || 0), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{reg.event?.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {typeof reg.event?.location === 'string' ? reg.event.location : reg.event?.location?.venue || 'TBD'}
                        </p>
                      </div>
                      <Badge variant={reg.ticket.status === 'checked-in' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {reg.ticket.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No events yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {certificates.length > 0 ? (
              <div className="grid gap-3">
                {certificates.map((cert: any) => (
                  <Card key={cert.id} className="border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{cert.event?.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Issued {cert.issueDate ? format(new Date(cert.issueDate), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg" asChild>
                        <Link href="/certificates">View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No certificates yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges">
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Participate in events to earn badges</p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
