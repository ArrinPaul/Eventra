'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Session } from '@/types';

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  speaker: z.string().min(2, "Speaker name is required."),
  time: z.string().regex(/^\d{2}:\d{2} [AP]M - \d{2}:\d{2} [AP]M$/, "Time must be in 'HH:MM AM/PM - HH:MM AM/PM' format."),
  location: z.string().min(2, "Location is required."),
  track: z.enum(['Tech', 'Design', 'Business', 'General']),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

type SessionFormProps = {
  onSave: (session: Omit<Session, 'id'>) => void;
  session?: Omit<Session, 'id'> | null;
  onClose: () => void;
};

export function SessionForm({ onSave, session, onClose }: SessionFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: session || {
      title: '',
      speaker: '',
      time: '',
      location: '',
      track: 'General',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Session Title</FormLabel><FormControl><Input placeholder="e.g., Opening Keynote" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="speaker" render={({ field }) => (<FormItem><FormLabel>Speaker Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input placeholder="e.g., 09:00 AM - 10:00 AM" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Main Hall" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="track" render={({ field }) => (<FormItem><FormLabel>Track</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Tech">Tech</SelectItem><SelectItem value="Design">Design</SelectItem><SelectItem value="Business">Business</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief summary of the session." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Session</Button>
        </div>
      </form>
    </Form>
  );
}
