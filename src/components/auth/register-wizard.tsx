'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  studentSchema, 
  professionalSchema, 
  organizerSchema, 
  type RegisterFormData 
} from '@/core/utils/validation/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  User, 
  Briefcase, 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Loader2,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import type { User as UserType } from '@/types';

const ROLES = [
  {
    id: 'student',
    title: 'Student',
    icon: GraduationCap,
    description: 'For students attending events, workshops, and hackathons.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-200'
  },
  {
    id: 'professional',
    title: 'Professional',
    icon: Briefcase,
    description: 'For industry pros networking and attending conferences.',
    color: 'text-purple-500 bg-purple-500/10 border-purple-200'
  },
  {
    id: 'organizer',
    title: 'Organizer',
    icon: Building2,
    description: 'For those hosting and managing events.',
    color: 'text-orange-500 bg-orange-500/10 border-orange-200'
  }
] as const;

export function RegisterWizard() {
  const { register, users } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<'student' | 'professional' | 'organizer'>('student');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic schema based on role
  const schema = selectedRole === 'student' ? studentSchema 
    : selectedRole === 'professional' ? professionalSchema 
    : organizerSchema;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'student',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      foodChoice: 'veg',
      emergencyContactName: '',
      emergencyContactNumber: '',
      // Student defaults
      interests: '',
      college: '',
      degree: 'ug',
      year: 1,
      // Professional defaults
      company: '',
      designation: '',
      country: '',
      gender: 'prefer-not-to-say',
      bloodGroup: '',
      // Organizer defaults
      verificationCode: '',
    },
    mode: 'onChange'
  });

  const handleRoleSelect = (role: typeof selectedRole) => {
    setSelectedRole(role);
    form.setValue('role', role);
    setStep(2);
  };

  const nextStep = async () => {
    // Validate fields for the current step before proceeding
    let fieldsToValidate: any[] = [];
    if (step === 2) {
      fieldsToValidate = ['name', 'email', 'password', 'confirmPassword', 'mobile'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => (prev + 1) as 3);
    }
  };

  const prevStep = () => {
    setStep(prev => (prev - 1) as 1 | 2);
  };

  async function onSubmit(values: RegisterFormData) {
    setIsLoading(true);
    try {
      // Check for existing user (client-side check for demo, real check happens in backend)
      if (users.find(u => u.email === values.email)) {
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'An account with this email already exists.',
        });
        setIsLoading(false);
        return;
      }

      // Prepare user data
      const { emergencyContactName, emergencyContactNumber, confirmPassword, ...rest } = values;

      const userData = {
        ...rest,
        // Ensure interests is string
        interests: 'interests' in values ? values.interests : '', 
        emergencyContact: {
          name: emergencyContactName,
          number: emergencyContactNumber,
        },
      };

      const newUser = await register(userData as any);

      if (newUser) {
        toast({
          title: 'Welcome to EventOS! ðŸŽ‰',
          description: `Your account has been created successfully.`,
        });
        router.push('/explore'); // Or /onboarding if we want strict flow
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Render Steps
  const renderStep1_RoleSelection = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose your role</h2>
        <p className="text-muted-foreground">Select how you&apos;ll use EventOS</p>
      </div>
      
      <div className="grid gap-4">
        {ROLES.map((role) => (
          <div
            key={role.id}
            onClick={() => handleRoleSelect(role.id as any)}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02]",
              selectedRole === role.id 
                ? `border-primary bg-primary/5 shadow-md` 
                : "border-border hover:border-primary/50 bg-card"
            )}
          >
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", role.color)}>
              <role.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{role.title}</h3>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
            {selectedRole === role.id && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2_AccountInfo = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Create Account</h2>
        <p className="text-sm text-muted-foreground">Enter your login details</p>
      </div>

      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Full Name</FormLabel>
          <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}/>
      
      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}/>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl><Input type="password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl><Input type="password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
      </div>

      <FormField control={form.control} name="mobile" render={({ field }) => (
        <FormItem>
          <FormLabel>Mobile Number</FormLabel>
          <FormControl><Input placeholder="1234567890" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}/>
    </div>
  );

  const renderStep3_ProfileDetails = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Almost Done</h2>
        <p className="text-sm text-muted-foreground">Tell us a bit more about yourself</p>
      </div>

      <FormField control={form.control} name="foodChoice" render={({ field }) => (
        <FormItem>
          <FormLabel>Dietary Preference</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="veg">Vegetarian</SelectItem>
              <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}/>

      {/* Role Specific Fields */}
      {selectedRole === 'student' && (
        <>
          <FormField control={form.control} name="college" render={({ field }) => (
            <FormItem>
              <FormLabel>College / University</FormLabel>
              <FormControl><Input placeholder="University Name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <div className="grid grid-cols-2 gap-4">
             <FormField control={form.control} name="degree" render={({ field }) => (
              <FormItem>
                <FormLabel>Degree</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ug">Undergraduate</SelectItem>
                    <SelectItem value="pg">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl><Input type="number" min={1} max={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="interests" render={({ field }) => (
             <FormItem>
               <FormLabel>Interests</FormLabel>
               <FormControl><Input placeholder="AI, Design, Coding..." {...field} /></FormControl>
               <FormDescription>Comma separated</FormDescription>
               <FormMessage />
             </FormItem>
          )}/>
        </>
      )}

      {selectedRole === 'professional' && (
        <>
           <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="bloodGroup" render={({ field }) => (
              <FormItem><FormLabel>Blood Group</FormLabel><FormControl><Input placeholder="O+" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="interests" render={({ field }) => (
             <FormItem>
               <FormLabel>Professional Interests</FormLabel>
               <FormControl><Input placeholder="Networking, Hiring, Tech..." {...field} /></FormControl>
               <FormMessage />
             </FormItem>
          )}/>
        </>
      )}

      {selectedRole === 'organizer' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel>Organization</FormLabel><FormControl><Input placeholder="Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem><FormLabel>Your Role</FormLabel><FormControl><Input placeholder="Event Manager" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
          <FormField control={form.control} name="verificationCode" render={({ field }) => (
             <FormItem>
               <FormLabel>Verification Code</FormLabel>
               <FormControl><Input type="password" placeholder="Required for organizers" {...field} /></FormControl>
               <FormMessage />
             </FormItem>
          )}/>
        </>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
         <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
            <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="emergencyContactNumber" render={({ field }) => (
            <FormItem><FormLabel>Emergency Number</FormLabel><FormControl><Input placeholder="Number" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
             <div className={cn(
               "w-3 h-3 rounded-full transition-all duration-300",
               step >= s ? "bg-primary scale-110" : "bg-muted"
             )} />
             {s < 3 && <div className={cn("w-12 h-0.5 mx-2", step > s ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-effect border-border/50 shadow-xl">
            <CardContent className="pt-6">
              {step === 1 && renderStep1_RoleSelection()}
              {step === 2 && renderStep2_AccountInfo()}
              {step === 3 && renderStep3_ProfileDetails()}

              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                {step > 1 ? (
                  <Button type="button" variant="ghost" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div className="flex-1 text-center text-sm text-muted-foreground">
                    Already registered? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                  </div>
                )}

                {step === 1 ? (
                    // Logic handled in selection
                    <span />
                ) : step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
