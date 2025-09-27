'use client';
import { useState } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Event } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventForm } from './event-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EVENTS as initialEvents } from '@/lib/data';
import Link from 'next/link';

function EventCard({ event, isOrganizer, onEdit, onDelete }: { event: Event; isOrganizer: boolean; onEdit: (event: Event) => void; onDelete: (eventId: string) => void; }) {
  return (
    <Card className="flex flex-col glass-effect">
      <Link href={`/events/${event.id}`} className="flex flex-col flex-grow interactive-element">
        <CardHeader>
          <CardTitle className="font-headline">{event.title}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground"><Calendar className="mr-2 h-4 w-4"/><span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-4 w-4"/><span>{event.time}</span></div>
          <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4"/><span>{event.location}</span></div>
          <div className="flex items-center text-muted-foreground"><Tag className="mr-2 h-4 w-4"/><span>{event.category}</span></div>
          <div className="flex items-center text-muted-foreground"><Users className="mr-2 h-4 w-4"/><span>For: {event.targetAudience}</span></div>
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
  const [events, setEvents] = useLocalStorage<Event[]>('ipx-events', initialEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const isOrganizer = user?.role === 'organizer';

  const handleSave = (event: Omit<Event, 'id'>) => {
    if (editingEvent) {
      const updatedEvents = events.map(e => e.id === editingEvent.id ? { ...editingEvent, ...event } : e);
      setEvents(updatedEvents);
      toast({ title: 'Event Updated', description: `"${event.title}" has been updated.` });
    } else {
      const newEvent = { ...event, id: `evt-${Date.now()}` };
      setEvents([...events, newEvent]);
      toast({ title: 'Event Created', description: `"${event.title}" has been added.` });
    }
    setEditingEvent(null);
    setIsDialogOpen(false);
  };
  
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast({ title: 'Event Deleted', variant: 'destructive' });
  };
  
  const visibleEvents = events.filter(event => {
    if (!user) return event.targetAudience === 'Both';
    if (user.role === 'organizer') return true;
    if (event.targetAudience === 'Both') return true;
    return event.targetAudience.toLowerCase() === user.role;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleEvents.map(event => (
          <EventCard key={event.id} event={event} isOrganizer={isOrganizer} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
