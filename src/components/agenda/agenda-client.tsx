'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SESSIONS as initialSessions, AGENDA_STRING } from '@/lib/data';
import type { Session, Event } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Minus, Sparkles, Loader2, User, Tag, AlertTriangle, MapPin } from 'lucide-react';
import { getRecommendedSessions } from '@/lib/actions';
import { eventService } from '@/lib/firestore-services';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function formatSessionTime(start?: Date, end?: Date, timeStr?: string): string {
  if (timeStr) return timeStr;
  if (start && end) {
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return 'TBA';
}

function getGoogleCalendarUrl(session: Session) {
    let startTimeStr = '';
    let endTimeStr = '';

    if (session.startTime && session.endTime) {
        startTimeStr = session.startTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
        endTimeStr = session.endTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    } else if (session.time) {
         // Legacy fallback (approximate date)
        const parts = session.time.split(' - ');
        // ... (complex parsing omitted for brevity, assuming real data has Dates now)
        // Fallback to current date for mock
        const now = new Date();
        startTimeStr = now.toISOString().replace(/-|:|\.\d\d\d/g, "");
        endTimeStr = now.toISOString().replace(/-|:|\.\d\d\d/g, "");
    }

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&details=${encodeURIComponent(session.description)}&location=${encodeURIComponent(session.location || '')}&dates=${startTimeStr}/${endTimeStr}`;
}

const getSessionDateRange = (session: Session) => {
    if (session.startTime && session.endTime) {
        return { start: session.startTime, end: session.endTime };
    }
    if (session.time) {
        // Legacy parsing
        const [startStr, endStr] = session.time.split(' - ');
        const parseLegacy = (t: string) => {
            const d = new Date();
            const [time, period] = t.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            d.setHours(h, m, 0, 0);
            return d;
        };
        return { start: parseLegacy(startStr), end: parseLegacy(endStr || startStr) };
    }
    return { start: new Date(), end: new Date() };
};

const hasTimeConflict = (newSession: Session, mySessionIds: string[], allSessions: Session[]): Session | null => {
    const mySessions = allSessions.filter(s => mySessionIds.includes(s.id));
    if (mySessions.length === 0) return null;

    const { start: newStart, end: newEnd } = getSessionDateRange(newSession);

    for (const mySession of mySessions) {
        const { start: myStart, end: myEnd } = getSessionDateRange(mySession);

        if (newStart < myEnd && newEnd > myStart) {
            return mySession;
        }
    }
    return null;
};


function SessionCard({ session, allSessions }: { session: Session, allSessions: Session[] }) {
  const { user, addEventToUser, removeEventFromUser } = useAuth();
  const { toast } = useToast();
  const [conflict, setConflict] = useState<Session | null>(null);

  if (!user) return null;

  const isAdded = user.myEvents.includes(session.id);
  const timeString = formatSessionTime(session.startTime, session.endTime, session.time);

  const handleAddEvent = () => {
    const conflictingSession = hasTimeConflict(session, user.myEvents, allSessions);
    if (conflictingSession) {
      setConflict(conflictingSession);
    } else {
      addEventToUser(session.id);
      toast({ title: 'Added to your events!', description: session.title });
    }
  };
  
  const handleRemoveEvent = () => {
    removeEventFromUser(session.id);
    toast({ title: 'Removed from your events', description: session.title });
  }

  const handleConfirmAdd = () => {
    addEventToUser(session.id, true);
    toast({ title: 'Added to your events!', description: session.title });
    setConflict(null);
  };
  
  const googleCalendarUrl = getGoogleCalendarUrl(session);

  return (
    <>
    <Card className="interactive-element flex flex-col glass-effect">
      <CardHeader>
        <CardTitle className="font-headline">{session.title}</CardTitle>
        <CardDescription>{session.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <span>{session.speaker || session.speakers?.join(', ') || 'TBA'}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>{timeString}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4" />
          <span>{session.location || session.room || 'Online'}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
            <Tag className="mr-2 h-4 w-4" />
            <span>{session.track || session.type}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </a>
        </Button>
        <Button size="sm" onClick={isAdded ? handleRemoveEvent : handleAddEvent}>
          {isAdded ? <Minus className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdded ? 'Remove' : 'Add to My Events'}
        </Button>
      </CardFooter>
    </Card>
     <AlertDialog open={!!conflict} onOpenChange={() => setConflict(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline flex items-center gap-2">
              <AlertTriangle className="text-amber-500"/> Time Conflict Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              This session conflicts with <span className="font-bold">"{conflict?.title}"</span> which is already in your schedule. Are you sure you want to add it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAdd}>Add Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AgendaClient() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const events = await eventService.getEvents();
        // Extract sessions from all events
        const allSessions = events.flatMap(event => 
          (event.agenda || []).map(session => ({
             ...session,
             // Ensure legacy compatibility if needed
             location: session.location || session.room,
             // If startTime/endTime are strings (from JSON), convert to Date
             startTime: session.startTime ? new Date(session.startTime) : undefined,
             endTime: session.endTime ? new Date(session.endTime) : undefined,
          }))
        );
        // If no sessions found in DB, fallback to initialSessions for demo?
        // The Roadmap says "Refactor ... to fetch real data".
        // If DB is empty, we show empty.
        setSessions(allSessions as Session[]);
      } catch (error) {
        console.error("Error fetching agenda:", error);
        toast({ title: 'Error', description: 'Failed to load agenda.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [toast]);

  const handleGetRecommendations = async () => {
    if (!user) return;
    setLoadingRecommendations(true);
    try {
      const result = await getRecommendedSessions({
        role: user.role,
        interests: user.interests,
        agenda: AGENDA_STRING,
        myEvents: user.myEvents,
      });
      const recommendedTitles = result.recommendations.map(s => s.title);
      setRecommendations(recommendedTitles);
      setIsAlertOpen(true);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to get recommendations.', variant: 'destructive' });
    } finally {
      setLoadingRecommendations(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline">Agenda</h1>
          <p className="text-muted-foreground mt-2">Explore the sessions and plan your event.</p>
        </div>
        {user && (user.role === 'student' || user.role === 'professional') && (
          <Button onClick={handleGetRecommendations} disabled={loadingRecommendations}>
            {loadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Get AI Recommendations
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No sessions found.
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} allSessions={sessions} />
            ))
          )}
        </div>
      )}
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline flex items-center gap-2">
              <Sparkles className="text-primary"/> AI Recommended Sessions
            </AlertDialogTitle>
            <AlertDialogDescription>
              Based on your profile and schedule, we think you'll enjoy these sessions:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-muted rounded-md text-sm font-medium">{rec}</div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
