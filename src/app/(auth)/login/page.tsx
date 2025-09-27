import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-background">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="hidden lg:block relative h-[600px] rounded-lg overflow-hidden">
           <Image
              src="https://picsum.photos/seed/login/1200/900"
              alt="Login Page Image"
              layout="fill"
              objectFit="cover"
              className="h-full w-full"
              data-ai-hint="abstract geometric"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <h2 className="text-4xl font-bold font-headline">Welcome to IPX Hub</h2>
              <p className="text-lg mt-2 max-w-md">Your intelligent companion for a seamless event experience.</p>
            </div>
        </div>
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto shadow-xl glass-effect">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your IPX Hub dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
