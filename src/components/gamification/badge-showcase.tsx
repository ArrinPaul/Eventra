'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export function BadgeShowcase({ userId }: { userId: string, stats?: any, compact?: boolean }) {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Badge Collection
        </CardTitle>
      </CardHeader>
      <CardContent className="py-10 text-center text-gray-500">
        <p>Your badge collection is being migrated to our new system.</p>
      </CardContent>
    </Card>
  );
}