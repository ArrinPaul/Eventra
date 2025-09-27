'use client';
import { useAuth } from '@/hooks/use-auth';
import { SESSIONS } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Minus, Ticket, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function MyEventsPage() {
  const { user, removeEventFromUser } = useAuth();
  const { toast } = useToast();
  const mySessions = user ? SESSIONS.filter(session => user.myEvents.includes(session.id)) : [];

  const handleRemove = (sessionId: string, sessionTitle: string) => {
    removeEventFromUser(sessionId);
    toast({
      title: 'Session Removed',
      description: `${sessionTitle} has been removed from your events.`,
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold font-headline mb-4">My Events</h1>
      <p className="text-muted-foreground mb-8">Your personalized schedule for the hackathon.</p>
      
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
