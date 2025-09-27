'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import useLocalStorage from '@/hooks/use-local-storage';
import { SESSIONS as initialSessions } from '@/lib/data';
import type { Session } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Edit, Minus, Ticket, User, Plus, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SessionForm } from '@/components/agenda/session-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function MyEventsPage() {
  const { user, removeEventFromUser, addEventToUser } = useAuth();
  const [sessions, setSessions] = useLocalStorage<Session[]>('ipx-sessions', initialSessions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
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

  const handleSaveSession = (sessionData: Omit<Session, 'id'> | Session) => {
    if ('id' in sessionData) {
      // Editing existing session
      const updatedSessions = sessions.map(s => s.id === sessionData.id ? sessionData : s);
      setSessions(updatedSessions);
      toast({ 
          title: 'Session Updated', 
          description: `"${sessionData.title}" has been updated for all users.`,
          variant: 'destructive'
      });
    } else {
      // Creating new session
      const newSession = { ...sessionData, id: `s-${Date.now()}` };
      setSessions(prevSessions => [...prevSessions, newSession]);
      addEventToUser(newSession.id);
      toast({ title: 'Session Created', description: `"${newSession.title}" has been created and added to your schedule.` });
    }
    setIsDialogOpen(false);
    setEditingSession(null);
  };
  
  const handleCreate = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    // Also remove from user's personal schedule if they had it
    if (user?.myEvents.includes(sessionId)) {
        removeEventFromUser(sessionId);
    }
    toast({ 
        title: 'Session Deleted',
        description: 'This session has been removed for all users.',
        variant: 'destructive' 
    });
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
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Create Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{editingSession ? 'Edit Session' : 'Create a New Session'}</DialogTitle>
                </DialogHeader>
                <SessionForm 
                    onSave={handleSaveSession} 
                    session={editingSession}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setEditingSession(null);
                    }} 
                />
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
              <CardFooter className="flex justify-between">
                <Button size="sm" variant="destructive" onClick={() => handleRemove(session.id, session.title)}>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove
                </Button>
                {isOrganizer && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(session)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-headline flex items-center gap-2"><AlertTriangle className="text-amber-500" />Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the session from the agenda for all users.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(session.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
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
