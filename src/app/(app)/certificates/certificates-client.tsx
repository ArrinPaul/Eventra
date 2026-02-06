'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function CertificatesClient() {
  const { user } = useAuth();

  return (
    <div className="container py-8 space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-gray-400 mt-2">View and download your earned certificates</p>
      </div>

      <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
        <Award size={48} className="mx-auto mb-4 opacity-20" />
        <p>Certificates are being migrated to our new system. You&apos;ll see yours here soon!</p>
      </div>
    </div>
  );
}