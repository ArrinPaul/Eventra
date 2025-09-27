import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your IPX Hub dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
