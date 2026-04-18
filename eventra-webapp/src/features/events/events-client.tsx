'use client';
import { useState, useEffect } from 'react';
import type { EventraEvent } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Users, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventForm } from './event-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/events';

function EventCard({ event, isOrganizer, onEdit, onDelete }: { event: EventraEvent; isOrganizer: boolean; onEdit: (event: EventraEvent) => void; onDelete: (eventId: string) => void; }) {
  const displayDate = event.startDate ? new Date(event.startDate) : (event.date ? new Date(event.date) : new Date());
  
  return (
    <Card className="flex flex-col glass-effect">
      <Link href={`/events/${event.id}`} className="flex flex-col flex-grow interactive-element">
        <CardHeader>
          <CardTitle className="font-headline">{event.title}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4"/>
            <span>{displayDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-4 w-4"/><span>{event.time || (event.startDate && new Date(event.startDate).toLocaleTimeString()) || 'TBA'}</span></div>
          <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4"/><span>{typeof event.location?.venue === 'string' ? event.location.venue : (event.location?.venue?.name || (typeof event.location === 'string' ? event.location : 'Online'))}</span></div>
          <div className="flex items-center text-muted-foreground"><Tag className="mr-2 h-4 w-4"/><span>{event.category}</span></div>
          <div className="flex items-center text-muted-foreground"><Users className="mr-2 h-4 w-4"/><span>For: {event.targetAudience || 'All'}</span></div>
        </CardContent>
      </Link>
      {isOrganizer && (
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(event); }}><Edit className="h-4 w-4" /></Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the event.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(event.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

export default function EventsClient() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<EventraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventraEvent | null>(null);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data as any);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSave = async (eventData: Omit<EventraEvent, 'id'>) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast({ title: 'Event Updated', description: `"${eventData.title}" has been updated.` });
      } else {
        await createEvent(eventData);
        toast({ title: 'Event Created', description: `"${eventData.title}" has been added.` });
      }
      setEditingEvent(null);
      setIsDialogOpen(false);
      loadEvents(); // Refresh list
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Error', description: 'Failed to save event.', variant: 'destructive' });
    }
  };
  
  const handleEdit = (event: EventraEvent) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (eventId: string) => {
    try {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event.');
      }
      toast({ title: 'Event Deleted', variant: 'destructive' });
      loadEvents(); // Refresh list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    }
  };
  
  const visibleEvents = events.filter(event => {
    if (!user) return event.targetAudience === 'Both' || !event.targetAudience;
    if (isOrganizer) return true;
    if (event.targetAudience === 'Both') return true;
    return !event.targetAudience || event.targetAudience.toLowerCase() === user.role;
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline">Events</h1>
          <p className="text-muted-foreground mt-2">Special workshops, talks, and networking opportunities.</p>
        </div>
        {isOrganizer && (
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
              setEditingEvent(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEvent(null)}>
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              </DialogHeader>
              <EventForm onSave={handleSave} event={editingEvent} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No events found.
            </div>
          ) : (
            visibleEvents.map(event => (
              <EventCard key={event.id} event={event} isOrganizer={isOrganizer} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

