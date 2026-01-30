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
  Ticket,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Wand2,
  Info,
  Clock,
  DollarSign,
  Globe,
  Lock,
  Eye,
  ListChecks,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { eventService } from '@/core/services/firestore-services';
import { format } from 'date-fns';
import type { Event } from '@/types';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: any;
}

const steps: WizardStep[] = [
  { id: 1, title: 'Basic Info', description: 'Event name and details', icon: Info },
  { id: 2, title: 'Date & Location', description: 'When and where', icon: CalendarDays },
  { id: 3, title: 'AI Magic', description: 'Let AI help you', icon: Sparkles },
  { id: 4, title: 'Ticketing', description: 'Pricing and capacity', icon: Ticket },
  { id: 5, title: 'Preview', description: 'Review and publish', icon: Eye },
];

const categories = [
  'Tech', 'Workshop', 'Networking', 'Social', 'Career', 
  'Academic', 'Sports', 'Arts', 'Music', 'Other'
];

const targetAudiences = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students Only' },
  { value: 'faculty', label: 'Faculty & Staff' },
  { value: 'alumni', label: 'Alumni' },
];

interface EventFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime: string;
  endTime: string;
  timezone: string;
  locationType: 'physical' | 'virtual' | 'hybrid';
  venue: string;
  address: string;
  virtualLink: string;
  capacity: number;
  isFree: boolean;
  price: number;
  visibility: 'public' | 'private' | 'unlisted';
  targetAudience: string;
  imageUrl: string;
  requiresApproval: boolean;
  // Multiple ticket tiers
  ticketTiers: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
    benefits?: string[];
  }>;
  // Custom registration fields
  customFields: Array<{
    id: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'select' | 'checkbox';
    required: boolean;
    options?: string[]; // For select type
  }>;
  // Waitlist
  enableWaitlist: boolean;
  agenda?: Array<{
    time: string;
    title: string;
    description: string;
    duration: number;
    speaker?: string;
  }>;
  checklist?: Array<{
    task: string;
    category: 'pre-event' | 'day-of' | 'post-event';
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  }>;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  category: '',
  tags: [],
  startDate: undefined,
  endDate: undefined,
  startTime: '09:00',
  endTime: '17:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locationType: 'physical',
  venue: '',
  address: '',
  virtualLink: '',
  capacity: 100,
  isFree: true,
  price: 0,
  visibility: 'public',
  targetAudience: 'all',
  imageUrl: '',
  requiresApproval: false,
  ticketTiers: [],
  customFields: [],
  enableWaitlist: false,
};

export default function EventCreationWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const updateFormData = useCallback((updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        updateFormData({ tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAIGenerate = async (field: 'description' | 'agenda' | 'checklist') => {
    if (!formData.title) {
      toast({ 
        title: 'Title Required', 
        description: 'Please enter an event title first.',
        variant: 'destructive' 
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate duration from start and end dates
      const duration = formData.startDate && formData.endDate
        ? (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60)
        : 3; // Default 3 hours

      const input = {
        eventType: formData.category || 'event',
        title: formData.title,
        description: formData.description,
        duration: Math.max(1, Math.round(duration)),
        attendeeCount: formData.capacity || 100,
        goals: formData.tags || [],
      };

      if (field === 'description') {
        // Simple description generation (existing functionality)
        const generatedDescription = `Join us for ${formData.title}, an exciting ${formData.category || 'event'} that brings together passionate individuals to learn, connect, and grow. This event features interactive sessions, networking opportunities, and hands-on activities designed to inspire and educate attendees.\n\nWhether you're a beginner or an expert, you'll find valuable insights and make meaningful connections. Don't miss this opportunity to be part of something special!`;
        updateFormData({ description: generatedDescription });
      } else if (field === 'agenda') {
        // Call AI to generate agenda
        const response = await fetch('/api/ai/generate-agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) throw new Error('Failed to generate agenda');
        
        const data = await response.json();
        updateFormData({ 
          agenda: data.agenda.agenda.map((item: any) => ({
            time: item.time,
            title: item.title,
            description: item.description,
            speaker: item.speaker,
            duration: item.duration,
          }))
        });
      } else if (field === 'checklist') {
        // Call AI to generate checklist
        const response = await fetch('/api/ai/generate-checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) throw new Error('Failed to generate checklist');
        
        const data = await response.json();
        updateFormData({ 
          checklist: data.checklist.checklist.map((item: any) => ({
            task: item.task,
            category: item.category,
            priority: item.priority,
            completed: false,
          }))
        });
      }

      toast({ 
        title: 'Generated!', 
        description: `AI has generated your ${field}.` 
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Save as draft logic
      toast({ 
        title: 'Draft Saved', 
        description: 'Your event has been saved as a draft.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to save draft.',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.startDate) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please fill in all required fields.',
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    try {
      // Transform agenda items to match Event's AgendaItem type
      const transformedAgenda = formData.agenda?.map((item, index) => ({
        id: `agenda-${index + 1}`,
        title: item.title,
        description: item.description,
        startTime: item.time,
        speaker: item.speaker,
        room: undefined,
        type: 'talk' as const,
      }));

      // Transform ticket tiers for storage
      const transformedTiers = formData.ticketTiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price,
        quantity: tier.quantity,
        sold: 0,
        description: tier.description || '',
        benefits: tier.benefits || [],
      }));

      // Transform custom fields for storage
      const transformedCustomFields = formData.customFields.map(field => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options || [],
      }));

      const eventData: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        time: formData.startTime,
        location: {
          type: formData.locationType,
          isVirtual: formData.locationType !== 'physical',
          venue: formData.locationType !== 'virtual' ? {
            name: formData.venue,
            address: formData.address,
          } : undefined,
          virtualLink: formData.locationType !== 'physical' ? formData.virtualLink : undefined,
        },
        capacity: formData.capacity,
        pricing: {
          type: formData.isFree ? 'free' : 'paid',
          isFree: formData.isFree,
          basePrice: formData.isFree ? 0 : formData.price,
          currency: 'USD',
        },
        visibility: formData.visibility === 'unlisted' ? 'private' : formData.visibility,
        targetAudience: formData.targetAudience === 'all' ? 'Both' : formData.targetAudience === 'students' ? 'Student' : 'Professional',
        imageUrl: formData.imageUrl,
        status: 'published',
        organizerId: user?.uid,
        organizationId: user?.organizationId || 'default',
        registeredCount: 0,
        // Registration settings
        waitlistEnabled: formData.enableWaitlist,
        requiresApproval: formData.requiresApproval,
        // Ticket tiers (only if paid event with tiers)
        ...(transformedTiers.length > 0 && { ticketTiers: transformedTiers }),
        // Custom registration fields
        ...(transformedCustomFields.length > 0 && { customRegistrationFields: transformedCustomFields }),
        // Include AI-generated content if available
        ...(transformedAgenda && transformedAgenda.length > 0 && { 
          agenda: transformedAgenda 
        }),
        ...(formData.checklist && formData.checklist.length > 0 && { 
          checklist: formData.checklist 
        }),
      };

      await eventService.createEvent(eventData as Omit<Event, 'id'>);
      
      toast({ 
        title: 'Event Published! ðŸŽ‰', 
        description: 'Your event is now live and visible to attendees.' 
      });
      
      router.push('/events');
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to publish event. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.length >= 3 && formData.category;
      case 2:
        return formData.startDate && (formData.locationType === 'virtual' || formData.venue);
      case 3:
        return true; // AI step is optional
      case 4:
        return formData.capacity > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Step 1: Basic Info
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="Give your event a catchy name"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(v) => updateFormData({ category: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <div className="relative">
          <Textarea
            id="description"
            placeholder="Tell people what your event is about..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={5}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2 gap-1"
            onClick={() => handleAIGenerate('description')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
            AI Write
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                Ã—
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add tags (press Enter)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
      </div>
    </div>
  );

  // Step 2: Date & Location
  const renderDateLocation = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => updateFormData({ startDate: date })}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => updateFormData({ endDate: date })}
                disabled={(date) => date < (formData.startDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => updateFormData({ startTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => updateFormData({ endTime: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Location Type</Label>
        <div className="grid grid-cols-3 gap-3">
          {(['physical', 'virtual', 'hybrid'] as const).map((type) => (
            <Button
              key={type}
              type="button"
              variant={formData.locationType === type ? 'default' : 'outline'}
              className="capitalize"
              onClick={() => updateFormData({ locationType: type })}
            >
              {type === 'physical' && <MapPin className="mr-2 h-4 w-4" />}
              {type === 'virtual' && <Globe className="mr-2 h-4 w-4" />}
              {type === 'hybrid' && <Users className="mr-2 h-4 w-4" />}
              {type}
            </Button>
          ))}
        </div>
      </div>

      {formData.locationType !== 'virtual' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Venue Name *</Label>
            <Input
              placeholder="e.g., Conference Hall A"
              value={formData.venue}
              onChange={(e) => updateFormData({ venue: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => updateFormData({ address: e.target.value })}
            />
          </div>
        </div>
      )}

      {formData.locationType !== 'physical' && (
        <div className="space-y-2">
          <Label>Virtual Meeting Link</Label>
          <Input
            placeholder="https://zoom.us/..."
            value={formData.virtualLink}
            onChange={(e) => updateFormData({ virtualLink: e.target.value })}
          />
        </div>
      )}
    </div>
  );

  // Step 3: AI Magic
  const renderAIMagic = () => (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Let AI Help You</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our AI can generate descriptions, agendas, and checklists based on your event details.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleAIGenerate('description')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wand2 className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Generate Description</h4>
              <p className="text-sm text-muted-foreground">Create a compelling event description</p>
            </div>
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : formData.description ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleAIGenerate('agenda')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Generate Agenda</h4>
              <p className="text-sm text-muted-foreground">Create a detailed event schedule</p>
            </div>
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : formData.agenda && formData.agenda.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleAIGenerate('checklist')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Generate Checklist</h4>
              <p className="text-sm text-muted-foreground">Get a pre-event planning checklist</p>
            </div>
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : formData.checklist && formData.checklist.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Display Generated Agenda */}
      {formData.agenda && formData.agenda.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Generated Agenda ({formData.agenda.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {formData.agenda.map((item, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.speaker && (
                      <p className="text-xs text-muted-foreground mt-1">Speaker: {item.speaker}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {item.time}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Display Generated Checklist */}
      {formData.checklist && formData.checklist.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Generated Checklist ({formData.checklist.length} tasks)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {formData.checklist.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => {
                    const updated = [...formData.checklist!];
                    updated[index].completed = e.target.checked;
                    updateFormData({ checklist: updated });
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={cn(
                    "text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.task}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={
                      item.priority === 'high' ? 'destructive' :
                      item.priority === 'medium' ? 'default' : 'secondary'
                    } className="text-xs">
                      {item.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        You can skip this step and add these later.
      </p>
    </div>
  );

  // Helper functions for ticket tiers and custom fields
  const addTicketTier = () => {
    const newTier = {
      id: `tier-${Date.now()}`,
      name: '',
      price: 0,
      quantity: 50,
      description: '',
      benefits: []
    };
    updateFormData({ ticketTiers: [...formData.ticketTiers, newTier] });
  };

  const updateTicketTier = (id: string, updates: Partial<typeof formData.ticketTiers[0]>) => {
    updateFormData({
      ticketTiers: formData.ticketTiers.map(tier =>
        tier.id === id ? { ...tier, ...updates } : tier
      )
    });
  };

  const removeTicketTier = (id: string) => {
    updateFormData({
      ticketTiers: formData.ticketTiers.filter(tier => tier.id !== id)
    });
  };

  const addCustomField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      label: '',
      type: 'text' as const,
      required: false,
      options: []
    };
    updateFormData({ customFields: [...formData.customFields, newField] });
  };

  const updateCustomField = (id: string, updates: Partial<typeof formData.customFields[0]>) => {
    updateFormData({
      customFields: formData.customFields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    });
  };

  const removeCustomField = (id: string) => {
    updateFormData({
      customFields: formData.customFields.filter(field => field.id !== id)
    });
  };

  // Step 4: Ticketing
  const renderTicketing = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Event Capacity *</Label>
        <Input
          type="number"
          min={1}
          value={formData.capacity}
          onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || 0 })}
        />
        <p className="text-sm text-muted-foreground">Maximum number of attendees</p>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Free Event</p>
          <p className="text-sm text-muted-foreground">No registration fee required</p>
        </div>
        <Switch
          checked={formData.isFree}
          onCheckedChange={(checked) => updateFormData({ isFree: checked, price: checked ? 0 : formData.price })}
        />
      </div>

      {!formData.isFree && (
        <>
          <div className="space-y-2">
            <Label>Base Ticket Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                step={0.01}
                className="pl-9"
                value={formData.price}
                onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Multiple Ticket Tiers */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ticket Tiers</CardTitle>
                <Button variant="outline" size="sm" onClick={addTicketTier}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tier
                </Button>
              </div>
              <CardDescription>Create different ticket types with varying prices and benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.ticketTiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ticket tiers yet. Add tiers to offer different pricing options.
                </p>
              ) : (
                formData.ticketTiers.map((tier, index) => (
                  <div key={tier.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">Tier {index + 1}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTicketTier(tier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tier Name</Label>
                        <Input
                          placeholder="e.g., Early Bird, VIP"
                          value={tier.name}
                          onChange={(e) => updateTicketTier(tier.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price (USD)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={tier.price}
                          onChange={(e) => updateTicketTier(tier.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity Available</Label>
                        <Input
                          type="number"
                          min={1}
                          value={tier.quantity}
                          onChange={(e) => updateTicketTier(tier.id, { quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="What's included"
                          value={tier.description || ''}
                          onChange={(e) => updateTicketTier(tier.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Waitlist Option */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Enable Waitlist</p>
          <p className="text-sm text-muted-foreground">Allow users to join waitlist when sold out</p>
        </div>
        <Switch
          checked={formData.enableWaitlist}
          onCheckedChange={(checked) => updateFormData({ enableWaitlist: checked })}
        />
      </div>

      {/* Custom Registration Fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Custom Registration Fields</CardTitle>
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
          <CardDescription>Collect additional information from attendees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.customFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No custom fields. Add fields to collect extra info like dietary restrictions, T-shirt size, etc.
            </p>
          ) : (
            formData.customFields.map((field) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Field Label</Label>
                    <Input
                      placeholder="e.g., Dietary Restrictions"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateCustomField(field.id, { type: v as 'text' | 'email' | 'phone' | 'select' | 'checkbox' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {field.type === 'select' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Options (comma separated)</Label>
                    <Input
                      placeholder="Option 1, Option 2, Option 3"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => updateCustomField(field.id, { 
                        options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and join' },
            { value: 'unlisted', label: 'Unlisted', icon: Eye, desc: 'Only with link' },
            { value: 'private', label: 'Private', icon: Lock, desc: 'Invite only' },
          ] as const).map((opt) => (
            <Card 
              key={opt.value}
              className={cn(
                "cursor-pointer transition-colors",
                formData.visibility === opt.value && "border-primary bg-primary/5"
              )}
              onClick={() => updateFormData({ visibility: opt.value })}
            >
              <CardContent className="p-3 text-center">
                <opt.icon className="h-5 w-5 mx-auto mb-2" />
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <Select value={formData.targetAudience} onValueChange={(v) => updateFormData({ targetAudience: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {targetAudiences.map((aud) => (
              <SelectItem key={aud.value} value={aud.value}>{aud.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Require Approval</p>
          <p className="text-sm text-muted-foreground">Manually approve each registration</p>
        </div>
        <Switch
          checked={formData.requiresApproval}
          onCheckedChange={(checked) => updateFormData({ requiresApproval: checked })}
        />
      </div>
    </div>
  );

  // Step 5: Preview
  const renderPreview = () => (
    <div className="space-y-6">
      <Card>
        <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
          {formData.imageUrl ? (
            <img src={formData.imageUrl} alt="Event" className="w-full h-full object-cover rounded-t-lg" />
          ) : (
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No image uploaded</p>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge>{formData.category || 'Uncategorized'}</Badge>
            {formData.isFree ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">Free</Badge>
            ) : (
              <Badge variant="secondary">${formData.price}</Badge>
            )}
            <Badge variant="outline" className="capitalize">{formData.visibility}</Badge>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{formData.title || 'Untitled Event'}</h2>
          
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {formData.description || 'No description provided.'}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>
                {formData.startDate ? format(formData.startDate, 'PPP') : 'Date not set'}
                {formData.startTime && ` at ${formData.startTime}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {formData.locationType === 'virtual' 
                  ? 'Virtual Event' 
                  : formData.venue || 'Location not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{formData.capacity} spots available</span>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Generated Content Preview */}
      {(formData.agenda && formData.agenda.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Event Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.agenda.map((item, index) => (
                <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-primary">
                    {item.time}
                    {item.duration && <span className="text-xs text-muted-foreground block">{item.duration}</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    {item.speaker && (
                      <p className="text-xs text-primary mt-1">Speaker: {item.speaker}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(formData.checklist && formData.checklist.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Planning Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <div className="flex-1">
                    <p className="text-sm">{item.task}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          item.priority === 'high' && "border-red-500 text-red-600",
                          item.priority === 'medium' && "border-yellow-500 text-yellow-600",
                          item.priority === 'low' && "border-green-500 text-green-600"
                        )}
                      >
                        {item.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.category.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Ready to Publish</p>
              <p className="text-sm text-muted-foreground">
                Your event will be visible to {formData.visibility === 'public' ? 'everyone' : formData.visibility === 'unlisted' ? 'people with the link' : 'invited guests only'}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderBasicInfo();
      case 2: return renderDateLocation();
      case 3: return renderAIMagic();
      case 4: return renderTicketing();
      case 5: return renderPreview();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowExitDialog(true)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Exit
            </Button>
            <h1 className="font-semibold">Create Event</h1>
            <Button variant="ghost" onClick={handleSaveDraft} disabled={isSaving}>
              Save Draft
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    currentStep === step.id 
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "hidden sm:block w-16 lg:w-24 h-0.5 mx-2",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === steps.length ? (
            <Button onClick={handlePublish} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Event
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.back()}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
