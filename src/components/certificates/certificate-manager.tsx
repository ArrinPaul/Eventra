'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';

export function CertificateManager() {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-cyan-400" />
          Certificate Management
        </CardTitle>
      </CardHeader>
      <CardContent className="py-10 text-center text-gray-500">
        <p>Certificate management is being migrated to our new system.</p>
      </CardContent>
    </Card>
  );
}