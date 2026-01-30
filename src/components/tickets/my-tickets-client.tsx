'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ticketService } from '@/lib/firestore-services';
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
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isFuture, isToday, differenceInHours, differenceInMinutes } from 'date-fns';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Helper to get event date from ticket
const getTicketEventDate = (ticket: EventTicket): Date => {
  if (ticket.event?.date) {
    if (ticket.event.date instanceof Date) return ticket.event.date;
    if (typeof ticket.event.date === 'object' && 'toDate' in ticket.event.date) {
      return (ticket.event.date as { toDate: () => Date }).toDate();
    }
    return new Date(ticket.event.date as unknown as string);
  }
  return new Date();
};

// Ticket status badge component
function TicketStatusBadge({ status }: { status: EventTicket['status'] }) {
  const statusConfig = {
    'confirmed': { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    'pending': { label: 'Pending', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    'checked-in': { label: 'Checked In', className: 'bg-primary/10 text-primary border-primary/20' },
    'cancelled': { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    'refunded': { label: 'Refunded', className: 'bg-muted text-muted-foreground border-muted' },
  };

  const config = statusConfig[status] || statusConfig['pending'];

  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

// Live status indicator
function LiveStatus({ eventDate }: { eventDate: Date }) {
  const now = new Date();
  const hoursUntil = differenceInHours(eventDate, now);
  const minutesUntil = differenceInMinutes(eventDate, now);

  if (isPast(eventDate)) {
    return <span className="text-muted-foreground text-sm">Event ended</span>;
  }

  if (isToday(eventDate) && minutesUntil <= 0) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        Live Now
      </span>
    );
  }

  if (hoursUntil <= 2) {
    return (
      <span className="text-sm font-medium text-amber-500">
        Starts in {minutesUntil} min
      </span>
    );
  }

  if (hoursUntil <= 24) {
    return (
      <span className="text-sm font-medium text-primary">
        Starts in {hoursUntil}h
      </span>
    );
  }

  return null;
}

// Individual ticket card
function TicketCard({ 
  ticket, 
  onViewTicket 
}: { 
  ticket: EventTicket; 
  onViewTicket: (ticket: EventTicket) => void;
}) {
  const eventDate = getTicketEventDate(ticket);
  const isUpcoming = isFuture(eventDate) || isToday(eventDate);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg card-hover",
      !isUpcoming && "opacity-75"
    )}>
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
      
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Event Image */}
          <div className="hidden sm:block relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            {ticket.event?.image ? (
              <img 
                src={ticket.event.image} 
                alt={ticket.event?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Ticket className="h-8 w-8 text-primary/50" />
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg leading-tight truncate">
                {ticket.event?.title || 'Event'}
              </h3>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{format(eventDate, 'EEE, MMM d, yyyy')}</span>
                <LiveStatus eventDate={eventDate} />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{format(eventDate, 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{ticket.event?.location || 'TBD'}</span>
              </div>
            </div>

            {/* Ticket Number */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <QrCode className="h-3.5 w-3.5" />
              {ticket.ticketNumber}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button 
            size="sm" 
            onClick={() => onViewTicket(ticket)}
            className="flex-1"
          >
            <QrCode className="h-4 w-4 mr-2" />
            View Ticket
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/events/${ticket.eventId}`}>
              Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// QR Ticket Modal
function TicketModal({ 
  ticket, 
  isOpen, 
  onClose 
}: { 
  ticket: EventTicket | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!ticket) return null;

  const eventDate = getTicketEventDate(ticket);

  const handleDownloadPDF = async () => {
    // Create a printable ticket layout
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${ticket.event?.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .ticket { max-width: 400px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #FF6B35, #A855F7); color: white; padding: 24px; text-align: center; }
          .header h1 { font-size: 24px; margin-bottom: 8px; }
          .header p { opacity: 0.9; }
          .qr-section { padding: 24px; text-align: center; background: #f9fafb; }
          .qr-placeholder { width: 200px; height: 200px; margin: 0 auto 16px; background: white; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280; }
          .ticket-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #FF6B35; }
          .details { padding: 24px; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-size: 14px; }
          .value { font-weight: 600; }
          .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>🎫 Event Ticket</h1>
            <p>${ticket.event?.title || 'Event'}</p>
          </div>
          <div class="qr-section">
            <div class="qr-placeholder">
              [QR Code]<br/>
              Scan at venue
            </div>
            <div class="ticket-number">${ticket.ticketNumber}</div>
          </div>
          <div class="details">
            <div class="detail-row">
              <span class="label">Attendee</span>
              <span class="value">${ticket.attendeeName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date</span>
              <span class="value">${format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time</span>
              <span class="value">${format(eventDate, 'h:mm a')}</span>
            </div>
            <div class="detail-row">
              <span class="label">Location</span>
              <span class="value">${ticket.event?.location || 'TBD'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status</span>
              <span class="value">${ticket.status.toUpperCase()}</span>
            </div>
          </div>
          <div class="footer">
            <p>Present this ticket at the venue for entry</p>
            <p>© EventOS - eventos.app</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(ticket.event?.title || 'Event');
    const location = encodeURIComponent(ticket.event?.location || '');
    const startDate = format(eventDate, "yyyyMMdd'T'HHmmss");
    const endDate = format(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000), "yyyyMMdd'T'HHmmss"); // 2 hours later
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ticket to ${ticket.event?.title}`,
          text: `I'm attending ${ticket.event?.title}! Ticket #${ticket.ticketNumber}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`My ticket to ${ticket.event?.title} - Ticket #${ticket.ticketNumber}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Your Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
            <QRCodeSVG 
              value={ticket.ticketNumber}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Ticket Number */}
          <div className="text-center mb-6">
            <p className="text-xs text-muted-foreground mb-1">TICKET NUMBER</p>
            <p className="font-mono text-lg font-semibold tracking-wider">
              {ticket.ticketNumber}
            </p>
          </div>

          {/* Event Info */}
          <Card className="w-full">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">{ticket.event?.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{format(eventDate, 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{ticket.event?.location}</span>
                </div>
              </div>

              {/* Attendee Info */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">ATTENDEE</p>
                <p className="font-medium">{ticket.attendeeName}</p>
                <p className="text-sm text-muted-foreground">{ticket.attendeeEmail}</p>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <TicketStatusBadge status={ticket.status} />
                {ticket.status === 'checked-in' && ticket.checkInTime && (
                  <span className="text-xs text-muted-foreground">
                    Checked in at {format(
                      ticket.checkInTime instanceof Date 
                        ? ticket.checkInTime 
                        : typeof ticket.checkInTime === 'object' && 'toDate' in ticket.checkInTime
                          ? (ticket.checkInTime as { toDate: () => Date }).toDate()
                          : new Date(ticket.checkInTime as unknown as string), 
                      'h:mm a'
                    )}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 mt-6 w-full">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button variant="outline" onClick={handleAddToCalendar}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export default function MyTicketsClient() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const userTickets = await ticketService.getUserTickets(user.uid);
        setTickets(userTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // Filter tickets by tab
  const filterTickets = (tab: string) => {
    return tickets.filter(ticket => {
      const eventDate = getTicketEventDate(ticket);
      
      switch (tab) {
        case 'upcoming':
          return (isFuture(eventDate) || isToday(eventDate)) && 
                 ticket.status !== 'cancelled' && 
                 ticket.status !== 'refunded';
        case 'past':
          return isPast(eventDate) && !isToday(eventDate);
        case 'all':
        default:
          return true;
      }
    });
  };

  const upcomingTickets = filterTickets('upcoming');
  const pastTickets = filterTickets('past');

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <Ticket className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Sign in to see your tickets</h1>
          <p className="text-muted-foreground mb-6">
            View and manage your event tickets, check-in with QR codes, and track your event history.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/explore">Explore Events</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground">
            View and manage your event tickets
          </p>
        </div>
        <Button asChild>
          <Link href="/explore">
            <Sparkles className="mr-2 h-4 w-4" />
            Find Events
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <Ticket className="h-4 w-4" />
            Upcoming
            {upcomingTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {upcomingTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Past
            {pastTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pastTickets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="upcoming">
              {upcomingTickets.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {upcomingTickets.map(ticket => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      onViewTicket={setSelectedTicket}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Ticket className="h-12 w-12" />}
                  title="No upcoming tickets"
                  description="When you register for events, your tickets will appear here."
                  action={
                    <Button asChild>
                      <Link href="/explore">Browse Events</Link>
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastTickets.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pastTickets.map(ticket => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      onViewTicket={setSelectedTicket}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12" />}
                  title="No past tickets"
                  description="Your attended events will appear here."
                />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Ticket Modal */}
      <TicketModal 
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
