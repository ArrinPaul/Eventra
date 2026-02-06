'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export function GroupsClient() {
  return (
    <div className="container mx-auto px-4 py-6 text-white space-y-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Interest Groups</h1><p className="text-gray-400">Join recurring meetups</p></div>
        <Button disabled><Plus className="w-4 h-4 mr-2" /> Create Group</Button>
      </div>

      <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
        <Users size={48} className="mx-auto mb-4 opacity-20" />
        <p>Interest Groups are being migrated to our new platform. Stay tuned!</p>
      </div>
    </div>
  );
}
