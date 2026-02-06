'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle,
  Loader2,
  Wand2,
  Info,
  Clock,
  Eye,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { format } from 'date-fns';

const categories = ['Tech', 'Workshop', 'Networking', 'Social', 'Career'];

export default function EventCreationWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const createEventMutation = useMutation(api.events.create);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: undefined as Date | undefined,
    locationType: 'physical',
    venue: '',
    capacity: 100,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handlePublish = async () => {
    if (!formData.title || !formData.startDate) return;
    setIsSaving(true);
    try {
      await createEventMutation({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startDate: formData.startDate.getTime(),
        endDate: formData.startDate.getTime() + 3600000,
        location: { venue: formData.venue },
        capacity: formData.capacity,
        status: 'published',
        organizerId: (user?._id || user?.id) as any,
        registeredCount: 0,
        type: formData.locationType,
      });
      toast({ title: 'Event Published!' });
      router.push('/events');
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Create Event</h1>
        
        {currentStep === 1 && (
          <div className="space-y-4">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10" />
            <Label>Category</Label>
            <Select onValueChange={v => setFormData({...formData, category: v})}><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Button onClick={() => setCurrentStep(2)} className="w-full">Next</Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" />
            <Button onClick={handlePublish} disabled={isSaving}>{isSaving ? 'Publishing...' : 'Publish'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}