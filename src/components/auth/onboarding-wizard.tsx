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
import { cn } from '@/lib/utils';
import { updateUserProfile } from '@/lib/auth-service';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  department: z.string().min(1, 'Please select your department'),
  year: z.string().min(1, 'Please select your year'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

// Step 3: Organizer Specific Schema
const organizerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  designation: z.string().min(2, 'Your role/designation is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type StudentFormData = z.infer<typeof studentSchema>;
type OrganizerFormData = z.infer<typeof organizerSchema>;

interface OnboardingData {
  profile: ProfileFormData;
  student?: StudentFormData;
  organizer?: OrganizerFormData;
  photoURL?: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'student' | 'organizer'>('student');
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

  // Student Form (Step 2 for students)
  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      department: '',
      year: '',
      interests: [],
    },
  });

  // Organizer Form (Step 2 for organizers)
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

      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user?.id || 'temp'}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setOnboardingData(prev => ({ ...prev, photoURL: downloadURL }));
      
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
      studentForm.setValue('interests', newInterests);
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

  // Handle final submission
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare user data
      const userData: Record<string, any> = {
        displayName: onboardingData.profile.displayName,
        bio: onboardingData.profile.bio || '',
        phone: onboardingData.profile.phone || '',
        photoURL: onboardingData.photoURL || null,
        role: userType === 'organizer' ? 'organizer' : 'attendee',
        onboardingCompleted: true,
      };

      if (userType === 'student' && onboardingData.student) {
        userData.department = onboardingData.student.department;
        userData.year = onboardingData.student.year;
        userData.interests = onboardingData.student.interests;
      } else if (userType === 'organizer' && onboardingData.organizer) {
        userData.organizationName = onboardingData.organizer.organizationName;
        userData.designation = onboardingData.organizer.designation;
        userData.website = onboardingData.organizer.website || '';
      }

      // Update user profile (would use Firebase in production)
      if (user?.id) {
        await updateUserProfile(user.id, userData);
      }

      toast({
        title: 'Welcome to EventOS! 🎉',
        description: 'Your profile has been set up successfully.',
      });

      // Redirect based on user type
      router.push(userType === 'organizer' ? '/organizer' : '/explore');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        variant: 'destructive',
        title: 'Setup failed',
        description: error.message || 'Could not complete setup. Please try again.',
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
          Let's personalize your EventOS experience
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
              <div className="grid grid-cols-2 gap-4">
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
                  <span className="font-medium">Student / Attendee</span>
                  <span className="text-xs text-muted-foreground">
                    Discover & attend events
                  </span>
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
                  <span className="font-medium">Organizer</span>
                  <span className="text-xs text-muted-foreground">
                    Create & manage events
                  </span>
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
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
                      <FormLabel>Year of Study *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                          <SelectItem value="pg1">PG - 1st Year</SelectItem>
                          <SelectItem value="pg2">PG - 2nd Year</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <h3 className="text-xl font-semibold">You're all set!</h3>
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
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{onboardingData.student.department}</span>
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
