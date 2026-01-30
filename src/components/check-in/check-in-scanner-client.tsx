'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ticketService, eventService } from '@/core/services/firestore-services';
import { EventTicket, Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  RefreshCw,
  ScanLine,
  UserCheck,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { cn, getErrorMessage } from '@/core/utils/utils';
import { format } from 'date-fns';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { processUserAction } from '@/app/actions/user-actions';

type ScanResult = {
  success: boolean;
  ticket?: EventTicket;
  message: string;
  timestamp: Date;
};

export default function CheckInScannerClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState<EventTicket[]>([]);
  const [searching, setSearching] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null);
  const audioErrorRef = useRef<HTMLAudioElement | null>(null);

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const allEvents = await eventService.getEvents();
        // Filter events where user is an organizer
        const organizerEvents = allEvents.filter(event => 
          event.organizers?.includes(user.uid!) || 
          event.organizerId === user.uid ||
          user.role === 'admin'
        );
        setEvents(organizerEvents);
        
        // Auto-select first event
        if (organizerEvents.length > 0 && !selectedEvent) {
          setSelectedEvent(organizerEvents[0].id);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Fetch event stats when event changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedEvent) return;
      
      try {
        const tickets = await ticketService.getEventTickets(selectedEvent);
        const checkedIn = tickets.filter(t => t.status === 'checked-in').length;
        setStats({ checkedIn, total: tickets.length });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [selectedEvent]);

  // Initialize audio
  useEffect(() => {
    // Create audio elements for feedback
    audioSuccessRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleT0DCpnK5+N6fD4ZEKC10cONYDw5P5+ut8WddjFHPI+nob+wqX9LKD1klomjqKaNbGJjbX6LmZ6knJOLiIeEgH5+foKEg4B+fX9/');
    audioErrorRef.current = new Audio('data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTtvAABq');
  }, []);

  // Play sound feedback
  const playSound = (success: boolean) => {
    if (!soundEnabled) return;
    
    const audio = success ? audioSuccessRef.current : audioErrorRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  // Start QR Scanner
  const startScanner = useCallback(async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Process scan
          await handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (normal when no QR is visible)
        }
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  }, [selectedEvent, toast]);

  // Stop QR Scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  }, []);

  // Handle QR scan result
  const handleScan = async (ticketNumber: string) => {
    if (!selectedEvent) return;

    try {
      // Look up ticket by number
      const ticket = await ticketService.getTicketByNumber(ticketNumber);
      
      if (!ticket) {
        const result: ScanResult = {
          success: false,
          message: 'Ticket not found',
          timestamp: new Date()
        };
        setScanResult(result);
        setRecentScans(prev => [result, ...prev.slice(0, 9)]);
        playSound(false);
        return;
      }

      // Check if ticket is for this event
      if (ticket.eventId !== selectedEvent) {
        const result: ScanResult = {
          success: false,
          ticket,
          message: 'Ticket is for a different event',
          timestamp: new Date()
        };
        setScanResult(result);
        setRecentScans(prev => [result, ...prev.slice(0, 9)]);
        playSound(false);
        return;
      }

      // Check if already checked in
      if (ticket.status === 'checked-in') {
        const result: ScanResult = {
          success: false,
          ticket,
          message: 'Already checked in',
          timestamp: new Date()
        };
        setScanResult(result);
        setRecentScans(prev => [result, ...prev.slice(0, 9)]);
        playSound(false);
        return;
      }

      // Check if ticket is valid
      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        const result: ScanResult = {
          success: false,
          ticket,
          message: 'Ticket is not valid',
          timestamp: new Date()
        };
        setScanResult(result);
        setRecentScans(prev => [result, ...prev.slice(0, 9)]);
        playSound(false);
        return;
      }

      // Check in the ticket
      await ticketService.checkInTicket(ticket.id);
      
      // Process gamification for the user being checked in
      if (ticket.userId) {
        try {
          const currentEvent = events.find(e => e.id === selectedEvent);
          await processUserAction(ticket.userId, 'event_check_in', {
            eventId: selectedEvent,
            eventCategory: currentEvent?.category,
          });
        } catch (gamificationError) {
          console.error('Gamification error:', gamificationError);
        }
      }
      
      const result: ScanResult = {
        success: true,
        ticket: { ...ticket, status: 'checked-in' },
        message: 'Check-in successful!',
        timestamp: new Date()
      };
      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
      playSound(true);

    } catch (error: unknown) {
      const result: ScanResult = {
        success: false,
        message: getErrorMessage(error),
        timestamp: new Date()
      };
      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);
      playSound(false);
    }
  };

  // Manual search
  const handleManualSearch = async () => {
    if (!manualSearch.trim() || !selectedEvent) return;

    setSearching(true);
    try {
      const tickets = await ticketService.getEventTickets(selectedEvent);
      const query = manualSearch.toLowerCase();
      
      const results = tickets.filter(ticket => 
        ticket.attendeeName?.toLowerCase().includes(query) ||
        ticket.attendeeEmail?.toLowerCase().includes(query) ||
        ticket.ticketNumber?.toLowerCase().includes(query)
      );
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Manual check-in
  const handleManualCheckIn = async (ticket: EventTicket) => {
    try {
      await ticketService.checkInTicket(ticket.id);
      
      // Process gamification for the user being checked in
      if (ticket.userId) {
        try {
          const currentEvent = events.find(e => e.id === selectedEvent);
          await processUserAction(ticket.userId, 'event_check_in', {
            eventId: selectedEvent,
            eventCategory: currentEvent?.category,
          });
        } catch (gamificationError) {
          console.error('Gamification error:', gamificationError);
        }
      }
      
      const result: ScanResult = {
        success: true,
        ticket: { ...ticket, status: 'checked-in' },
        message: 'Manual check-in successful!',
        timestamp: new Date()
      };
      
      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
      playSound(true);
      
      // Update search results
      setSearchResults(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, status: 'checked-in' as const } : t)
      );
      
      toast({
        title: 'Check-in successful',
        description: `${ticket.attendeeName} has been checked in.`
      });
    } catch (error: unknown) {
      toast({
        title: 'Check-in failed',
        description: getErrorMessage(error),
        variant: 'destructive'
      });
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <ScanLine className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Organizer Access Required</h1>
          <p className="text-muted-foreground mb-6">
            The check-in scanner is only available to event organizers.
          </p>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const selectedEventData = events.find(e => e.id === selectedEvent);
  const checkInRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Check-in Scanner</h1>
          <p className="text-muted-foreground">
            Scan QR codes or search attendees manually
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(!soundEnabled && "text-muted-foreground")}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Event Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Stats */}
            {selectedEvent && (
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.checkedIn}</div>
                  <div className="text-xs text-muted-foreground">Checked In</div>
                </div>
                <div className="text-center px-4 py-2 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Registered</div>
                </div>
                <div className="text-center px-4 py-2 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-emerald-500">{checkInRate}%</div>
                  <div className="text-xs text-muted-foreground">Rate</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Scanner
              </CardTitle>
              <CardDescription>Point camera at attendee's QR code</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                id="qr-reader" 
                className={cn(
                  "relative w-full aspect-square rounded-lg overflow-hidden bg-muted",
                  !scanning && "flex items-center justify-center"
                )}
              >
                {!scanning && (
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">Camera not active</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                {!scanning ? (
                  <Button onClick={startScanner} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Search
              </CardTitle>
              <CardDescription>Search by name, email, or ticket number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search attendees..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <Button onClick={handleManualSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.map(ticket => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{ticket.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">{ticket.attendeeEmail}</p>
                    </div>
                    {ticket.status === 'checked-in' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Checked In
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleManualCheckIn(ticket)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && manualSearch && !searching && (
                  <p className="text-center text-muted-foreground py-4">
                    No attendees found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Result Modal */}
      <Dialog open={!!scanResult} onOpenChange={() => setScanResult(null)}>
        <DialogContent className={cn(
          "sm:max-w-md",
          scanResult?.success ? "border-emerald-500" : "border-destructive"
        )}>
          <div className="py-8 text-center">
            {scanResult?.success ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-500 mb-2">
                  Check-in Successful!
                </h2>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive mb-2">
                  Check-in Failed
                </h2>
              </>
            )}
            
            <p className="text-muted-foreground mb-4">{scanResult?.message}</p>
            
            {scanResult?.ticket && (
              <div className="bg-muted rounded-lg p-4 text-left">
                <p className="font-semibold">{scanResult.ticket.attendeeName}</p>
                <p className="text-sm text-muted-foreground">{scanResult.ticket.attendeeEmail}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {scanResult.ticket.ticketNumber}
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => setScanResult(null)} 
              className="mt-6"
              variant={scanResult?.success ? "default" : "outline"}
            >
              Continue Scanning
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentScans.slice(0, 5).map((scan, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg text-sm",
                    scan.success ? "bg-emerald-500/10" : "bg-destructive/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {scan.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{scan.ticket?.attendeeName || 'Unknown'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(scan.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
