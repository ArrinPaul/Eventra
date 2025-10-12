'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ticketingService } from '@/lib/firestore-services';
import { EventTicket, EventTicketing } from '@/types';

interface CheckInResult {
  success: boolean;
  ticket?: EventTicket;
  message: string;
  attendeeName?: string;
  ticketType?: string;
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
  const [activeTab, setActiveTab] = useState('scanner');
  const [checkInHistory, setCheckInHistory] = useState<any[]>([]);
  
  // Mock event data
  const [currentEvent] = useState<EventTicketing>({
    id: 'event1',
    title: 'Tech Summit 2024',
    description: 'Annual technology conference',
    startDate: new Date(),
    endDate: new Date(),
    location: 'Convention Center',
    type: 'conference',
    organizerId: 'org1',
    timezone: 'UTC+5:30',
    venue: {
      name: 'Convention Center',
      address: 'Tech City',
      capacity: 500
    },
    ticketTypes: [],
    totalCapacity: 500,
    currentAttendees: 125,
    waitlistEntries: [],
    ticketingAnalytics: {
      totalRevenue: 0,
      ticketsSold: 0,
      conversionRate: 0,
      refundRequests: 0,
      checkInRate: 0.75,
      popularTicketTypes: [],
      salesOverTime: [],
      demographics: {
        ageGroups: [],
        roles: [],
        companies: []
      }
    },
    discountCodes: [],
    checkInSettings: {
      enableQrCode: true,
      enableManualCheckIn: true,
      checkInWindow: { startMinutes: 60, endMinutes: 180 },
      requireConfirmation: true,
      sendConfirmationEmail: true
    },
    refundPolicy: {
      allowRefunds: true,
      refundDeadline: new Date(),
      refundPercentage: 85,
      processingFee: 50,
      refundableTicketTypes: []
    },
    eventOrganizer: {
      id: 'org1',
      name: 'TechEvents Pro',
      email: 'events@techpro.com',
      verificationStatus: 'verified'
    },
    attendees: [],
    tags: [],
    category: 'Technology',
    isPublic: true,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  useEffect(() => {
    checkCameraAccess();
    loadCheckInHistory();
    
    return () => {
      stopCamera();
    };
  }, []);

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

        // Mock QR code detection - in real implementation, use a QR code library
        // For demonstration, we'll simulate finding a QR code after a few seconds
        if (Math.random() < 0.1) { // 10% chance per scan
          const mockQrCode = 'QR_123456789';
          handleQrCodeDetected(mockQrCode);
          clearInterval(scanInterval);
        }
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
    setLoading(true);
    try {
      // Mock check-in processing
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock validation
      const isValidCode = code.startsWith('QR_') && code.length > 5;
      
      if (isValidCode) {
        const result: CheckInResult = {
          success: true,
          message: 'Check-in successful!',
          attendeeName: 'John Doe',
          ticketType: 'General Admission',
          ticket: {
            id: 'ticket1',
            eventId: currentEvent.id,
            userId: 'user1',
            ticketType: {
              id: '1',
              name: 'General Admission',
              description: 'Standard access',
              price: 2999,
              totalAvailable: 100,
              sold: 50,
              maxPerPerson: 4,
              saleStartDate: new Date(),
              saleEndDate: new Date(),
              benefits: ['Event access', 'Welcome kit'],
              color: '#3B82F6'
            },
            price: 2999,
            ticketStatus: 'confirmed',
            qrCode: code,
            purchaseDate: new Date(),
            checkInDate: new Date()
          }
        };
        
        // Add to history
        setCheckInHistory(prev => [{
          id: Date.now().toString(),
          attendeeName: result.attendeeName,
          ticketType: result.ticketType,
          checkInTime: new Date(),
          qrCode: code,
          status: 'success'
        }, ...prev]);
        
        setScanResult(result);
      } else {
        setScanResult({
          success: false,
          message: 'Invalid QR code. Please try again.'
        });
      }
      
      setShowResultDialog(true);
    } catch (error) {
      console.error('Error processing check-in:', error);
      setScanResult({
        success: false,
        message: 'Check-in failed. Please try again.'
      });
      setShowResultDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = () => {
    if (!manualCode.trim()) return;
    processCheckIn(manualCode);
    setManualCode('');
  };

  const loadCheckInHistory = () => {
    // Mock check-in history
    const mockHistory = [
      {
        id: '1',
        attendeeName: 'Alice Johnson',
        ticketType: 'VIP Pass',
        checkInTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        qrCode: 'QR_987654321',
        status: 'success'
      },
      {
        id: '2',
        attendeeName: 'Bob Smith',
        ticketType: 'General Admission',
        checkInTime: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        qrCode: 'QR_456789123',
        status: 'success'
      },
      {
        id: '3',
        attendeeName: 'Carol Davis',
        ticketType: 'Early Bird',
        checkInTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        qrCode: 'QR_789123456',
        status: 'failed'
      }
    ];
    setCheckInHistory(mockHistory);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Check-In</h1>
        <p className="text-gray-600">Scan QR codes or manually check in attendees</p>
      </div>

      {/* Event Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{currentEvent.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {currentEvent.startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {currentEvent.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {currentEvent.currentAttendees} / {currentEvent.totalCapacity}
                </div>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
          
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(currentEvent.ticketingAnalytics.checkInRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Check-in Rate</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {checkInHistory.filter(h => h.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Checked In Today</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {checkInHistory.filter(h => h.status === 'failed').length}
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
                  <div className="space-y-2">
                    {[
                      { name: 'Alice Johnson', email: 'alice@example.com', ticketType: 'VIP Pass', code: 'QR_ALICE123' },
                      { name: 'Bob Smith', email: 'bob@example.com', ticketType: 'General', code: 'QR_BOB456' },
                      { name: 'Carol Davis', email: 'carol@example.com', ticketType: 'Early Bird', code: 'QR_CAROL789' }
                    ].map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{attendee.name}</p>
                          <p className="text-sm text-gray-600">{attendee.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {attendee.ticketType}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => processCheckIn(attendee.code)}
                          disabled={loading}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Check In
                        </Button>
                      </div>
                    ))}
                  </div>
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