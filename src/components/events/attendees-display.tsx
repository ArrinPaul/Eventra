'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2 } from 'lucide-react';

export default function AttendeesDisplay({ eventId }: { eventId: string }) {
  const attendeesRaw = useQuery(api.events.getAttendees, { eventId: eventId as any });

  if (attendeesRaw === undefined) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader><CardTitle className="flex items-center gap-2"><Users size={20} /> Attendees ({attendeesRaw.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attendeesRaw.map((a: any) => (
            <div key={a._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Avatar><AvatarImage src={a.image} /><AvatarFallback>{a.name?.charAt(0)}</AvatarFallback></Avatar>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-gray-400 capitalize">{a.role}</p>
              </div>
              <Badge className="ml-auto text-[10px]">{a.registrationStatus}</Badge>
            </div>
          ))}
          {attendeesRaw.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No attendees yet</p>}
        </div>
      </CardContent>
    </Card>
  );
}