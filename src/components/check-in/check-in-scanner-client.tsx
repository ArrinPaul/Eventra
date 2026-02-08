'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
} from '@/components/ui/dialog';
import {
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
  UserCheck,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn, getErrorMessage } from '@/core/utils/utils';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

type ScanResult = {
  success: boolean;
  ticket?: any;
  message: string;
  timestamp: Date;
};

export default function CheckInScannerClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const allEventsRaw = useQuery(api.events.get);
  const checkInTicketMutation = useMutation(api.tickets.checkInTicket);
  
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const events: Event[] = (allEventsRaw || []).map((e: any) => ({ ...e, id: e._id }));
  const organizerEvents = events.filter(e => e.organizerId === (user?._id || user?.id) || user?.role === 'admin');

  useEffect(() => {
    if (organizerEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(organizerEvents[0].id);
    }
  }, [organizerEvents, selectedEvent]);

  const handleProcessCheckIn = async (ticketNumber: string) => {
    try {
      const response = await checkInTicketMutation({ ticketNumber });
      const result: ScanResult = {
        success: true,
        ticket: response.ticket,
        message: 'Successfully checked in!',
        timestamp: new Date()
      };
      setScanResult(result);
      if (soundEnabled) {
          // Play beep sound logic could go here
      }
    } catch (error: unknown) {
      const result: ScanResult = { 
        success: false, 
        message: getErrorMessage(error), 
        timestamp: new Date() 
      };
      setScanResult(result);
    }
  };

  const startScanner = useCallback(async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 }, 
        (decodedText) => {
            stopScanner();
            handleProcessCheckIn(decodedText);
        }, 
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast({ title: 'Camera Error', variant: 'destructive' });
    }
  }, [toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="container py-16 text-center text-white">
        <ScanLine className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-20" />
        <h1 className="text-2xl font-bold">Organizer Access Required</h1>
        <Button asChild className="mt-4" variant="outline"><a href="/explore">Back to Explore</a></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Check-in Scanner</h1>
        <Button variant="outline" size="icon" className="border-white/10" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="mb-6 bg-white/5 border-white/10 text-white">
        <CardContent className="p-4">
          <Label className="mb-2 block text-gray-400">Select Event</Label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Choose an event" /></SelectTrigger>
            <SelectContent className="bg-gray-900 text-white">
              {organizerEvents.map(event => <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader><CardTitle>QR Scanner</CardTitle></CardHeader>
          <CardContent>
            <div id="qr-reader" className="relative w-full aspect-square rounded-lg bg-black flex items-center justify-center border border-white/5 overflow-hidden">
              {!scanning && <QrCode className="h-16 w-16 text-gray-700" />}
            </div>
            <Button onClick={scanning ? stopScanner : startScanner} className="w-full mt-4" variant={scanning ? "destructive" : "default"}>
              {scanning ? "Stop Scanner" : "Start Scanner"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader><CardTitle>Manual Check-in</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input 
                placeholder="Ticket Number..." 
                value={manualSearch} 
                onChange={(e) => setManualSearch(e.target.value)} 
                className="bg-white/5 border-white/10"
              />
              <Button onClick={() => handleProcessCheckIn(manualSearch)}><UserCheck className="h-4 w-4" /></Button>
            </div>
            <div className="py-10 text-center text-gray-500 border border-dashed border-white/10 rounded-lg">
                <Search size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Enter a ticket number manually to process check-in.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!scanResult} onOpenChange={() => setScanResult(null)}>
        <DialogContent className="sm:max-w-md text-center py-10 bg-gray-900 text-white border-white/10">
          {scanResult?.success ? (
            <div className="space-y-4">
                <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold">Check-in Success!</h2>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-left">
                    <p className="text-xs text-gray-400 uppercase">Ticket Number</p>
                    <p className="font-mono text-cyan-400">{scanResult.ticket?.ticketNumber}</p>
                </div>
            </div>
          ) : (
            <div className="space-y-4">
                <XCircle className="h-20 w-20 text-destructive mx-auto" />
                <h2 className="text-2xl font-bold">Check-in Failed</h2>
                <p className="text-gray-400">{scanResult?.message}</p>
            </div>
          )}
          <Button onClick={() => setScanResult(null)} className="mt-8 w-full">Continue Scanning</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
