import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join IPX Hub</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
