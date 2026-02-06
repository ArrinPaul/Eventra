'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2 } from 'lucide-react';

export function StakeholderShareDialog({ eventName, open, onOpenChange }: { eventName: string, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 text-white">
        <DialogHeader><DialogTitle>Share Analytics</DialogTitle></DialogHeader>
        <div className="py-10 text-center">
          <Share2 className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
          <p>The sharing feature for <strong>{eventName}</strong> is coming soon to our new system.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StakeholderReportView() {
  return <div className="p-20 text-center text-white">Report View Coming Soon</div>;
}