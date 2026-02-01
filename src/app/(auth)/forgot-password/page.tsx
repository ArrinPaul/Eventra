import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-background">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="hidden lg:block relative h-[600px] rounded-lg overflow-hidden">
          <Image
            src="https://picsum.photos/seed/forgot/1200/900"
            alt="Forgot Password"
            layout="fill"
            objectFit="cover"
            className="h-full w-full"
            data-ai-hint="secure lock concept"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-8 left-8 text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold font-headline">Secure Your Account</h2>
            <p className="text-lg mt-2 max-w-md">
              We&apos;ll help you reset your password and get back to managing amazing events.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto shadow-xl glass-effect">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
