'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Check, 
  User, 
  GraduationCap, 
  Building2,
  Sparkles,
  X
} from 'lucide-react';
import { cn, getErrorMessage } from '@/core/utils/utils';
// Remove Firebase imports

// Available interests for selection
const AVAILABLE_INTERESTS = [
  'Technology', 'Design', 'Business', 'Marketing', 'AI/ML',
  'Web Development', 'Mobile Development', 'Data Science', 'Cybersecurity',
  'Cloud Computing', 'DevOps', 'Blockchain', 'Gaming', 'IoT',
  'Entrepreneurship', 'Finance', 'Healthcare', 'Education', 'Social Impact',
  'Music', 'Art', 'Photography', 'Writing', 'Public Speaking'
];

// Departments list
const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Mechanical',
  'Civil', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry',
  'Management', 'Commerce', 'Arts', 'Law', 'Medicine', 'Other'
];

// Step 1: Profile Details Schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
  phone: z.string().optional(),
});

// Step 2: Student Specific Schema
const studentSchema = z.object({
  college: z.string().min(2, 'College name is required'),
  degree: z.enum(['ug', 'pg'], { required_error: 'Please select your degree' }),
  year: z.number().min(1).max(5),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

// Step 2: Professional Specific Schema
const professionalSchema = z.object({
  company: z.string().min(2, 'Company name is required'),
  designation: z.string().min(2, 'Designation is required'),
  country: z.string().min(2, 'Country is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], { required_error: 'Please select your gender' }),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

// Step 2: Organizer Specific Schema
const organizerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  designation: z.string().min(2, 'Your role/designation is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type StudentFormData = z.infer<typeof studentSchema>;
type ProfessionalFormData = z.infer<typeof professionalSchema>;
type OrganizerFormData = z.infer<typeof organizerSchema>;

interface OnboardingData {
  profile: ProfileFormData;
  student?: StudentFormData;
  professional?: ProfessionalFormData;
  organizer?: OrganizerFormData;
  photoURL?: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'student' | 'professional' | 'organizer'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: { displayName: '', bio: '', phone: '' },
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Profile Form (Step 1)
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: onboardingData.profile,
  });

  // Student Form (Step 2)
  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      college: '',
      degree: 'ug',
      year: 1,
      interests: [],
    },
  });

  // Professional Form (Step 2)
  const professionalForm = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      company: '',
      designation: '',
      country: '',
      gender: 'male',
      bloodGroup: '',
      interests: [],
    },
  });

  // Organizer Form (Step 2)
  const organizerForm = useForm<OrganizerFormData>({
    resolver: zodResolver(organizerSchema),
    defaultValues: {
      organizationName: '',
      designation: '',
      website: '',
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image under 5MB',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file',
      });
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Implement Convex File Storage upload
      // For now, just using the preview
      setOnboardingData(prev => ({ ...prev, photoURL: reader.result as string }));
      
      toast({
        title: 'Photo uploaded',
        description: 'Your profile photo has been uploaded successfully',
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Could not upload photo. Please try again.',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle interest toggle
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      if (userType === 'student') studentForm.setValue('interests', newInterests);
      if (userType === 'professional') professionalForm.setValue('interests', newInterests);
      return newInterests;
    });
  };

  // Handle step navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await profileForm.trigger();
      if (isValid) {
        setOnboardingData(prev => ({
          ...prev,
          profile: profileForm.getValues(),
        }));
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (userType === 'student') {
        const isValid = await studentForm.trigger();
        if (isValid) {
          setOnboardingData(prev => ({
            ...prev,
            student: studentForm.getValues(),
          }));
          setCurrentStep(3);
        }
      } else if (userType === 'professional') {
        const isValid = await professionalForm.trigger();
        if (isValid) {
          setOnboardingData(prev => ({
            ...prev,
            professional: professionalForm.getValues(),
          }));
          setCurrentStep(3);
        }
      } else {
        const isValid = await organizerForm.trigger();
        if (isValid) {
          setOnboardingData(prev => ({
            ...prev,
            organizer: organizerForm.getValues(),
          }));
          setCurrentStep(3);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// ... inside OnboardingWizard component
  const updateProfile = useMutation(api.users.update);

  // Handle final submission
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare user data
      const userData: any = {
        name: onboardingData.profile.displayName,
        bio: onboardingData.profile.bio || '',
        phone: onboardingData.profile.phone || '',
        image: onboardingData.photoURL || null,
        role: userType,
        onboardingCompleted: true,
      };

      if (userType === 'student' && onboardingData.student) {
        Object.assign(userData, onboardingData.student);
        // Map student interests to string if it's an array
        if (Array.isArray(userData.interests)) {
          userData.interests = userData.interests.join(', ');
        }
      } else if (userType === 'professional' && onboardingData.professional) {
        Object.assign(userData, onboardingData.professional);
        if (Array.isArray(userData.interests)) {
          userData.interests = userData.interests.join(', ');
        }
      } else if (userType === 'organizer' && onboardingData.organizer) {
        userData.organizationName = onboardingData.organizer.organizationName;
        userData.designation = onboardingData.organizer.designation;
        userData.website = onboardingData.organizer.website || '';
      }

      await updateProfile(userData);

      toast({
        title: 'Welcome to Eventra! 🎊',
        description: 'Your profile has been set up successfully.',
      });

      // Redirect based on user type
      router.push(userType === 'organizer' ? '/organizer' : '/explore');
    } catch (error: unknown) {
      console.error('Onboarding error:', error);
      toast({
        variant: 'destructive',
        title: 'Setup failed',
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        </div>
        <CardDescription>
          Let&apos;s personalize your Eventra experience
        </CardDescription>
        <Progress value={progress} className="mt-4 h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Step {currentStep} of {totalSteps}
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Step 1: Profile Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-offset-2 ring-primary/20 hover:ring-primary/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback className="bg-primary/10">
                  {uploadingPhoto ? (
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Click to upload profile photo
              </p>
            </div>

            <Form {...profileForm}>
              <form className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a bit about yourself..."
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/200 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {/* User Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">I am a... *</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    userType === 'student'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <GraduationCap className={cn(
                    'h-8 w-8',
                    userType === 'student' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium text-sm">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('professional')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    userType === 'professional'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <User className={cn(
                    'h-8 w-8',
                    userType === 'professional' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium text-sm">Professional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('organizer')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    userType === 'organizer'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Building2 className={cn(
                    'h-8 w-8',
                    userType === 'organizer' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium text-sm">Organizer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Student Specifics */}
        {currentStep === 2 && userType === 'student' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Student Details</h3>
                <p className="text-sm text-muted-foreground">
                  Help us personalize your experience
                </p>
              </div>
            </div>

            <Form {...studentForm}>
              <form className="space-y-4">
                <FormField
                  control={studentForm.control}
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your college" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Degree" />
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
                    control={studentForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year *</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                            <SelectItem value="5">5th Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={studentForm.control}
                  name="interests"
                  render={() => (
                    <FormItem>
                      <FormLabel>Interests * (Select at least one)</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {AVAILABLE_INTERESTS.map(interest => (
                          <Badge
                            key={interest}
                            variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedInterests.includes(interest) 
                                ? 'bg-primary hover:bg-primary/90' 
                                : 'hover:bg-primary/10'
                            )}
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                            {selectedInterests.includes(interest) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}

        {/* Step 2: Professional Specifics */}
        {currentStep === 2 && userType === 'professional' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Professional Details</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us about your professional background
                </p>
              </div>
            </div>

            <Form {...professionalForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={professionalForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={professionalForm.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter designation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={professionalForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={professionalForm.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. O+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={professionalForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  control={professionalForm.control}
                  name="interests"
                  render={() => (
                    <FormItem>
                      <FormLabel>Interests * (Select at least one)</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {AVAILABLE_INTERESTS.map(interest => (
                          <Badge
                            key={interest}
                            variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedInterests.includes(interest) 
                                ? 'bg-primary hover:bg-primary/90' 
                                : 'hover:bg-primary/10'
                            )}
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                            {selectedInterests.includes(interest) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}

        {/* Step 2: Organizer Specifics */}
        {currentStep === 2 && userType === 'organizer' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Organization Details</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us about your organization
                </p>
              </div>
            </div>

            <Form {...organizerForm}>
              <form className="space-y-4">
                <FormField
                  control={organizerForm.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., TechClub, ACM Chapter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={organizerForm.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role / Designation *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Event Coordinator, Club President" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={organizerForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourorg.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
              <p className="text-muted-foreground mt-2">
                {userType === 'organizer' 
                  ? "Your organizer profile is ready. Start creating amazing events!"
                  : "Your profile is ready. Discover exciting events near you!"}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-3">Profile Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{onboardingData.profile.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{userType}</span>
                </div>
                {userType === 'student' && onboardingData.student && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">College:</span>
                      <span className="font-medium">{onboardingData.student.college}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interests:</span>
                      <span className="font-medium">{selectedInterests.length} selected</span>
                    </div>
                  </>
                )}
                {userType === 'professional' && onboardingData.professional && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{onboardingData.professional.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Designation:</span>
                      <span className="font-medium">{onboardingData.professional.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interests:</span>
                      <span className="font-medium">{selectedInterests.length} selected</span>
                    </div>
                  </>
                )}
                {userType === 'organizer' && onboardingData.organizer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-medium">{onboardingData.organizer.organizationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">{onboardingData.organizer.designation}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Completing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
