'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Award, 
  Search, 
} from 'lucide-react';

export default function CertificateVerifyClient() {
  const [verificationCode, setVerificationCode] = useState('');

  return (
    <div className="min-h-screen bg-background text-white py-12">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-8">Certificate Verification</h1>
        
        <Card className="bg-muted/40 border-border text-white text-left">
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription className="text-muted-foreground">Enter code to verify authenticity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input placeholder="XXXX-XXXX-XXXX" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="bg-muted/40 border-border" />
              <Button disabled><Search className="h-4 w-4" /></Button>
            </div>
            <p className="text-center text-muted-foreground text-sm italic">Verification portal is currently being migrated.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
