'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import useLocalStorage from '@/hooks/use-local-storage';
import { SESSIONS as initialSessions } from '@/lib/data';
import type { Session } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Minus, Ticket, User, Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SessionForm } from '@/components/agenda/session-form';

export default function MyEventsPage() {
  const { user, removeEventFromUser, addEventToUser } = useAuth();
  const [sessions, setSessions] = useLocalStorage<Session[]>('ipx-sessions', initialSessions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const mySessions = user ? sessions.filter(session => user.myEvents.includes(session.id)) : [];
  const isOrganizer = user?.role === 'organizer';

  const handleRemove = (sessionId: string, sessionTitle: string) => {
    removeEventFromUser(sessionId);
    toast({
      title: 'Session Removed',
      description: `${sessionTitle} has been removed from your events.`,
    });
  };

  const handleSaveSession = (sessionData: Omit<Session, 'id'>) => {
    const newSession = { ...sessionData, id: `s-${Date.now()}` };
    setSessions([...sessions, newSession]);
    addEventToUser(newSession.id);
    toast({ title: 'Session Created', description: `"${sessionData.title}" has been added.` });
    setIsDialogOpen(false);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline mb-4">My Events</h1>
          <p className="text-muted-foreground mb-8">Your personalized schedule for the hackathon.</p>
        </div>
        {isOrganizer && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">Create a New Session</DialogTitle>
                </DialogHeader>
                <SessionForm onSave={handleSaveSession} onClose={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
        )}
      </div>
      
      {mySessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySessions.map(session => (
            <Card key={session.id} className="interactive-element flex flex-col glass-effect">
              <CardHeader>
                <CardTitle className="font-headline">{session.title}</CardTitle>
                <CardDescription>{session.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4"/><span>{session.speaker}</span></div>
                <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-4 w-4"/><span>{session.time}</span></div>
                <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4"/><span>{session.location}</span></div>
                <div className="flex items-center text-muted-foreground"><Ticket className="mr-2 h-4 w-4"/><span>{session.track}</span></div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="destructive" onClick={() => handleRemove(session.id, session.title)}>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground"/>
            <h3 className="mt-2 text-lg font-medium">No Events Added</h3>
            <p className="mt-1 text-sm text-muted-foreground">You haven't added any sessions to your schedule yet.</p>
            <div className="mt-6">
                <Button asChild>
                    <Link href="/agenda">Explore Agenda</Link>
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
