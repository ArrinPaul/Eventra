'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  User, 
  GraduationCap, 
  Building, 
  Mic, 
  Settings, 
  ChevronRight,
  Upload,
  QrCode,
  Mail,
  CheckCircle
} from 'lucide-react';
import type { UserRole } from '@/types';

// Define enhanced user roles including Speaker
export type ExtendedUserRole = 'student' | 'professional' | 'speaker' | 'organizer';

// Common schema for all roles
const baseSchema = z.object({
  // Common Fields
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  country: z.string().min(2, { message: 'Country is required.' }),
  bloodGroup: z.string().min(2, { message: 'Blood group is required.' }),
  foodPreference: z.enum(['veg', 'non-veg', 'vegan']),
  emergencyContactName: z.string().min(2, { message: 'Emergency contact name is required.' }),
  emergencyContactNumber: z.string().min(10, { message: 'Emergency contact number is required.' }),
  consentCheckbox: z.boolean().refine((value) => value, {
    message: 'You must agree to receive updates and notifications.',
  }),
});

// Role-specific schemas
const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  collegeName: z.string().min(2, { message: 'College name is required.' }),
  degreeLevel: z.enum(['ug', 'pg']),
  yearOfStudy: z.coerce.number().min(1).max(8),
  branchDepartment: z.string().min(2, { message: 'Branch/Department is required.' }),
});

const professionalSchema = baseSchema.extend({
  role: z.literal('professional'),
  companyName: z.string().min(2, { message: 'Company name is required.' }),
  designation: z.string().min(2, { message: 'Designation is required.' }),
  industry: z.string().min(2, { message: 'Industry is required.' }),
  yearsOfExperience: z.coerce.number().min(0).max(50),
});

const speakerSchema = baseSchema.extend({
  role: z.literal('speaker'),
  track: z.string().min(1, { message: 'Track is required.' }),
  sessionCategory: z.enum(['talk', 'workshop', 'demo']),
  sessionTitle: z.string().min(5, { message: 'Session title must be at least 5 characters.' }),
  sessionAbstract: z.string().min(50, { message: 'Session abstract must be at least 50 characters.' }),
  coSpeakerDetails: z.string().optional(),
  linkedinUrl: z.string().url({ message: 'Please enter a valid LinkedIn URL.' }).optional().or(z.literal('')),
  sapCommunityUrl: z.string().url({ message: 'Please enter a valid SAP Community URL.' }).optional().or(z.literal('')),
  tshirtSize: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl']),
  presentationMaterials: z.string().optional(), // Will store file URL or link
});

const organizerSchema = baseSchema.extend({
  role: z.literal('organizer'),
  organizationName: z.string().min(2, { message: 'Organization name is required.' }),
  roleResponsibility: z.string().min(2, { message: 'Role/Responsibility is required.' }),
  permissions: z.object({
    createEvents: z.boolean(),
    manageUsers: z.boolean(),
    viewAnalytics: z.boolean(),
  }),
  verificationCode: z.string().min(1, { message: 'Verification code is required.' }),
});

// Discriminated union for all role types
const registrationSchema = z.discriminatedUnion('role', [
  studentSchema,
  professionalSchema,
  speakerSchema,
  organizerSchema,
]);

type RegistrationFormData = z.infer<typeof registrationSchema>;

// Role selection component
interface RoleSelectionProps {
  selectedRole: ExtendedUserRole | null;
  onRoleSelect: (role: ExtendedUserRole) => void;
}

function RoleSelection({ selectedRole, onRoleSelect }: RoleSelectionProps) {
  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      description: 'Currently studying at a college or university',
      icon: GraduationCap,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'professional' as const,
      title: 'Professional',
      description: 'Working professional in the industry',
      icon: Building,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'speaker' as const,
      title: 'Speaker',
      description: 'Presenting at events and conferences',
      icon: Mic,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'organizer' as const,
      title: 'Event Manager / Organizer',
      description: 'Managing and organizing events',
      icon: Settings,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Role</h2>
        <p className="text-gray-600">Select the option that best describes you</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onRoleSelect(role.id)}
            className={`p-6 rounded-lg border-2 text-left transition-all ${role.color} ${
              selectedRole === role.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <role.icon className={`w-8 h-8 ${role.iconColor}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{role.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
              </div>
              {selectedRole === role.id && (
                <CheckCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Registration confirmation component
interface RegistrationConfirmationProps {
  registrationData: {
    registrationId: string;
    qrCode: string;
    fullName: string;
    email: string;
    role: string;
  };
  onContinue: () => void;
}

function RegistrationConfirmation({ registrationData, onContinue }: RegistrationConfirmationProps) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
        <p className="text-gray-600">Welcome to CIS-SAP, {registrationData.fullName}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration ID
          </label>
          <div className="flex items-center space-x-2">
            <Input
              value={registrationData.registrationId}
              readOnly
              className="text-center font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(registrationData.registrationId)}
            >
              Copy
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Code for Check-in
          </label>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <QrCode className="w-32 h-32 text-gray-400" />
              <p className="text-xs text-gray-500 mt-2 text-center">
                QR Code: {registrationData.registrationId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <Mail className="w-5 h-5" />
          <span className="text-sm">Confirmation email sent to {registrationData.email}</span>
        </div>

        <Button onClick={onContinue} className="w-full" size="lg">
          Continue to Dashboard
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function EnhancedRegistrationForm() {
  const [step, setStep] = useState<'role-selection' | 'form' | 'confirmation'>('role-selection');
  const [selectedRole, setSelectedRole] = useState<ExtendedUserRole | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const { register, users } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
  });

  const handleRoleSelection = (role: ExtendedUserRole) => {
    setSelectedRole(role);
    form.setValue('role', role);
    
    // Set default values based on role
    const baseDefaults = {
      fullName: '',
      email: '',
      mobile: '',
      gender: 'prefer-not-to-say' as const,
      country: '',
      bloodGroup: '',
      foodPreference: 'veg' as const,
      emergencyContactName: '',
      emergencyContactNumber: '',
      consentCheckbox: false,
    };

    // Reset form with role-specific defaults
    form.reset({
      role,
      ...baseDefaults,
      ...(role === 'student' && {
        collegeName: '',
        degreeLevel: 'ug' as const,
        yearOfStudy: 1,
        branchDepartment: '',
      }),
      ...(role === 'professional' && {
        companyName: '',
        designation: '',
        industry: '',
        yearsOfExperience: 0,
      }),
      ...(role === 'speaker' && {
        track: '',
        sessionCategory: 'talk' as const,
        sessionTitle: '',
        sessionAbstract: '',
        coSpeakerDetails: '',
        linkedinUrl: '',
        sapCommunityUrl: '',
        tshirtSize: 'm' as const,
        presentationMaterials: '',
      }),
      ...(role === 'organizer' && {
        organizationName: '',
        roleResponsibility: '',
        permissions: {
          createEvents: false,
          manageUsers: false,
          viewAnalytics: false,
        },
        verificationCode: '',
      }),
    });

    setStep('form');
  };

  const onSubmit = async (values: RegistrationFormData) => {
    try {
      // Check if user already exists
      if (users.find(u => u.email === values.email)) {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'An account with this email already exists.',
        });
        return;
      }

      // Generate registration ID and QR code
      const registrationId = `CIS${Date.now().toString().slice(-8)}`;
      const qrCode = `QR_${registrationId}`;

      // Transform data for user creation
      const { emergencyContactName, emergencyContactNumber, consentCheckbox, fullName, ...rest } = values;
      
      const userData = {
        name: fullName,
        email: values.email,
        mobile: values.mobile,
        role: values.role as UserRole, // Type assertion for compatibility
        foodChoice: values.foodPreference,
        emergencyContact: {
          name: emergencyContactName,
          number: emergencyContactNumber,
        },
        registrationId,
        checkedIn: false,
        myEvents: [],
        interests: '', // Will be enhanced later
        points: 0,
        // Add role-specific fields
        ...rest,
      };

      // Register the user
      const newUser = register(userData as any);

      if (newUser) {
        // Set registration result for confirmation page
        setRegistrationResult({
          registrationId,
          qrCode,
          fullName,
          email: values.email,
          role: values.role,
        });

        // Send confirmation email (mock)
        await sendConfirmationEmail(values.email, fullName, registrationId);

        toast({
          title: 'Registration Successful',
          description: `Welcome, ${fullName}! Your account has been created.`,
        });

        setStep('confirmation');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'An error occurred during registration. Please try again.',
      });
    }
  };

  const sendConfirmationEmail = async (email: string, name: string, registrationId: string) => {
    // Mock email sending - implement with your email service
    console.log('Sending confirmation email:', { email, name, registrationId });
    // In real implementation, call your email API here
  };

  const handleContinueToDashboard = () => {
    // Navigate based on role
    switch (selectedRole) {
      case 'student':
      case 'professional':
        router.push('/'); // Attendee dashboard
        break;
      case 'speaker':
        router.push('/speaker'); // Speaker dashboard
        break;
      case 'organizer':
        router.push('/organizer'); // Event management dashboard
        break;
      default:
        router.push('/');
    }
  };

  // Role selection step
  if (step === 'role-selection') {
    return <RoleSelection selectedRole={selectedRole} onRoleSelect={handleRoleSelection} />;
  }

  // Confirmation step
  if (step === 'confirmation' && registrationResult) {
    return (
      <RegistrationConfirmation
        registrationData={registrationResult}
        onContinue={handleContinueToDashboard}
      />
    );
  }

  // Form step
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep('role-selection')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back to role selection
        </button>
        <div className="text-sm text-gray-600">
          Step 2 of 3: Registration Details
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Common Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input placeholder="India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foodPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Preference *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select food preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="veg">Vegetarian</SelectItem>
                        <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Role-Specific Fields */}
          {selectedRole === 'student' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="collegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="degreeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select degree level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ug">Undergraduate (UG)</SelectItem>
                          <SelectItem value="pg">Postgraduate (PG)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch / Department *</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {selectedRole === 'professional' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
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
                      <FormLabel>Industry *</FormLabel>
                      <FormControl>
                        <Input placeholder="Information Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {selectedRole === 'speaker' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Speaker Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="track"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Track *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select track" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="innovation">Innovation</SelectItem>
                            <SelectItem value="career">Career Development</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sessionCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="talk">Talk</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="demo">Demo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sessionTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your session title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionAbstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Abstract *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed description of your session (minimum 50 characters)"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coSpeakerDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-Speaker Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="If you have co-speakers, provide their details here"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sapCommunityUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SAP Community URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://community.sap.com/t5/user/viewprofilepage/user-id/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tshirtSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>T-shirt Size *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="xs">XS</SelectItem>
                            <SelectItem value="s">S</SelectItem>
                            <SelectItem value="m">M</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                            <SelectItem value="xl">XL</SelectItem>
                            <SelectItem value="xxl">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presentationMaterials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentation Materials</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input placeholder="Link to materials or upload" {...field} />
                            <Button type="button" variant="outline" size="sm">
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Provide a link or upload your presentation materials
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'organizer' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Organization Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Event Management Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleResponsibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role / Responsibility *</FormLabel>
                        <FormControl>
                          <Input placeholder="Event Coordinator" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Permissions *</FormLabel>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="permissions.createEvents"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Create Events</FormLabel>
                            <FormDescription>
                              Permission to create and manage events
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.manageUsers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Manage Users</FormLabel>
                            <FormDescription>
                              Permission to manage user accounts and registrations
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.viewAnalytics"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>View Analytics</FormLabel>
                            <FormDescription>
                              Permission to access platform analytics and reports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer Verification Code *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter verification code" {...field} />
                      </FormControl>
                      <FormDescription>
                        Contact your administrator for the verification code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Consent */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Terms and Consent
            </h3>
            <FormField
              control={form.control}
              name="consentCheckbox"
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
                      I agree to receive updates & notifications *
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you consent to receive event updates, notifications, and communications from CIS-SAP.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Registering...' : 'Complete Registration'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-blue-600">
              Login here
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}