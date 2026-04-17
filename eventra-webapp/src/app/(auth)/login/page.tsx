import { LoginForm } from '@/features/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import Link from 'next/link';

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
        {/* Left: Brand */}
        <div className="hidden lg:flex flex-col justify-center space-y-6">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-semibold text-foreground">Eventra</span>
          </Link>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
              Sign in to manage your events, connect with your community, and get AI-powered insights.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground text-sm mb-1">For Attendees</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Smart recommendations and seamless networking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground text-sm mb-1">For Organizers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Analytics, team collaboration, and automation.</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex items-center justify-center w-full">
          <Card className="w-full max-w-md border-border bg-card shadow-soft">
            <CardHeader className="text-center space-y-1 pb-4">
              {/* Show logo on mobile */}
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-base">E</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Sign In</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
