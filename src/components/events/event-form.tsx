'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Event } from '@/types';

const formSchema = z.object({
  title: z.string().min(3),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(2),
  category: z.enum(['Workshop', 'Talk', 'Panel']),
  targetAudience: z.enum(['Student', 'Professional', 'Both']),
  description: z.string().min(10),
});

type EventFormProps = {
  onSave: (event: Omit<Event, 'id'>) => Promise<void> | void;
  event: Event | null;
};

// Helper to extract date string from Event
function getDateString(event: Event): string {
  if (event.startDate) {
    const date = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    return date.toISOString().split('T')[0];
  }
  return '';
}

// Helper to extract location string from Event
function getLocationString(event: Event): string {
  if (typeof event.location === 'string') return event.location;
  if (event.location?.venue?.name) return event.location.venue.name;
  return '';
}

export function EventForm({ onSave, event }: EventFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: event ? {
        title: event.title,
        date: getDateString(event),
        time: event.time || '',
        location: getLocationString(event),
        category: (event.category as 'Workshop' | 'Talk' | 'Panel') || 'Workshop',
        targetAudience: (event.targetAudience as 'Student' | 'Professional' | 'Both') || 'Both',
        description: event.description,
    } : {
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'Workshop',
      targetAudience: 'Both',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert form values to Event type with required defaults
    const startDate = new Date(values.date + 'T' + values.time);
    const eventData: Omit<Event, 'id'> = {
      title: values.title,
      description: values.description,
      startDate,
      endDate: startDate, // Default to same as start
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: {
        type: 'physical',
        venue: { name: values.location },
      } as any,
      type: 'workshop',
      category: values.category,
      tags: [],
      capacity: 100,
      waitlistEnabled: false,
      pricing: { type: 'free' } as any,
      status: 'draft',
      visibility: 'public',
      agenda: [],
      speakers: [],
      organizers: [],
      moderators: [],
      registeredUsers: [],
      waitlistedUsers: [],
      attendedUsers: [],
      settings: {} as any,
      integrations: {},
      analytics: {} as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
      organizationId: '',
      // Legacy fields for compatibility
      date: values.date,
      time: values.time,
      targetAudience: values.targetAudience,
    };
    onSave(eventData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Workshop">Workshop</SelectItem><SelectItem value="Talk">Talk</SelectItem><SelectItem value="Panel">Panel</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Professional">Professional</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <Button type="submit" className="w-full">Save Event</Button>
      </form>
    </Form>
  );
}
