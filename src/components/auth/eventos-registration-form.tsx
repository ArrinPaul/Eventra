/**
 * Enhanced Registration System for EventOS
 * Multi-role registration with OAuth2 support and dynamic forms
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
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  GraduationCap, 
  Briefcase, 
  Mic, 
  Shield,
  Heart,
  Users,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  Google,
  Linkedin,
  Github
} from 'lucide-react';
import { EVENTOS_CONFIG, EventOSRole } from '@/lib/eventos-config';
import type { Organization } from '@/types/eventos';

// Enhanced validation schemas for each role
const baseUserSchema = z.object({
  // Basic Information
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  
  // Role Selection
  role: z.enum(['attendee', 'speaker', 'organizer', 'vendor', 'volunteer', 'sponsor', 'media'] as const),
  
  // Basic Profile
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  
  // Privacy & Preferences
  profileVisibility: z.enum(['public', 'organization', 'private']).default('organization'),
  allowDirectMessages: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  
  // Notifications
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  
  // AI Preferences
  aiAssistantEnabled: z.boolean().default(true),
  aiRecommendations: z.boolean().default(true),
  dataForAI: z.boolean().default(false),
  
  // Consent & Legal
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  marketingConsent: z.boolean().default(false),
  dataProcessingConsent: z.boolean().default(false),
});

// Role-specific schemas
const attendeeSchema = baseUserSchema.extend({
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  jobTitle: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  experience: z.string().max(50).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
  
  // Networking preferences
  lookingFor: z.array(z.string()).default([]),
  canOffer: z.array(z.string()).default([]),
  preferredContactMethod: z.enum(['email', 'linkedin', 'app']).default('app'),
});

const speakerSchema = baseUserSchema.extend({
  title: z.string().min(2, 'Professional title is required').max(100),
  company: z.string().min(2, 'Company is required').max(100),
  expertise: z.array(z.string()).min(1, 'Select at least one area of expertise'),
  topics: z.array(z.string()).min(1, 'Add at least one speaking topic'),
  
  // Social links
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  
  // Speaking experience
  previousTalks: z.string().max(1000).optional(),
  availableForSpeaking: z.boolean().default(true),
  travelWillingness: z.enum(['local', 'national', 'international']).default('local'),
  speakingFeeRequired: z.boolean().default(false),
  speakingFeeAmount: z.number().min(0).optional(),
  speakingFeeCurrency: z.string().length(3).default('USD'),
  speakingFeeNegotiable: z.boolean().default(true),
});

const organizerSchema = baseUserSchema.extend({
  title: z.string().min(2, 'Job title is required').max(100),
  department: z.string().max(100).optional(),
  organizationName: z.string().min(2, 'Organization name is required').max(100),
  yearsExperience: z.number().min(0).max(50).optional(),
  specializations: z.array(z.string()).default([]),
  
  // Contact preferences
  preferredContactStart: z.string().default('09:00'),
  preferredContactEnd: z.string().default('17:00'),
  
  // Permissions (will be set by admin later)
  requestedPermissions: z.array(z.string()).default([]),
});

const vendorSchema = baseUserSchema.extend({
  companyName: z.string().min(2, 'Company name is required').max(100),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  serviceArea: z.enum(['local', 'regional', 'national', 'international']).default('local'),
  website: z.string().url('Valid website URL is required'),
  
  // Business details
  businessType: z.enum(['individual', 'company']).default('company'),
  yearsInBusiness: z.number().min(0).max(100),
  teamSize: z.number().min(1).max(10000),
  
  // Pricing
  hourlyRateMin: z.number().min(0).optional(),
  hourlyRateMax: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  
  // Portfolio
  portfolioUrls: z.array(z.string().url()).default([]),
});

// Create union type for all form schemas
type RegistrationFormData = 
  | z.infer<typeof attendeeSchema>
  | z.infer<typeof speakerSchema>
  | z.infer<typeof organizerSchema>
  | z.infer<typeof vendorSchema>;

// Predefined options for dropdowns
const INTERESTS = [
  'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cloud Computing',
  'Cybersecurity', 'Mobile Development', 'Web Development', 'DevOps',
  'Blockchain', 'IoT', 'AR/VR', 'Product Management', 'UX/UI Design',
  'Digital Marketing', 'Entrepreneurship', 'Leadership', 'Innovation',
  'Sustainability', 'Finance', 'Healthcare', 'Education', 'E-commerce'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
  'Consulting', 'Media', 'Government', 'Non-Profit', 'Automotive', 'Energy',
  'Real Estate', 'Transportation', 'Hospitality', 'Agriculture', 'Other'
];

const EXPERTISE_AREAS = [
  'Software Development', 'Data Science', 'Product Strategy', 'User Experience',
  'Digital Transformation', 'Leadership', 'Innovation Management', 'Cybersecurity',
  'Cloud Architecture', 'AI/ML', 'Blockchain', 'Mobile Development', 'DevOps',
  'Project Management', 'Business Development', 'Marketing Strategy'
];

const VENDOR_SERVICES = [
  'Event Planning', 'Catering', 'Audio/Visual', 'Photography', 'Videography',
  'Decoration', 'Security', 'Transportation', 'Marketing', 'Design',
  'Technology Solutions', 'Venue Management', 'Registration Services'
];

const ORGANIZER_SPECIALIZATIONS = [
  'Corporate Events', 'Conferences', 'Workshops', 'Trade Shows', 'Webinars',
  'Networking Events', 'Product Launches', 'Training Sessions', 'Festivals',
  'Sports Events', 'Cultural Events', 'Educational Programs'
];

export function EnhancedRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<EventOSRole>('attendee');
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  
  const { register, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Dynamic schema based on role
  const getFormSchema = (role: EventOSRole) => {
    switch (role) {
      case 'attendee': return attendeeSchema;
      case 'speaker': return speakerSchema;
      case 'organizer': return organizerSchema;
      case 'vendor': return vendorSchema;
      default: return baseUserSchema;
    }
  };

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(getFormSchema(selectedRole)),
    defaultValues: {
      role: 'attendee',
      profileVisibility: 'organization',
      allowDirectMessages: true,
      showEmail: false,
      showPhone: false,
      emailNotifications: true,
      pushNotifications: true,
      aiAssistantEnabled: true,
      aiRecommendations: true,
      dataForAI: false,
      termsAccepted: false,
      privacyPolicyAccepted: false,
      marketingConsent: false,
      dataProcessingConsent: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language.split('-')[0] || 'en',
    },
  });

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Update form schema when role changes
  useEffect(() => {
    const newSchema = getFormSchema(selectedRole);
    // Reset form with new schema validation
    form.clearErrors();
    setSelectedRole(selectedRole);
  }, [selectedRole, form]);

  const loadOrganizations = async () => {
    try {
      // This would typically fetch from your API
      // For now, we'll use mock data
      const mockOrgs: Organization[] = [
        {
          id: 'demo-org',
          name: 'Demo Organization',
          slug: 'demo-org',
          subscriptionPlan: 'pro',
          subscriptionStatus: 'active',
          billingEmail: 'billing@demo.com',
          settings: {
            timezone: 'UTC',
            language: 'en',
            dateFormat: 'MM/DD/YYYY',
            defaultEventDuration: 60,
            allowPublicEvents: true,
            requireApprovalForEvents: false,
            allowSelfRegistration: true,
            requireEmailVerification: true,
            defaultUserRole: 'attendee',
            enabledIntegrations: [],
            enforceSSO: false,
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireNumbers: true,
              requireSymbols: false,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          isActive: true,
          features: ['basic', 'ai', 'integrations'],
        }
      ];
      setOrganizations(mockOrgs);
      if (mockOrgs.length === 1) {
        setSelectedOrg(mockOrgs[0].id);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations. Please refresh the page.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = (role: EventOSRole) => {
    setSelectedRole(role);
    form.setValue('role', role);
    setCurrentStep(1); // Reset to first step when role changes
  };

  const handleOAuthLogin = async (provider: 'google' | 'linkedin' | 'github') => {
    setIsLoading(true);
    try {
      // Implement OAuth login logic here
      toast({
        title: 'OAuth Login',
        description: `${provider} OAuth login will be implemented here.`,
      });
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: 'There was an error with OAuth login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!selectedOrg) {
      toast({
        title: 'Organization Required',
        description: 'Please select an organization to join.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate unique registration ID
      const registrationId = `REG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Prepare user data based on role
      const userData = {
        ...data,
        organizationId: selectedOrg,
        registrationId,
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Register user
      await register(userData);

      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account.',
        variant: 'default',
      });

      // Redirect to verification page or dashboard
      router.push('/verify-email');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: 'There was an error creating your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-headline">Choose Your Role</h2>
        <p className="text-muted-foreground mt-2">
          Select the role that best describes how you'll be participating
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries({
          attendee: { icon: User, title: 'Attendee', desc: 'Participate in events and sessions', color: 'bg-blue-500' },
          speaker: { icon: Mic, title: 'Speaker', desc: 'Share knowledge and present sessions', color: 'bg-purple-500' },
          organizer: { icon: Shield, title: 'Organizer', desc: 'Manage and coordinate events', color: 'bg-green-500' },
          vendor: { icon: Briefcase, title: 'Vendor', desc: 'Provide services for events', color: 'bg-orange-500' },
          volunteer: { icon: Heart, title: 'Volunteer', desc: 'Help with event operations', color: 'bg-pink-500' },
          sponsor: { icon: Building, title: 'Sponsor', desc: 'Support events and initiatives', color: 'bg-indigo-500' },
          media: { icon: Camera, title: 'Media', desc: 'Cover and document events', color: 'bg-teal-500' },
        }).map(([key, role]) => {
          const Icon = role.icon;
          const isSelected = selectedRole === key;
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
              }`}
              onClick={() => handleRoleChange(key as EventOSRole)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${role.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
                {isSelected && (
                  <Badge variant="default" className="mt-3">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Organization Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Select Organization</h3>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an organization to join" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center space-x-2">
                  <span>{org.name}</span>
                  <Badge variant={org.subscriptionPlan === 'enterprise' ? 'default' : 'secondary'}>
                    {org.subscriptionPlan}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* OAuth Options */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full"
          >
            <Google className="w-4 h-4 mr-2" />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('linkedin')}
            disabled={isLoading}
            className="w-full"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="w-full"
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-headline">Basic Information</h2>
        <p className="text-muted-foreground mt-2">
          Tell us about yourself
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="John Doe" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="john@example.com" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
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

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us about yourself..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Optional. This will be visible on your profile.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Role-specific fields */}
      {renderRoleSpecificFields()}
    </div>
  );

  const renderRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'attendee':
        return (
          <div className="space-y-6">
            <Separator />
            <h3 className="text-lg font-semibold">Professional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skillLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests *</FormLabel>
                  <FormDescription>
                    Select topics you're interested in (helps with AI recommendations)
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {INTERESTS.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={field.value?.includes(interest) || false}
                          onCheckedChange={(checked) => {
                            const currentInterests = field.value || [];
                            if (checked) {
                              field.onChange([...currentInterests, interest]);
                            } else {
                              field.onChange(currentInterests.filter((i: string) => i !== interest));
                            }
                          }}
                        />
                        <label
                          htmlFor={interest}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {interest}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'speaker':
        return (
          <div className="space-y-6">
            <Separator />
            <h3 className="text-lg font-semibold">Speaker Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas of Expertise *</FormLabel>
                  <FormDescription>
                    Select your areas of expertise
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EXPERTISE_AREAS.map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={area}
                          checked={field.value?.includes(area) || false}
                          onCheckedChange={(checked) => {
                            const currentExpertise = field.value || [];
                            if (checked) {
                              field.onChange([...currentExpertise, area]);
                            } else {
                              field.onChange(currentExpertise.filter((e: string) => e !== area));
                            }
                          }}
                        />
                        <label htmlFor={area} className="text-sm font-medium">
                          {area}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yoursite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      // Add similar implementations for organizer, vendor roles...
      default:
        return null;
    }
  };

  const renderPrivacyAndConsent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-headline">Privacy & Preferences</h2>
        <p className="text-muted-foreground mt-2">
          Customize your privacy settings and preferences
        </p>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control who can see your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="profileVisibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Visibility</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see</SelectItem>
                    <SelectItem value="organization">Organization - Only org members</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="showEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Show Email</FormLabel>
                    <FormDescription className="text-xs">
                      Display email on your profile
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowDirectMessages"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Allow Direct Messages</FormLabel>
                    <FormDescription className="text-xs">
                      Let others message you directly
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you'd like to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Email Notifications</FormLabel>
                    <FormDescription className="text-xs">
                      Receive updates via email
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pushNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Push Notifications</FormLabel>
                    <FormDescription className="text-xs">
                      Receive browser/mobile notifications
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Preferences</CardTitle>
          <CardDescription>
            Configure how AI features work for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="aiAssistantEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>AI Assistant</FormLabel>
                    <FormDescription className="text-xs">
                      Enable AI-powered assistance
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiRecommendations"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>AI Recommendations</FormLabel>
                    <FormDescription className="text-xs">
                      Get personalized suggestions
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dataForAI"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Use Data for AI Training</FormLabel>
                  <FormDescription className="text-xs">
                    Help improve AI features (anonymous data only)
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Legal Consent */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Agreements</CardTitle>
          <CardDescription>
            Please review and accept our terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I accept the{' '}
                    <Link href="/terms" className="underline text-primary hover:no-underline">
                      Terms and Conditions
                    </Link>{' '}
                    *
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="privacyPolicyAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I accept the{' '}
                    <Link href="/privacy" className="underline text-primary hover:no-underline">
                      Privacy Policy
                    </Link>{' '}
                    *
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketingConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to receive marketing communications
                  </FormLabel>
                  <FormDescription>
                    You can unsubscribe at any time
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderRoleSelection();
      case 2:
        return renderBasicInformation();
      case 3:
        return renderPrivacyAndConsent();
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 1 && (!selectedRole || !selectedOrg)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}