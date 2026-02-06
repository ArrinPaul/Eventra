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
    <div className="min-h-screen bg-black text-white py-12">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Award className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
        <h1 className="text-3xl font-bold mb-8">Certificate Verification</h1>
        
        <Card className="bg-white/5 border-white/10 text-white text-left">
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription className="text-gray-400">Enter code to verify authenticity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input placeholder="XXXX-XXXX-XXXX" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="bg-white/5 border-white/10" />
              <Button disabled><Search className="h-4 w-4" /></Button>
            </div>
            <p className="text-center text-gray-500 text-sm italic">Verification portal is currently being migrated.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}