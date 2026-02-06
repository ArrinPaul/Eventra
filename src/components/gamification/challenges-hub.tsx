'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export function ChallengesHub() {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Active Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="py-10 text-center text-gray-500">
        <p>Challenges are being migrated to our new platform. Check back soon!</p>
      </CardContent>
    </Card>
  );
}