'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  ScanLine,
  UserCheck,
  Volume2,
  VolumeX,
  Activity,
  TrendingUp,
  Clock,
  User
} from 'lucide-react';
import { cn, getErrorMessage } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { getScannerEvents, checkInTicket } from '@/app/actions/check-in';
import Image from 'next/image';

type ScanResult = {
  success: boolean;
  ticket?: any;
  message: string;
  timestamp: Date;
};

export default function CheckInScannerClient() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const scannerRef = useRef<any>(null);

  // Fetch authorized events
  const fetchEvents = useCallback(async () => {
    try {
      const data = await getScannerEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch authorized events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchEvents();
    }
  }, [user, authLoading, fetchEvents]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const checkInCount = selectedEvent?.checkInCount || 0;
  const totalRegistrations = selectedEvent?.registeredCount || 0;
  const checkInRate = totalRegistrations > 0 
    ? Math.round((checkInCount / totalRegistrations) * 100) 
    : 0;

  const handleProcessCheckIn = async (ticketNumber: string) => {
    if (!selectedEventId) {
      toast({ title: 'Error', description: 'Please select an event first', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const response = await checkInTicket(ticketNumber.trim(), selectedEventId);
      
      if (response.success) {
        setScanResult({
          success: true,
          ticket: response.ticket,
          message: 'Successfully checked in!',
          timestamp: new Date()
        });
        
        // Refresh local stats
        fetchEvents();
        
        if (soundEnabled) {
          const audio = new Audio('/sounds/success.mp3');
          audio.play().catch(() => {}); // Ignore if sound fails to play
        }
      }
    } catch (error: any) {
      setScanResult({ 
        success: false, 
        message: getErrorMessage(error), 
        timestamp: new Date() 
      });
      
      if (soundEnabled) {
        const audio = new Audio('/sounds/error.mp3');
        audio.play().catch(() => {});
      }
    } finally {
      setProcessing(false);
      setManualSearch('');
    }
  };

  const startScanner = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
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
      console.error(err);
      toast({ title: 'Camera Error', description: 'Could not access camera', variant: 'destructive' });
    }
  }, [toast, selectedEventId]); // Added selectedEventId as dependency

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  // Effect to clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [stopScanner]);

  if (authLoading || loading) {
    return (
      <div className="container py-32 text-center text-white">
        <Activity className="h-12 w-12 mx-auto mb-4 animate-spin text-cyan-500" />
        <p className="text-gray-400">Loading scanner...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="container py-16 text-center text-white">
        <ScanLine className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-20" />
        <h1 className="text-2xl font-bold">Organizer Access Required</h1>
        <p className="text-gray-400 mt-2">Only organizers and admins can access the check-in scanner.</p>
        <Button asChild className="mt-6" variant="outline"><a href="/explore">Back to Explore</a></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Check-in Scanner</h1>
          <p className="text-gray-400">Scan and verify attendee tickets</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="border-white/10 hover:bg-white/5" 
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="mb-6 bg-white/5 border-white/10 text-white shadow-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <Label className="mb-3 block text-xs font-bold uppercase tracking-wider text-gray-500">Select Event to Scan For</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12 text-lg">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10 text-white">
              {events.map(event => (
                <SelectItem key={event.id} value={event.id} className="focus:bg-white/10 py-3">
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Real-time Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <CardContent className="p-6 relative">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Checked In</p>
              <UserCheck size={14} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black">{checkInCount} / {totalRegistrations}</p>
            <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${checkInRate}%` }} 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10 text-white group hover:border-cyan-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Check-in Rate</p>
              <TrendingUp size={14} className="text-cyan-400" />
            </div>
            <p className="text-3xl font-black">{checkInRate}%</p>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <Activity size={10} className="text-cyan-500 animate-pulse" /> Live activity tracking
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white group hover:border-amber-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Pending</p>
              <Clock size={14} className="text-amber-400" />
            </div>
            <p className="text-3xl font-black">{Math.max(0, totalRegistrations - checkInCount)}</p>
            <p className="text-[10px] text-gray-500 mt-1">Attendees remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 text-white shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <QrCode className="h-4 w-4" /> QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div id="qr-reader" className="relative w-full aspect-square rounded-xl bg-black/40 flex items-center justify-center border border-white/10 overflow-hidden backdrop-blur-md">
              {!scanning && (
                <div className="text-center p-8">
                  <ScanLine className="h-16 w-16 text-gray-700 mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-gray-500">Camera stream will appear here</p>
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Activity className="h-8 w-8 text-cyan-500 animate-spin" />
                </div>
              )}
            </div>
            <Button 
              onClick={scanning ? stopScanner : startScanner} 
              className={cn(
                "w-full mt-6 h-12 text-lg font-bold transition-all",
                scanning ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" : "bg-cyan-600 hover:bg-cyan-700 text-white"
              )}
              variant={scanning ? "outline" : "default"}
              disabled={processing}
            >
              {scanning ? "Stop Scanner" : "Start QR Scanner"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 text-white shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Search className="h-4 w-4" /> Manual Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-id" className="text-xs text-gray-400">Enter Ticket Number Manually</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ticket-id"
                    placeholder="e.g. TKT-XJ8K2L..." 
                    value={manualSearch} 
                    onChange={(e) => setManualSearch(e.target.value)} 
                    className="bg-white/5 border-white/10 h-12 font-mono uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && handleProcessCheckIn(manualSearch)}
                  />
                  <Button 
                    disabled={!manualSearch || processing} 
                    onClick={() => handleProcessCheckIn(manualSearch)}
                    className="h-12 w-12 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processing ? <Activity className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="pt-8 text-center text-gray-500 border border-dashed border-white/10 rounded-xl py-12">
                  <div className="relative inline-block mb-4">
                    <Search size={48} className="mx-auto opacity-10" />
                    <ScanLine className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-500/20 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium">Use for manual verification</p>
                  <p className="text-xs text-gray-600 mt-1">Check the ID of the attendee and cross-reference</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!scanResult} onOpenChange={() => setScanResult(null)}>
        <DialogContent className="sm:max-w-md text-center py-10 bg-gray-900 text-white border-white/10 shadow-2xl">
          {scanResult?.success ? (
            <div className="space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                  <CheckCircle2 className="h-24 w-24 text-emerald-500 relative z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-emerald-500">Access Granted</h2>
                  <p className="text-gray-400 mt-1">Attendee verified successfully</p>
                </div>
                
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-left space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 overflow-hidden border border-white/10 flex items-center justify-center">
                        {scanResult.ticket?.userImage ? (
                          <Image src={scanResult.ticket.userImage} alt="User" width={48} height={48} className="object-cover" />
                        ) : (
                          <User className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{scanResult.ticket?.userName || 'Attendee'}</p>
                        <p className="text-xs text-emerald-400 font-medium">Verified Registration</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Ticket ID</p>
                      <p className="font-mono text-cyan-400 text-lg">{scanResult.ticket?.ticketNumber}</p>
                    </div>
                </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                  <XCircle className="h-24 w-24 text-red-500 relative z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-red-500">Access Denied</h2>
                  <p className="text-gray-400 mt-1">Verification failed</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-medium text-red-200">{scanResult?.message}</p>
                </div>
                <p className="text-xs text-gray-600">Please check the ticket details and try again or refer to the help desk.</p>
            </div>
          )}
          <Button onClick={() => setScanResult(null)} className="mt-8 w-full h-12 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10">
            Continue Scanning
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
