'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { User, UserRole } from '@/types';

const baseSchema = z.object({
  role: z.enum(['student', 'professional', 'organizer']),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  foodChoice: z.enum(['veg', 'non-veg', 'vegan']),
  emergencyContactName: z.string().min(2),
  emergencyContactNumber: z.string().min(10),
  interests: z.string().min(3, { message: 'Please list at least one interest.' }),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  college: z.string().min(3),
  degree: z.enum(['ug', 'pg']),
  year: z.coerce.number().min(1).max(5),
});

const professionalSchema = baseSchema.extend({
  role: z.literal('professional'),
  company: z.string().min(2),
  designation: z.string().min(2),
  country: z.string().min(2),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  bloodGroup: z.string().min(2),
});

const organizerSchema = baseSchema.extend({
  role: z.literal('organizer'),
  verificationCode: z.string().refine(val => val === "IPX2024", { message: "Invalid verification code." }),
});

const formSchema = z.discriminatedUnion('role', [studentSchema, professionalSchema, organizerSchema]);

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const { register, users } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'student',
      name: '',
      email: '',
      mobile: '',
      foodChoice: 'veg',
      emergencyContactName: '',
      emergencyContactNumber: '',
      interests: '',
      // Student fields
      college: '',
      degree: 'ug',
      year: 1,
      // Professional fields
      company: '',
      designation: '',
      country: '',
      gender: 'prefer-not-to-say',
      bloodGroup: '',
      // Organizer fields
      verificationCode: '',
    },
  });

  const role = form.watch('role');

  function onSubmit(values: FormValues) {
    if (users.find(u => u.email === values.email)) {
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'An account with this email already exists.',
        });
        return;
    }
      
    const { emergencyContactName, emergencyContactNumber, ...rest } = values;

    const newUser = register({
      ...rest,
      emergencyContact: {
        name: emergencyContactName,
        number: emergencyContactNumber,
      },
    } as Omit<User, 'id' | 'registrationId' | 'checkedIn' | 'myEvents'>);

    if (newUser) {
      toast({
        title: 'Registration Successful',
        description: `Welcome, ${newUser.name}! Your account has been created.`,
      });
      router.push('/');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a...</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="foodChoice" render={({ field }) => (
                <FormItem><FormLabel>Food Choice</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="veg">Vegetarian</SelectItem><SelectItem value="non-veg">Non-Vegetarian</SelectItem><SelectItem value="vegan">Vegan</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}/>
        </div>
        <FormField control={form.control} name="interests" render={({ field }) => (
            <FormItem><FormLabel>Interests</FormLabel><FormControl><Input placeholder="e.g., AI, Web Development, UI/UX" {...field} /></FormControl><FormDescription>Comma-separated list of your interests.</FormDescription><FormMessage /></FormItem>
        )}/>

        {role === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="college" render={({ field }) => (
                <FormItem><FormLabel>College</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="degree" render={({ field }) => (
                <FormItem><FormLabel>Degree</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ug">Undergraduate</SelectItem><SelectItem value="pg">Postgraduate</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem><FormLabel>Year of Study</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        )}

        {role === 'professional' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="designation" render={({ field }) => (<FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem><SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="bloodGroup" render={({ field }) => (<FormItem><FormLabel>Blood Group</FormLabel><FormControl><Input placeholder="e.g. O+" {...field} /></FormControl><FormMessage /></FormItem>)}/>
          </div>
        )}

        {role === 'organizer' && (
             <FormField control={form.control} name="verificationCode" render={({ field }) => (
                <FormItem><FormLabel>Organizer Verification Code</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                <FormItem><FormLabel>Emergency Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="emergencyContactNumber" render={({ field }) => (
                <FormItem><FormLabel>Emergency Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        
        <Button type="submit" className="w-full interactive-element" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Registering...' : 'Register'}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-primary">
            Login here
          </Link>
        </div>
      </form>
    </Form>
  );
}
