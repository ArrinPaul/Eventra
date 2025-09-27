import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="hidden lg:block lg:w-1/2 h-full">
         <Image
            src="https://picsum.photos/seed/login/1200/900"
            alt="Login Page Image"
            width={1200}
            height={900}
            className="h-full w-full object-cover"
            data-ai-hint="abstract geometric"
          />
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl glass-effect">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your IPX Hub dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
