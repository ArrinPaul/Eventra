'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffManagerClient } from './staff-manager-client';
import { GuestListManagerClient } from './guest-list-manager-client';
import { Users, UserCheck, ShieldCheck } from 'lucide-react';

interface CollabManagerProps {
  eventId: string;
  eventTitle: string;
  ticketTiers: any[];
}

export function CollabManagerClient({ eventId, eventTitle, ticketTiers }: CollabManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Collaboration Hub</h1>
          <p className="text-muted-foreground">Manage your team and guest lists for <span className="text-white font-bold">{eventTitle}</span></p>
        </div>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="bg-muted/40 border border-border p-1 mb-8">
          <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck className="w-4 h-4 mr-2" /> Event Staff
          </TabsTrigger>
          <TabsTrigger value="guests" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <UserCheck className="w-4 h-4 mr-2" /> Guest List Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <StaffManagerClient eventId={eventId} eventTitle={eventTitle} />
        </TabsContent>

        <TabsContent value="guests">
          <GuestListManagerClient eventId={eventId} eventTitle={eventTitle} ticketTiers={ticketTiers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
