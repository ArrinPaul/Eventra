import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-[#0a0b14]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 p-4 relative z-10">
        {/* Left Side: Brand/Marketing */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300 backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-medium">The Future of Events</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Welcome to <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">EventOS</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-md leading-relaxed">
              Your intelligent companion for seamless event experiences. Discover, connect, and engage like never before with AI-powered insights.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="font-bold text-lg mb-1 text-white">For Attendees</h3>
              <p className="text-sm text-gray-400">Personalized recommendations and smart networking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="font-bold text-lg mb-1 text-white">For Organizers</h3>
              <p className="text-sm text-gray-400">Powerful analytics and automated management tools.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex items-center justify-center w-full">
          <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="text-center space-y-1 pb-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">Sign In</CardTitle>
              <CardDescription className="text-base text-gray-400">
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