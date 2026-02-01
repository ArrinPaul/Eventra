import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-purple-500/10 blur-[100px] animate-pulse delay-2000" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 p-4 relative z-10">
        {/* Left Side: Brand/Marketing */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-medium">The Future of Events</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome to <br />
              <span className="text-primary">EventOS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
              Your intelligent companion for seamless event experiences. Discover, connect, and engage like never before with AI-powered insights.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50">
              <h3 className="font-bold text-lg mb-1">For Attendees</h3>
              <p className="text-sm text-muted-foreground">Personalized recommendations and smart networking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50">
              <h3 className="font-bold text-lg mb-1">For Organizers</h3>
              <p className="text-sm text-muted-foreground">Powerful analytics and automated management tools.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex items-center justify-center w-full">
          <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-1 pb-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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