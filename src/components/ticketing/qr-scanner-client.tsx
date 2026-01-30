'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  QrCode, 
  Camera, 
  Search, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Users,
  Clock,
  Ticket,
  Scan,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { EventTicket, Event } from '@/types';

interface CheckInResult {
  success: boolean;
  ticket?: EventTicket;
  message: string;
  attendeeName?: string;
  ticketType?: string;
}

interface CheckInHistoryEntry {
  id: string;
  attendeeName: string;
  ticketType: string;
  checkInTime: Date;
  qrCode: string;
  status: 'success' | 'failed';
}

interface AttendeeForCheckIn {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  ticketId: string;
  qrCode: string;
  status: string;
}

export function QrScannerClient() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [checkInHistory, setCheckInHistory] = useState<CheckInHistoryEntry[]>([]);
  
  // Real event data
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventStats, setEventStats] = useState({ checkedIn: 0, total: 0, failed: 0 });
  const [pendingAttendees, setPendingAttendees] = useState<AttendeeForCheckIn[]>([]);

  // Load organizer's events
  const loadOrganizerEvents = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('organizerId', '==', user.uid),
        where('startDate', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))), // Today - 1 day
        orderBy('startDate', 'asc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const loadedEvents: Event[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        startDate: d.data().startDate?.toDate?.() || new Date(d.data().startDate),
        endDate: d.data().endDate?.toDate?.() || new Date(d.data().endDate),
        createdAt: d.data().createdAt?.toDate?.() || new Date(d.data().createdAt)
      })) as Event[];
      
      setEvents(loadedEvents);
      
      // Auto-select first event if available
      if (loadedEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(loadedEvents[0].id);
        setCurrentEvent(loadedEvents[0]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [user?.uid, selectedEventId]);

  // Load event details and stats when selected event changes
  const loadEventData = useCallback(async () => {
    if (!selectedEventId) return;
    
    try {
      // Get event details
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, selectedEventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        setCurrentEvent({
          id: selectedEventId,
          ...data,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        } as Event);
      }
      
      // Get tickets for this event
      const ticketsRef = collection(db, 'tickets');
      const ticketsQuery = query(
        ticketsRef,
        where('eventId', '==', selectedEventId)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      let checkedIn = 0;
      let total = ticketsSnapshot.docs.length;
      const pending: AttendeeForCheckIn[] = [];
      
      for (const ticketDoc of ticketsSnapshot.docs) {
        const ticket = ticketDoc.data();
        if (ticket.checkInStatus === 'checked_in') {
          checkedIn++;
        } else if (ticket.status === 'confirmed') {
          // Get user info for pending check-ins
          try {
            const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, ticket.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              pending.push({
                id: ticketDoc.id,
                name: userData.displayName || userData.name || 'Unknown',
                email: userData.email || '',
                ticketType: ticket.ticketTypeName || 'General',
                ticketId: ticketDoc.id,
                qrCode: ticket.qrCode || ticketDoc.id,
                status: ticket.checkInStatus || 'not_checked_in'
              });
            }
          } catch (e) {
            console.error('Error loading user:', e);
          }
        }
      }
      
      setEventStats({ checkedIn, total, failed: 0 });
      setPendingAttendees(pending.slice(0, 10)); // Show first 10
      
    } catch (error) {
      console.error('Error loading event data:', error);
    }
  }, [selectedEventId]);

  // Load check-in history from Firestore
  const loadCheckInHistory = useCallback(async () => {
    if (!selectedEventId) return;
    
    try {
      const checkInsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, selectedEventId, 'checkIns');
      const q = query(
        checkInsRef,
        orderBy('checkInTime', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const history: CheckInHistoryEntry[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          attendeeName: data.attendeeName || 'Unknown',
          ticketType: data.ticketType || 'General',
          checkInTime: data.checkInTime?.toDate?.() || new Date(data.checkInTime),
          qrCode: data.qrCode || '',
          status: data.status || 'success'
        };
      });
      
      setCheckInHistory(history);
    } catch (error) {
      console.error('Error loading check-in history:', error);
      setCheckInHistory([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    checkCameraAccess();
    loadOrganizerEvents();
    
    return () => {
      stopCamera();
    };
  }, [loadOrganizerEvents]);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData();
      loadCheckInHistory();
    }
  }, [selectedEventId, loadEventData, loadCheckInHistory]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    if (event) {
      setCurrentEvent(event);
    }
  };

  const checkCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasCamera(true);
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        startScanning();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    const scanInterval = setInterval(() => {
      if (!isScanning || !videoRef.current || !canvasRef.current) {
        clearInterval(scanInterval);
        return;
      }

      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Mock QR code detection - in real implementation, use a QR code library like jsQR
        // This simulates scanning - in production, integrate with jsQR or similar
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // For now, we simulate detection - real implementation would use:
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        // if (code) { handleQrCodeDetected(code.data); }
      } catch (error) {
        console.error('Error scanning:', error);
      }
    }, 500);
  };

  const handleQrCodeDetected = (qrCode: string) => {
    stopCamera();
    processCheckIn(qrCode);
  };

  const processCheckIn = async (code: string) => {
    if (!selectedEventId || !currentEvent) {
      setScanResult({
        success: false,
        message: 'Please select an event first.'
      });
      setShowResultDialog(true);
      return;
    }
    
    setLoading(true);
    try {
      // Find ticket by QR code or ticket ID
      const ticketsRef = collection(db, 'tickets');
      let ticketQuery = query(
        ticketsRef,
        where('qrCode', '==', code),
        where('eventId', '==', selectedEventId),
        limit(1)
      );
      
      let ticketSnapshot = await getDocs(ticketQuery);
      
      // If not found by QR code, try by ticket ID
      if (ticketSnapshot.empty) {
        const ticketDoc = await getDoc(doc(db, 'tickets', code));
        if (ticketDoc.exists() && ticketDoc.data().eventId === selectedEventId) {
          // Process this ticket
          const ticketData = ticketDoc.data();
          
          if (ticketData.checkInStatus === 'checked_in') {
            setScanResult({
              success: false,
              message: 'Ticket already checked in.'
            });
            setShowResultDialog(true);
            setLoading(false);
            return;
          }
          
          // Get user info
          const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, ticketData.userId));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          // Update ticket status
          await updateDoc(doc(db, 'tickets', ticketDoc.id), {
            checkInStatus: 'checked_in',
            checkInTime: serverTimestamp()
          });
          
          // Record check-in
          const checkInsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, selectedEventId, 'checkIns');
          const { addDoc: addCheckIn } = await import('firebase/firestore');
          await addCheckIn(checkInsRef, {
            ticketId: ticketDoc.id,
            userId: ticketData.userId,
            attendeeName: userData?.displayName || userData?.name || 'Unknown',
            ticketType: ticketData.ticketTypeName || 'General',
            qrCode: code,
            checkInTime: serverTimestamp(),
            status: 'success',
            checkedInBy: user?.uid
          });
          
          const result: CheckInResult = {
            success: true,
            message: 'Check-in successful!',
            attendeeName: userData?.displayName || userData?.name || 'Unknown',
            ticketType: ticketData.ticketTypeName || 'General'
          };
          
          // Add to local history
          setCheckInHistory(prev => [{
            id: Date.now().toString(),
            attendeeName: result.attendeeName || 'Unknown',
            ticketType: result.ticketType || 'General',
            checkInTime: new Date(),
            qrCode: code,
            status: 'success'
          }, ...prev]);
          
          // Update stats
          setEventStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
          
          setScanResult(result);
          setShowResultDialog(true);
          setLoading(false);
          return;
        }
      }
      
      if (ticketSnapshot.empty) {
        setScanResult({
          success: false,
          message: 'Invalid ticket code. Please try again.'
        });
        
        // Record failed attempt
        setCheckInHistory(prev => [{
          id: Date.now().toString(),
          attendeeName: 'Unknown',
          ticketType: 'Unknown',
          checkInTime: new Date(),
          qrCode: code,
          status: 'failed'
        }, ...prev]);
        
        setEventStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        setShowResultDialog(true);
        setLoading(false);
        return;
      }
      
      // Process the found ticket
      const ticketDoc = ticketSnapshot.docs[0];
      const ticketData = ticketDoc.data();
      
      if (ticketData.checkInStatus === 'checked_in') {
        setScanResult({
          success: false,
          message: 'Ticket already checked in.'
        });
        setShowResultDialog(true);
        setLoading(false);
        return;
      }
      
      // Get user info
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, ticketData.userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Update ticket status
      await updateDoc(doc(db, 'tickets', ticketDoc.id), {
        checkInStatus: 'checked_in',
        checkInTime: serverTimestamp()
      });
      
      // Record check-in
      const checkInsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS, selectedEventId, 'checkIns');
      const { addDoc: addCheckInDoc } = await import('firebase/firestore');
      await addCheckInDoc(checkInsRef, {
        ticketId: ticketDoc.id,
        userId: ticketData.userId,
        attendeeName: userData?.displayName || userData?.name || 'Unknown',
        ticketType: ticketData.ticketTypeName || 'General',
        qrCode: code,
        checkInTime: serverTimestamp(),
        status: 'success',
        checkedInBy: user?.uid
      });
      
      const result: CheckInResult = {
        success: true,
        message: 'Check-in successful!',
        attendeeName: userData?.displayName || userData?.name || 'Unknown',
        ticketType: ticketData.ticketTypeName || 'General'
      };
      
      // Add to local history
      setCheckInHistory(prev => [{
        id: Date.now().toString(),
        attendeeName: result.attendeeName || 'Unknown',
        ticketType: result.ticketType || 'General',
        checkInTime: new Date(),
        qrCode: code,
        status: 'success'
      }, ...prev]);
      
      // Update stats
      setEventStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
      
      // Remove from pending
      setPendingAttendees(prev => prev.filter(a => a.qrCode !== code && a.ticketId !== ticketDoc.id));
      
      setScanResult(result);
    } catch (error) {
      console.error('Error processing check-in:', error);
      setScanResult({
        success: false,
        message: 'Check-in failed. Please try again.'
      });
    } finally {
      setShowResultDialog(true);
      setLoading(false);
    }
  };

  const handleManualCheckIn = () => {
    if (!manualCode.trim()) return;
    processCheckIn(manualCode);
    setManualCode('');
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading events...</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Events Found</h2>
          <p className="text-gray-600">You don&apos;t have any upcoming events to manage check-ins for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Check-In</h1>
        <p className="text-gray-600">Scan QR codes or manually check in attendees</p>
      </div>

      {/* Event Selector */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="event-select" className="mb-2 block">Select Event</Label>
              <Select value={selectedEventId} onValueChange={handleEventChange}>
                <SelectTrigger id="event-select">
                  <SelectValue placeholder="Select an event" />
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
            
            {currentEvent && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {currentEvent.startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {currentEvent.location || 'Online'}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {eventStats.checkedIn} / {eventStats.total}
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            )}
          </div>
          
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {eventStats.total > 0 ? Math.round((eventStats.checkedIn / eventStats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Check-in Rate</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {eventStats.checkedIn}
              </div>
              <div className="text-sm text-gray-600">Checked In</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {eventStats.failed}
              </div>
              <div className="text-sm text-gray-600">Failed Attempts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="manual">Manual Check-In</TabsTrigger>
          <TabsTrigger value="history">Check-In History</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Scan attendee QR codes for quick check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasCamera && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Camera access is required for QR code scanning. Please enable camera permissions.
                  </AlertDescription>
                </Alert>
              )}

              {hasCamera && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden max-w-md">
                      {isScanning ? (
                        <>
                          <video
                            ref={videoRef}
                            className="w-full h-auto"
                            playsInline
                            muted
                          />
                          <canvas
                            ref={canvasRef}
                            className="hidden"
                          />
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                            <div className="absolute inset-4 border border-blue-300 rounded opacity-50"></div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Camera not active</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    {!isScanning ? (
                      <Button onClick={startCamera} size="lg">
                        <Scan className="w-5 h-5 mr-2" />
                        Start Scanning
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline" size="lg">
                        <X className="w-5 h-5 mr-2" />
                        Stop Scanning
                      </Button>
                    )}
                  </div>

                  {loading && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 text-blue-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing check-in...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Check-In
              </CardTitle>
              <CardDescription>
                Enter ticket code or search for attendees manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manualCode">Ticket Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="manualCode"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter QR code or ticket ID"
                      onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                    />
                    <Button onClick={handleManualCheckIn} disabled={loading || !manualCode.trim()}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      {loading ? 'Processing...' : 'Check In'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Quick Check-In</h4>
                  {pendingAttendees.length > 0 ? (
                    <div className="space-y-2">
                      {pendingAttendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{attendee.name}</p>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {attendee.ticketType}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => processCheckIn(attendee.qrCode || attendee.ticketId)}
                            disabled={loading}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Check In
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No pending check-ins found</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Check-In History
              </CardTitle>
              <CardDescription>
                Recent check-in activity for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkInHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${entry.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {entry.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{entry.attendeeName}</p>
                        <p className="text-sm text-gray-600">{entry.ticketType}</p>
                        <p className="text-xs text-gray-500 font-mono">{entry.qrCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {entry.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entry.checkInTime.toLocaleDateString()}
                      </p>
                      <Badge 
                        variant={entry.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs mt-1"
                      >
                        {entry.status === 'success' ? 'Checked In' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}

                {checkInHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No check-ins recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-In Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scanResult?.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              Check-In {scanResult?.success ? 'Successful' : 'Failed'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className={scanResult?.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <AlertDescription className={scanResult?.success ? 'text-green-800' : 'text-red-800'}>
                {scanResult?.message}
              </AlertDescription>
            </Alert>

            {scanResult?.success && scanResult.attendeeName && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendee:</span>
                  <span className="font-medium">{scanResult.attendeeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ticket Type:</span>
                  <span className="font-medium">{scanResult.ticketType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Check-In Time:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowResultDialog(false);
                setScanResult(null);
                if (scanResult?.success && activeTab === 'scanner' && hasCamera) {
                  // Restart scanning for next attendee
                  setTimeout(startCamera, 1000);
                }
              }}
              className="w-full"
            >
              {scanResult?.success && activeTab === 'scanner' ? 'Scan Next' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}