'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStorage } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { Event } from '@/types';

const formSchema = z.object({
  title: z.string().min(3),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(2),
  category: z.enum(['Workshop', 'Talk', 'Panel', 'Tech', 'Networking', 'Social', 'Career']),
  targetAudience: z.enum(['Student', 'Professional', 'Both']),
  description: z.string().min(10),
  capacity: z.coerce.number().min(1).max(100000),
  status: z.enum(['draft', 'published']),
  type: z.enum(['physical', 'virtual', 'hybrid']),
});

type EventFormProps = {
  onSave: (event: Omit<Event, 'id'>) => Promise<void> | void;
  event: Event | null;
};

function getDateString(event: Event): string {
  if (event.startDate) {
    const date = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    return date.toISOString().split('T')[0];
  }
  return '';
}

function getLocationString(event: Event): string {
  if (typeof event.location === 'string') return event.location;
  if (event.location?.venue?.name) return event.location.venue.name;
  return '';
}

export function EventForm({ onSave, event }: EventFormProps) {
  const { user } = useAuth();
  const { uploadFile } = useStorage();
  const [imageUrl, setImageUrl] = useState<string | null>(event?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { storageId } = await uploadFile(file, user._id || user.id);
      // Storage URL is returned from saveFile — use the storageId as a reference
      // The convex file URL is typically accessed via storage.getUrl
      setImageUrl(`/api/storage/${storageId}`);
    } catch {
      // fallback: use object URL for preview
      setImageUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: event ? {
        title: event.title,
        date: getDateString(event),
        time: event.time || '',
        location: getLocationString(event),
        category: (event.category as z.infer<typeof formSchema>['category']) || 'Workshop',
        targetAudience: (event.targetAudience as 'Student' | 'Professional' | 'Both') || 'Both',
        description: event.description,
        capacity: event.capacity ?? 100,
        status: (event.status as 'draft' | 'published') ?? 'draft',
        type: (event.type as 'physical' | 'virtual' | 'hybrid') ?? 'physical',
    } : {
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'Workshop',
      targetAudience: 'Both',
      description: '',
      capacity: 50,
      status: 'draft',
      type: 'physical',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const startDate = new Date(values.date + 'T' + values.time);
    const eventData: Omit<Event, 'id'> = {
      title: values.title,
      description: values.description,
      startDate: startDate.getTime(),
      endDate: startDate.getTime() + 3600000,
      location: { venue: values.location },
      type: values.type,
      category: values.category,
      capacity: values.capacity,
      status: values.status,
      organizerId: '' as any,
      registeredCount: 0,
      date: values.date,
      time: values.time,
      targetAudience: values.targetAudience,
    };
    if (imageUrl) (eventData as any).imageUrl = imageUrl;
    onSave(eventData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Image</label>
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                <img src={imageUrl} alt="Event" className="w-full h-full object-cover" />
                <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 h-8 w-8" onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-48 rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/50 bg-white/5 flex flex-col items-center justify-center gap-2 transition-colors">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-cyan-500" /> : <ImagePlus className="h-8 w-8 text-gray-500" />}
                <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload event image'}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Workshop">Workshop</SelectItem><SelectItem value="Talk">Talk</SelectItem><SelectItem value="Panel">Panel</SelectItem><SelectItem value="Tech">Tech</SelectItem><SelectItem value="Networking">Networking</SelectItem><SelectItem value="Social">Social</SelectItem><SelectItem value="Career">Career</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Professional">Professional</SelectItem><SelectItem value="Both">Both</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="capacity" render={({ field }) => (<FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Event Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="physical">In-Person</SelectItem><SelectItem value="virtual">Virtual</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <Button type="submit" className="w-full">Save Event</Button>
      </form>
    </Form>
  );
}