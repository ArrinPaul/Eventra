'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EventTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

const getTicketEventDate = (ticket: EventTicket): Date => {
  if (ticket.event?.startDate) return new Date(ticket.event.startDate);
  return new Date();
};

function TicketStatusBadge({ status }: { status: EventTicket['status'] }) {
  const statusConfig = {
    'confirmed': { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    'pending': { label: 'Pending', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    'checked-in': { label: 'Checked In', className: 'bg-primary/10 text-primary border-primary/20' },
    'cancelled': { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'refunded': { label: 'Refunded', className: 'bg-muted text-muted-foreground border-muted' },
  };
  const config = statusConfig[status] || statusConfig['pending'];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

function TicketCard({ ticket, onViewTicket }: { ticket: EventTicket; onViewTicket: (ticket: EventTicket) => void; }) {
  const eventDate = getTicketEventDate(ticket);
  return (
    <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg bg-cyan-900/20 flex items-center justify-center">
            {ticket.event?.imageUrl ? <img src={ticket.event.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" /> : <Ticket size={32} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{ticket.event?.title || 'Event'}</h3>
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <p className="flex items-center gap-1"><Calendar size={12} /> {format(eventDate, 'EEE, MMM d, yyyy')}</p>
              <p className="flex items-center gap-1"><QrCode size={12} /> {ticket.ticketNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1" onClick={() => onViewTicket(ticket)}>View QR</Button>
          <Button size="sm" variant="outline" asChild><Link href={`/events/${ticket.eventId}`}>Details</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyTicketsClient() {
  const { user } = useAuth();
  const allTicketsRaw = useQuery(api.tickets.getByUserId, user ? { userId: (user._id || user.id) as any } : "skip");
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const loading = allTicketsRaw === undefined;
  const tickets: EventTicket[] = (allTicketsRaw || []).map((t: any) => ({ ...t, id: t._id }));

  const filterTickets = (tab: string) => {
    return tickets.filter(ticket => {
      const eventDate = getTicketEventDate(ticket);
      if (tab === 'upcoming') return !isPast(eventDate) || isToday(eventDate);
      return isPast(eventDate) && !isToday(eventDate);
    });
  };

  if (!user && !loading) return <div className="p-20 text-center text-white"><Link href="/login" className="text-cyan-400 underline">Sign in</Link> to see your tickets</div>;

  return (
    <div className="container py-8 space-y-8 text-white">
      <h1 className="text-3xl font-bold">My Tickets</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filterTickets('upcoming').map(t => <TicketCard key={t.id} ticket={t} onViewTicket={setSelectedTicket} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-gray-900 text-white border-white/10">
          <DialogHeader><DialogTitle className="text-center">Your Ticket</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-4 rounded-xl mb-4"><QRCodeSVG value={selectedTicket?.ticketNumber || ''} size={200} /></div>
            <p className="font-mono text-lg">{selectedTicket?.ticketNumber}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
