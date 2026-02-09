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
  MoreVertical,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isPast, isFuture, isToday } from 'date-fns';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { processTicketCancellation } from '@/app/actions/payments';

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

function TicketCard({ ticket, onViewTicket, onPrint, onCancel }: { 
  ticket: EventTicket; 
  onViewTicket: (ticket: EventTicket) => void; 
  onPrint: (ticket: EventTicket) => void;
  onCancel: (ticket: EventTicket) => void;
}) {
  const eventDate = getTicketEventDate(ticket);
  const isCancellable = ticket.status !== 'cancelled' && ticket.status !== 'refunded' && !isPast(eventDate);

  return (
    <Card className="bg-white/5 border-white/10 text-white overflow-hidden group hover:border-white/20 transition-all">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg bg-cyan-900/20 flex items-center justify-center">
            {ticket.event?.imageUrl ? <img src={ticket.event.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" /> : <Ticket size={32} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-bold truncate">{ticket.event?.title || 'Event'}</h3>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <p className="flex items-center gap-1"><Calendar size={12} /> {format(eventDate, 'EEE, MMM d, yyyy')}</p>
              <p className="flex items-center gap-1"><QrCode size={12} /> {ticket.ticketNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-[2] bg-cyan-600 hover:bg-cyan-500" onClick={() => onViewTicket(ticket)}>View QR</Button>
          <Button size="sm" variant="outline" className="flex-1 border-white/10" onClick={() => onPrint(ticket)}><Download className="h-4 w-4" /></Button>
          
          {isCancellable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-white/10"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-white/10 text-white">
                <DropdownMenuItem 
                  onClick={() => onCancel(ticket)}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 mr-2" /> 
                  {ticket.price > 0 ? 'Cancel & Refund' : 'Cancel Registration'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyTicketsClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const allTicketsRaw = useQuery(api.tickets.getByUserId, user ? { userId: (user._id || user.id) as any } : "skip");
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loading = allTicketsRaw === undefined;
  const tickets: EventTicket[] = (allTicketsRaw || []).map((t: any) => ({ ...t, id: t._id }));

  const handleCancel = async (ticket: EventTicket) => {
    const confirmMsg = ticket.price > 0 
      ? `Are you sure you want to cancel and request a refund for "${ticket.event?.title}"?`
      : `Are you sure you want to cancel your registration for "${ticket.event?.title}"?`;
    
    if (!confirm(confirmMsg)) return;

    setCancellingId(ticket.id);
    try {
      const result = await processTicketCancellation(ticket.id, (ticket as any).stripePaymentId);
      if (result.success) {
        toast({ 
          title: result.status === 'refunded' ? "Refund Processed" : "Ticket Cancelled",
          description: result.status === 'refunded' 
            ? "Your refund has been initiated and your ticket is now void."
            : "Your registration has been cancelled."
        });
      }
    } catch (e: any) {
      toast({ title: "Cancellation Failed", description: e.message, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrint = (ticket: EventTicket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const eventDate = getTicketEventDate(ticket);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${ticket.event?.title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .ticket { border: 2px solid #333; padding: 30px; border-radius: 15px; max-width: 600px; margin: 0 auto; position: relative; }
            .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: 500; }
            .qr-container { text-align: center; margin-top: 30px; }
            .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; pt: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="label">Event Ticket</div>
              <h1 class="title">${ticket.event?.title}</h1>
            </div>
            <div class="details">
              <div>
                <div class="label">Attendee</div>
                <div class="value">${ticket.attendeeName || user?.name || 'Guest'}</div>
              </div>
              <div>
                <div class="label">Date</div>
                <div class="value">${format(eventDate, 'PPP')}</div>
              </div>
              <div>
                <div class="label">Ticket Number</div>
                <div class="value">${ticket.ticketNumber}</div>
              </div>
              <div>
                <div class="label">Status</div>
                <div class="value">${ticket.status}</div>
              </div>
            </div>
            <div class="qr-container">
              <div id="qrcode"></div>
              <p class="value">${ticket.ticketNumber}</p>
            </div>
            <div class="footer">
              Generated by Eventra Platform • Verified Ticket
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            window.onload = function() {
              var typeNumber = 4;
              var errorCorrectionLevel = 'L';
              var qr = qrcode(typeNumber, errorCorrectionLevel);
              qr.addData('${ticket.ticketNumber}');
              qr.make();
              document.getElementById('qrcode').innerHTML = qr.createImgTag(5);
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
          {filterTickets('upcoming').map(t => <TicketCard key={t.id} ticket={t} onViewTicket={setSelectedTicket} onPrint={handlePrint} onCancel={handleCancel} />)}
        </TabsContent>
        <TabsContent value="past" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filterTickets('past').map(t => <TicketCard key={t.id} ticket={t} onViewTicket={setSelectedTicket} onPrint={handlePrint} onCancel={handleCancel} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-gray-900 text-white border-white/10">
          <DialogHeader><DialogTitle className="text-center">Your Ticket</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-4 rounded-xl mb-4"><QRCodeSVG value={selectedTicket?.ticketNumber || ''} size={200} /></div>
            <p className="font-mono text-lg mb-6">{selectedTicket?.ticketNumber}</p>
            <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={() => selectedTicket && handlePrint(selectedTicket)}>
              <Download className="mr-2 h-4 w-4" /> Download PDF Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
