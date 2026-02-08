'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, ShoppingCart, Calendar, MapPin, Loader2, QrCode, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/core/utils/utils';
import Link from 'next/link';

export function TicketingClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?._id || user?.id;
  
  const events = useQuery(api.events.get) || [];
  const myTicketsRaw = useQuery(api.tickets.getByUserId, userId ? { userId: userId as any } : "skip") || [];
  const registerMutation = useMutation(api.registrations.register);
  
  const [activeTab, setActiveTab] = useState('explore');
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleBook = async (eventId: string) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to book tickets." });
      return;
    }
    
    setBookingId(eventId);
    try {
      await registerMutation({ eventId: eventId as any });
      toast({ title: "Booking Successful! 🎉", description: "Your ticket has been generated." });
      setActiveTab('my-tickets');
    } catch (error) {
      toast({ title: "Booking Failed", variant: "destructive" });
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Event Tickets</h1>
          <p className="text-gray-400">Discover and book tickets for amazing events</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10 text-white">
          <TabsTrigger value="explore" className="gap-2">Explore Events</TabsTrigger>
          <TabsTrigger value="my-tickets" className="gap-2">My Tickets ({myTicketsRaw.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="explore" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.filter((e: any) => e.status === 'published').map((event: any) => (
            <Card key={event._id} className="bg-white/5 border-white/10 text-white overflow-hidden flex flex-col">
              <div className="h-40 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 relative">
                <Badge className="absolute top-2 right-2">{event.category}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="text-gray-400 line-clamp-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-cyan-400" /> {format(event.startDate, 'PPP')}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-400" /> {event.location?.venue || 'TBD'}</div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <p className="text-2xl font-bold text-cyan-400">{event.isPaid ? `$${event.price}` : 'FREE'}</p>
                  <Button onClick={() => handleBook(event._id)} disabled={bookingId === event._id}>
                    {bookingId === event._id ? <Loader2 className="animate-spin" /> : <ShoppingCart className="mr-2" size={16} />}
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && <div className="col-span-full py-20 text-center text-gray-500 italic">No events available for booking yet.</div>}
        </TabsContent>
        
        <TabsContent value="my-tickets" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTicketsRaw.map((ticket: any) => (
            <Card key={ticket._id} className="bg-white/5 border-white/10 text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px]">{ticket.ticketNumber}</Badge>
                  <Badge className={cn(ticket.status === 'confirmed' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{ticket.status}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">Event Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg flex justify-center"><QrCode size={120} className="text-black" /></div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Purchase Date</p>
                  <p className="text-sm font-medium">{format(ticket.purchaseDate, 'PPP')}</p>
                </div>
                <Button variant="outline" className="w-full border-white/10" asChild>
                  <Link href={`/tickets`}><Ticket className="mr-2" size={16} /> View in Wallet</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {myTicketsRaw.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-lg">
              <Ticket size={48} className="mx-auto mb-4 opacity-20" />
              <p>You haven&apos;t booked any tickets yet.</p>
              <Button variant="link" onClick={() => setActiveTab('explore')} className="text-cyan-400 mt-2">Browse Events</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}