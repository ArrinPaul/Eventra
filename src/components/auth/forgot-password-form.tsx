'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/core/config/firebase';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFirebaseErrorMessage } from '@/core/utils/utils';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSentEmail(values.email);
      setEmailSent(true);
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for password reset instructions.',
      });
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getFirebaseErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent password reset instructions to:
          </p>
          <p className="font-medium text-lg mb-6">{sentEmail}</p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            If you don&apos;t see the email, check your spam folder. The link will expire in 1 hour.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEmailSent(false);
              form.reset();
            }}
          >
            Try a different email
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending reset link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Send reset link
              </>
            )}
          </Button>

          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        </form>
      </Form>

      <Alert>
        <AlertDescription className="text-sm">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in instead
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}
