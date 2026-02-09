'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Wand2
} from 'lucide-react';
import { eventWizardSchema, defaultEventValues, EventWizardData } from './wizard/types';
import { Step1BasicInfo } from './wizard/step-1-basic-info';
import { Step2DateLocation } from './wizard/step-2-date-location';
import { getAIEventPlan } from '@/app/actions/event-planning';

export default function EventCreationWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const createEventMutation = useMutation(api.events.create);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<EventWizardData>({
    resolver: zodResolver(eventWizardSchema),
    defaultValues: defaultEventValues,
    mode: 'onChange',
  });

  const { handleSubmit, trigger, watch, setValue } = form;
  const formData = watch();

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['title', 'description', 'category'];
    if (currentStep === 2) fieldsToValidate = ['startDate', 'startTime', 'endTime', 'locationType'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAIAssist = async () => {
    if (!formData.title || !formData.category) {
      toast({ 
        title: 'Missing Info', 
        description: 'Please provide a title and category first.', 
        variant: 'destructive' 
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await getAIEventPlan({
        title: formData.title,
        eventType: formData.category,
        duration: 2, 
      });
      if (result.success) {
        setValue('description', result.agenda.description || `This ${formData.category} event focuses on ${formData.title}.`);
        setValue('agenda', result.agenda.agenda);
        toast({ title: 'AI Plan Generated!', description: 'We\'ve updated the description and agenda.' });
      }
    } catch (error) {
      toast({ title: 'AI Assist Failed', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: EventWizardData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Parse dates and times
      const startDateTime = new Date(values.startDate);
      const [sh, sm] = values.startTime.split(':').map(Number);
      startDateTime.setHours(sh, sm);

      let endDateTime = values.endDate ? new Date(values.endDate) : new Date(values.startDate);
      const [eh, em] = values.endTime.split(':').map(Number);
      endDateTime.setHours(eh, em);

      await createEventMutation({
        title: values.title,
        description: values.description,
        category: values.category,
        startDate: startDateTime.getTime(),
        endDate: endDateTime.getTime(),
        location: values.locationType === 'physical' 
          ? { venue: values.venue, address: values.address }
          : { venue: 'Virtual', virtualLink: values.virtualLink },
        capacity: values.capacity,
        status: 'published',
        organizerId: (user._id || user.id) as any,
        registeredCount: 0,
        type: values.locationType,
        agenda: values.agenda,
        tags: values.tags,
      });

      toast({ title: 'Event Created Successfully!' });
      router.push('/events');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create event', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
            <p className="text-gray-400 mt-1">Fill in the details to launch your event.</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => (
              <div 
                key={step} 
                className={cn(
                  "h-2 w-12 rounded-full transition-all duration-500",
                  currentStep >= step ? "bg-cyan-500" : "bg-white/10"
                )} 
              />
            ))}
            <Badge variant="outline" className="ml-2 border-cyan-500/50 text-cyan-400">Step {currentStep} of 3</Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
              {currentStep === 1 && <Step1BasicInfo />}
              {currentStep === 2 && <Step2DateLocation />}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Review & Finish</h2>
                    <p className="text-muted-foreground">Review your event details before publishing.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Title</p>
                      <p className="font-medium">{formData.title}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Category</p>
                      <p className="font-medium">{formData.category}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Date & Time</p>
                      <p className="font-medium">
                        {formData.startDate ? format(formData.startDate, 'PPP') : 'Not set'} @ {formData.startTime}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Location</p>
                      <p className="font-medium capitalize">{formData.locationType}: {formData.venue || formData.virtualLink || 'TBD'}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">AI Generated Agenda</p>
                        {formData.agenda && <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">Ready</Badge>}
                    </div>
                    {formData.agenda ? (
                        <div className="space-y-2">
                            {formData.agenda.slice(0, 3).map((item: any, i: number) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <span className="text-cyan-500 font-mono">{item.time}</span>
                                    <span className="text-gray-300">{item.title}</span>
                                </div>
                            ))}
                            {formData.agenda.length > 3 && <p className="text-xs text-gray-500 italic">+ {formData.agenda.length - 3} more items</p>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No agenda generated yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  disabled={isSaving}
                  className="hover:bg-white/5"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}

              <div className="flex gap-3">
                {currentStep === 1 && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAIAssist}
                        disabled={isGenerating || !formData.title}
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        AI Assist
                    </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext} className="bg-white text-black hover:bg-gray-200 min-w-[120px]">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[150px]" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Publish Event
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
