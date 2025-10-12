/**
 * EventOS Enhanced Event Management System
 * Multi-tier pricing, session management, AI recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Star,
  Zap,
  QrCode,
  Share2,
  Copy,
  Eye,
  BarChart3,
  MessageSquare,
  Settings,
  Upload,
  Download,
  Filter,
  Search,
  Calendar as CalendarLucide,
  Globe,
  Lock,
  ChevronDown,
  ChevronRight,
  Award,
  Mic,
  Building,
  Camera,
  Heart,
  Shield,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import type { Event, Session, PricingTier, EventSettings } from '@/types/eventos';
import { EVENTOS_CONFIG } from '@/lib/eventos-config';

// Enhanced Event Form Schema
const eventFormSchema = z.object({
  // Basic Information
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  shortDescription: z.string().max(150, 'Short description must be less than 150 characters').optional(),
  
  // Event Details
  type: z.enum(['conference', 'workshop', 'networking', 'webinar', 'training', 'meetup', 'exhibition', 'festival']),
  category: z.string().min(2, 'Please select a category'),
  tags: z.array(z.string()).min(1, 'Add at least one tag'),
  
  // Date & Time
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  timezone: z.string().default('UTC'),
  
  // Location
  locationType: z.enum(['physical', 'virtual', 'hybrid']),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  virtualPlatform: z.string().optional(),
  
  // Capacity & Registration
  maxAttendees: z.number().min(1, 'Must allow at least 1 attendee').max(100000),
  registrationRequired: z.boolean().default(true),
  registrationDeadline: z.date().optional(),
  waitlistEnabled: z.boolean().default(false),
  
  // Visibility & Access
  visibility: z.enum(['public', 'organization', 'private', 'invite_only']),
  requireApproval: z.boolean().default(false),
  ageRestriction: z.number().min(0).max(100).optional(),
  
  // Pricing
  isPaid: z.boolean().default(false),
  currency: z.string().length(3).default('USD'),
  pricingTiers: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number().min(0),
    maxTickets: z.number().min(1).optional(),
    earlyBirdDeadline: z.date().optional(),
    earlyBirdPrice: z.number().min(0).optional(),
    benefits: z.array(z.string()).default([]),
    isDefault: z.boolean().default(false),
  })).optional(),
  
  // Content
  agenda: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    speakerId: z.string().optional(),
    sessionType: z.enum(['presentation', 'workshop', 'panel', 'networking', 'break']),
    location: z.string().optional(),
  })).default([]),
  
  // Media
  bannerUrl: z.string().url('Invalid banner URL').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  galleryUrls: z.array(z.string().url()).default([]),
  
  // Settings
  settings: z.object({
    allowNetworking: z.boolean().default(true),
    enableChat: z.boolean().default(true),
    enableQRCheckin: z.boolean().default(true),
    enableRecording: z.boolean().default(false),
    enableFeedback: z.boolean().default(true),
    enableCertificates: z.boolean().default(false),
    enableGamification: z.boolean().default(false),
    enableAI: z.boolean().default(true),
    customFields: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'textarea', 'select', 'checkbox', 'date']),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
    })).default([]),
  }).optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

// Predefined options
const EVENT_CATEGORIES = [
  'Technology', 'Business', 'Marketing', 'Design', 'Science', 'Healthcare',
  'Education', 'Entertainment', 'Sports', 'Arts', 'Non-Profit', 'Government'
];

const EVENT_TAGS = [
  'AI/ML', 'Cloud', 'Mobile', 'Web Development', 'Data Science', 'Cybersecurity',
  'Leadership', 'Startup', 'Innovation', 'Networking', 'Training', 'Workshop',
  'Conference', 'Meetup', 'Virtual', 'Hybrid', 'Free', 'Premium'
];

const VIRTUAL_PLATFORMS = [
  'Zoom', 'Microsoft Teams', 'Google Meet', 'WebEx', 'GoToMeeting', 
  'Custom Platform', 'YouTube Live', 'Twitch', 'Other'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export function EnhancedEventManagement() {
  const [activeTab, setActiveTab] = useState('create');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      type: 'conference',
      locationType: 'physical',
      visibility: 'public',
      registrationRequired: true,
      waitlistEnabled: false,
      requireApproval: false,
      isPaid: false,
      currency: 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      maxAttendees: 100,
      tags: [],
      agenda: [],
      pricingTiers: [],
      settings: {
        allowNetworking: true,
        enableChat: true,
        enableQRCheckin: true,
        enableRecording: false,
        enableFeedback: true,
        enableCertificates: false,
        enableGamification: false,
        enableAI: true,
        customFields: [],
      },
    },
  });

  const watchIsPaid = form.watch('isPaid');
  const watchLocationType = form.watch('locationType');
  const watchPricingTiers = form.watch('pricingTiers');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'AI & Future of Work Conference 2024',
          description: 'Explore how artificial intelligence is reshaping the workplace and discover strategies for adapting to the future of work.',
          shortDescription: 'Explore AI\'s impact on the workplace',
          type: 'conference',
          category: 'Technology',
          tags: ['AI/ML', 'Future of Work', 'Leadership'],
          startDate: new Date('2024-12-15T09:00:00'),
          endDate: new Date('2024-12-15T17:00:00'),
          timezone: 'America/New_York',
          locationType: 'hybrid',
          venue: 'Tech Convention Center',
          address: '123 Innovation Blvd',
          city: 'San Francisco',
          country: 'USA',
          virtualPlatform: 'Zoom',
          maxAttendees: 500,
          currentAttendees: 342,
          registrationRequired: true,
          visibility: 'public',
          isPaid: true,
          currency: 'USD',
          organizationId: 'demo-org',
          organizerId: user?.id || '',
          status: 'published',
          createdAt: new Date('2024-11-01'),
          updatedAt: new Date('2024-11-15'),
          pricingTiers: [
            {
              id: 'early-bird',
              name: 'Early Bird',
              description: 'Limited time offer',
              price: 199,
              originalPrice: 299,
              maxTickets: 100,
              soldTickets: 85,
              isDefault: true,
              benefits: ['Full conference access', 'Networking lunch', 'Welcome kit'],
              isActive: true,
            },
            {
              id: 'regular',
              name: 'Regular',
              description: 'Standard pricing',
              price: 299,
              maxTickets: 300,
              soldTickets: 157,
              isDefault: false,
              benefits: ['Full conference access', 'Networking lunch'],
              isActive: true,
            },
          ],
          settings: {
            allowNetworking: true,
            enableChat: true,
            enableQRCheckin: true,
            enableRecording: true,
            enableFeedback: true,
            enableCertificates: true,
            enableGamification: true,
            enableAI: true,
          },
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      // Validate end date is after start date
      if (data.endDate <= data.startDate) {
        toast({
          title: 'Invalid Dates',
          description: 'End date must be after start date.',
          variant: 'destructive',
        });
        return;
      }

      // Generate event ID and prepare data
      const eventId = `EVT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const eventData: Event = {
        ...data,
        id: eventId,
        organizationId: user?.organizationId || '',
        organizerId: user?.id || '',
        status: 'draft',
        currentAttendees: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        pricingTiers: data.pricingTiers || [],
        settings: data.settings || {
          allowNetworking: true,
          enableChat: true,
          enableQRCheckin: true,
          enableRecording: false,
          enableFeedback: true,
          enableCertificates: false,
          enableGamification: false,
          enableAI: true,
        },
      };

      // Save event (mock implementation)
      console.log('Creating event:', eventData);
      
      // Add to events list
      setEvents(prev => [eventData, ...prev]);
      
      // Reset form
      form.reset();
      
      toast({
        title: 'Event Created Successfully!',
        description: `Event "${data.title}" has been created with ID: ${eventId}`,
      });

      // Switch to events tab
      setActiveTab('events');
    } catch (error) {
      console.error('Event creation error:', error);
      toast({
        title: 'Creation Failed',
        description: 'There was an error creating the event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIRecommendations = async () => {
    setShowAIRecommendations(true);
    // Mock AI recommendations - replace with actual AI integration
    toast({
      title: 'AI Recommendations Generated',
      description: 'Based on your event details, we\'ve suggested optimizations for pricing, timing, and content.',
    });
  };

  const addPricingTier = () => {
    const currentTiers = form.getValues('pricingTiers') || [];
    const newTier = {
      name: `Tier ${currentTiers.length + 1}`,
      description: '',
      price: 0,
      benefits: [],
      isDefault: currentTiers.length === 0,
    };
    form.setValue('pricingTiers', [...currentTiers, newTier]);
  };

  const removePricingTier = (index: number) => {
    const currentTiers = form.getValues('pricingTiers') || [];
    const updatedTiers = currentTiers.filter((_, i) => i !== index);
    form.setValue('pricingTiers', updatedTiers);
  };

  const renderEventCreationForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>
              Essential details about your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="AI & Future of Work Conference 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="meetup">Meetup</SelectItem>
                        <SelectItem value="exhibition">Exhibition</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a comprehensive description of your event (10-2000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief one-liner for event cards"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional short description for event previews (max 150 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags *</FormLabel>
                  <FormDescription>
                    Select relevant tags to help people discover your event
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EVENT_TAGS.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={field.value?.includes(tag) || false}
                          onCheckedChange={(checked) => {
                            const currentTags = field.value || [];
                            if (checked) {
                              field.onChange([...currentTags, tag]);
                            } else {
                              field.onChange(currentTags.filter((t: string) => t !== tag));
                            }
                          }}
                        />
                        <label htmlFor={tag} className="text-sm font-medium">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarLucide className="w-5 h-5" />
              <span>Date & Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && 'text-muted-foreground'
                            }`}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && 'text-muted-foreground'
                            }`}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Intl.supportedValuesOf('timeZone').slice(0, 20).map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="physical">🏢 Physical Location</SelectItem>
                      <SelectItem value="virtual">🌐 Virtual Event</SelectItem>
                      <SelectItem value="hybrid">🔗 Hybrid Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchLocationType === 'physical' || watchLocationType === 'hybrid') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Convention Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Innovation Blvd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {(watchLocationType === 'virtual' || watchLocationType === 'hybrid') && (
              <FormField
                control={form.control}
                name="virtualPlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Virtual Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VIRTUAL_PLATFORMS.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Pricing & Registration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Paid Event</FormLabel>
                      <FormDescription>
                        Charge attendees for tickets
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Attendees *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100000"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">🌍 Public</SelectItem>
                        <SelectItem value="organization">🏢 Organization Only</SelectItem>
                        <SelectItem value="private">🔒 Private</SelectItem>
                        <SelectItem value="invite_only">📧 Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchIsPaid && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-48">
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Pricing Tiers</h4>
                    <Button type="button" variant="outline" onClick={addPricingTier}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>

                  {watchPricingTiers && watchPricingTiers.length > 0 ? (
                    <div className="space-y-4">
                      {watchPricingTiers.map((tier, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <h5 className="font-medium">Tier {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePricingTier(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Tier Name</label>
                                <Input
                                  placeholder="Early Bird"
                                  value={tier.name}
                                  onChange={(e) => {
                                    const updatedTiers = [...watchPricingTiers];
                                    updatedTiers[index].name = e.target.value;
                                    form.setValue('pricingTiers', updatedTiers);
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Price</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="199.00"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const updatedTiers = [...watchPricingTiers];
                                    updatedTiers[index].price = parseFloat(e.target.value) || 0;
                                    form.setValue('pricingTiers', updatedTiers);
                                  }}
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                  placeholder="Limited time offer"
                                  value={tier.description}
                                  onChange={(e) => {
                                    const updatedTiers = [...watchPricingTiers];
                                    updatedTiers[index].description = e.target.value;
                                    form.setValue('pricingTiers', updatedTiers);
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No pricing tiers added yet</p>
                        <Button type="button" variant="outline" onClick={addPricingTier} className="mt-3">
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Tier
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {showAIRecommendations && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>AI Recommendations</span>
              </CardTitle>
              <CardDescription>
                Optimize your event based on data insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border">
                  <h4 className="font-medium text-sm mb-2">💰 Pricing Optimization</h4>
                  <p className="text-xs text-muted-foreground">Consider setting early bird pricing at $149 (25% discount) to boost early registrations</p>
                </div>
                
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border">
                  <h4 className="font-medium text-sm mb-2">📅 Timing Suggestion</h4>
                  <p className="text-xs text-muted-foreground">Tuesday-Thursday events see 34% higher attendance than Monday/Friday</p>
                </div>
                
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border">
                  <h4 className="font-medium text-sm mb-2">🎯 Target Audience</h4>
                  <p className="text-xs text-muted-foreground">Based on your tags, consider targeting 'Product Managers' and 'Tech Leaders'</p>
                </div>
                
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border">
                  <h4 className="font-medium text-sm mb-2">📈 Marketing Boost</h4>
                  <p className="text-xs text-muted-foreground">Events with speaker highlights see 45% more registrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={generateAIRecommendations}
            disabled={isLoading}
          >
            <Zap className="w-4 h-4 mr-2" />
            Get AI Suggestions
          </Button>

          <div className="space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isLoading}
            >
              Reset Form
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  const renderEventsManagement = () => (
    <div className="space-y-6">
      {/* Events Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Events</h2>
          <p className="text-muted-foreground">Manage and monitor all your events</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-white/90 text-black">
                  {event.type}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="font-semibold text-sm">{event.title}</h3>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.shortDescription || event.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CalendarLucide className="w-3 h-3" />
                    <span>{event.startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{event.currentAttendees}/{event.maxAttendees}</span>
                  </div>
                  {event.isPaid && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{event.currency}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {events.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="p-12 text-center">
              <CalendarLucide className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started</p>
              <Button onClick={() => setActiveTab('create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Event Management</h1>
          <p className="text-muted-foreground">Create and manage professional events with AI-powered insights</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          Quick Create
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Event</TabsTrigger>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {renderEventCreationForm()}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          {renderEventsManagement()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Templates</CardTitle>
              <CardDescription>
                Start with pre-designed templates for common event types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Template library will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
              <CardDescription>
                Track performance across all your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}