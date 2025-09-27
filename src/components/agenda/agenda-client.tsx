'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SESSIONS, AGENDA_STRING } from '@/lib/data';
import type { Session } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Minus, Sparkles, Loader2, User, Tag } from 'lucide-react';
import { getRecommendedSessions } from '@/lib/actions';
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

function getGoogleCalendarUrl(session: Session) {
    const startTime = session.time.split(' - ')[0].replace(':', '');
    const endTime = session.time.split(' - ')[1].replace(':', '').split(' ')[0];
    const date = `20241026T${startTime.padStart(4, '0')}00`;
    const endDate = `20241026T${endTime.padStart(4, '0')}00`;

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&details=${encodeURIComponent(session.description)}&location=IPX%20Hub&dates=${date}/${endDate}`;
}

function SessionCard({ session }: { session: Session }) {
  const { user, addEventToUser, removeEventFromUser } = useAuth();
  const { toast } = useToast();
  const isAdded = user?.myEvents.includes(session.id);

  const handleToggleEvent = () => {
    if (isAdded) {
      removeEventFromUser(session.id);
      toast({ title: 'Removed from your events', description: session.title });
    } else {
      addEventToUser(session.id);
      toast({ title: 'Added to your events!', description: session.title });
    }
  };
  
  const googleCalendarUrl = getGoogleCalendarUrl(session);

  return (
    <Card className="interactive-element flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{session.title}</CardTitle>
        <CardDescription>{session.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <span>{session.speaker}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>{session.time}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
            <Tag className="mr-2 h-4 w-4" />
            <span>{session.track}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </a>
        </Button>
        <Button size="sm" onClick={handleToggleEvent}>
          {isAdded ? <Minus className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdded ? 'Remove' : 'Add to My Events'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function AgendaClient() {
  const { user } = useAuth();
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SESSIONS.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
      
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
