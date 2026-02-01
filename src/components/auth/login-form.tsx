'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/core/utils/validation/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '@/features/auth/services/auth-service';
import { cn, getErrorMessage } from '@/core/utils/utils';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Default redirect path
  const callbackUrl = searchParams.get('callbackUrl') || '/explore';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormData) {
    setIsLoading(true);
    try {
      // Try Firebase Auth first
      const authUser = await signInWithEmail(values.email, values.password);
      
      if (authUser) {
        toast({
          title: 'Welcome back!',
          description: `Successfully signed in as ${authUser.displayName || 'User'}.`,
        });
        
        // Intelligent redirect based on user state
        if (!authUser.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push(callbackUrl);
        }
        return;
      }
    } catch (firebaseError: any) {
      // Fallback for demo/dev purposes if Firebase isn't fully configured
      console.warn('Firebase login failed, attempting legacy login:', firebaseError);
      
      const user = await login(values.email);
      if (user) {
        toast({
          title: 'Welcome back!',
          description: `Successfully signed in as ${user.name}.`,
        });
        
        // Redirect organizers to their specific dashboard
        if (user.role === 'organizer') {
           router.push('/organizer');
        } else {
           router.push('/explore');
        }
        return;
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const authUser = await signInWithGoogle();
      
      if (authUser) {
        toast({
          title: 'Welcome!',
          description: `Successfully signed in with Google.`,
        });
        
        if (!authUser.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: getErrorMessage(error),
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    type="email"
                    autoComplete="email"
                    className="h-11 bg-background/50"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    placeholder="Enter your password" 
                    type="password"
                    autoComplete="current-password"
                    className="h-11 bg-background/50"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 bg-background/50 hover:bg-background/80"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Google
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}