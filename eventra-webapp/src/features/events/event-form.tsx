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
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { EventraEvent } from '@/types';

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
  onSave: (event: Omit<EventraEvent, 'id'>) => Promise<void> | void;
  event: EventraEvent | null;
};

function getDateString(event: EventraEvent): string {
  if (event.startDate) {
    const date = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    return date.toISOString().split('T')[0];
  }
  return '';
}

function getLocationString(event: EventraEvent): string {
  if (typeof event.location === 'string') return event.location;
  if (typeof event.location?.venue === 'string') return event.location.venue;
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
      // Client-side resize to 520x520 for fast uploading and rendering
      const resizedFile = await resizeImage(file, 520, 520);
      const storageId = await uploadFile(resizedFile);
      setImageUrl(`/api/storage/${storageId}`);
    } catch (err) {
      console.error('Resize/Upload failed:', err);
      setImageUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  // Helper to resize image on client side
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window.Image)();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
      };
    });
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
    const eventData: Omit<EventraEvent, 'id'> = {
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
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border bg-muted/40">
                <Image src={imageUrl} alt="Event" fill className="object-cover" unoptimized={imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')} />
                <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 bg-background/50 hover:bg-background/70 h-8 w-8" onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-48 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/40 flex flex-col items-center justify-center gap-2 transition-colors">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload event image'}</span>
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

