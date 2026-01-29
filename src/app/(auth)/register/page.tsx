'use client';
import { useState, useEffect } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function RegisterFormClient() {
  return <RegisterForm />;
}

export default function RegisterPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl glass-effect">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join EventOS</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          {isClient ? <RegisterFormClient /> : <div>Loading form...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
