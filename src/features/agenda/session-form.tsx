'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Session } from '@/types';

const sessionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  speaker: z.string().min(2, 'Speaker name is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(2, 'Location is required'),
  track: z.enum(['General', 'Tech', 'Design', 'Business']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  session?: Session;
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
}

export default function SessionForm({ session, onSubmit, onCancel }: SessionFormProps) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: (session as any) || {
      title: '',
      speaker: '',
      time: '',
      location: '',
      track: 'General',
      description: '',
    },
  });

  useEffect(() => {
    if (session) {
      form.reset(session as any);
    }
  }, [session, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="speaker" render={({ field }) => (
          <FormItem><FormLabel>Speaker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="time" render={({ field }) => (
            <FormItem><FormLabel>Time</FormLabel><FormControl><Input {...field} placeholder="e.g. 10:00 AM - 11:00 AM" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="track" render={({ field }) => (
            <FormItem><FormLabel>Track</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Tech">Tech</SelectItem><SelectItem value="Design">Design</SelectItem><SelectItem value="Business">Business</SelectItem></SelectContent></Select><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{session ? 'Update Session' : 'Add Session'}</Button>
        </div>
      </form>
    </Form>
  );
}