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
import { getAIEventPlan } from '@/app/actions/event-planning';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAgenda, setAiAgenda] = useState<any>(null);

  const handleAIAssist = async () => {
    if (!formData.title || !formData.category) {
      toast({ title: 'Missing Info', description: 'Please provide a title and category first.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await getAIEventPlan({
        title: formData.title,
        eventType: formData.category,
        duration: 2, // Default 2 hours for planning
      });
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          description: `This ${formData.category} event focuses on ${formData.title}. \n\nGoal: Provide high-value insights and networking opportunities.\n\n${result.agenda.agenda.map((item: any) => `- ${item.time}: ${item.title}`).join('\n')}`
        }));
        setAiAgenda(result.agenda.agenda);
        toast({ title: 'AI Plan Generated!', description: 'We\'ve drafted a description and agenda for you.' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({ title: 'AI Assist Failed', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

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
        agenda: aiAgenda, // Save the generated agenda
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Event</h1>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">Step {currentStep} of 2</Badge>
        </div>
        
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input 
                placeholder="e.g. AI for Everyone Workshop"
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                className="bg-white/5 border-white/10" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <div className="flex flex-col space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white/5 border-white/10", !formData.startDate && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(d) => setFormData({...formData, startDate: d})}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button onClick={() => setCurrentStep(2)} className="flex-1" disabled={!formData.title || !formData.category || !formData.startDate}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Description & Agenda</Label>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                onClick={handleAIAssist}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Assist
              </Button>
            </div>
            
            <Textarea 
              placeholder="Tell attendees what this event is about..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className="bg-white/5 border-white/10 h-64" 
            />
            
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setCurrentStep(1)} disabled={isSaving}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handlePublish} className="flex-1 bg-cyan-600 hover:bg-cyan-500" disabled={isSaving || !formData.description}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Publish Event
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}