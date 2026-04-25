'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { getUserRegistrations } from '@/app/actions/registrations';


export default function CheckInPage() {
    const { user } = useAuth();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const { toast } = useToast();
    const [myTickets, setMyTickets] = useState<any[]>([]);

    useEffect(() => {
        getUserRegistrations().then((regs) => {
            setMyTickets(regs.map((r) => ({ ...r.ticket, event: r.event })));
        });
    }, []);
    
    if (!user) return null;

    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
    
    const firstTicket = myTickets[0];
    const qrData = firstTicket?.qrCode ?? firstTicket?.ticketNumber ?? user?.id ?? 'NO-TICKET';
    
    const handleScanSuccess = (scannedData: any) => {
        setIsScannerOpen(false);
        toast({
            title: 'Scan Captured',
            description: `Scanned: ${typeof scannedData === 'string' ? scannedData : scannedData?.name ?? 'Unknown'}. Use the Check-in Scanner page for full processing.`,
        });
    };

    return (
        <div className="container py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline mb-4">{isOrganizer ? 'Check-in Desk' : 'My Check-in'}</h1>
                    <p className="text-muted-foreground mb-8">
                        {isOrganizer ? 'Scan attendee QR codes to check them in.' : 'Present your QR code at the check-in desk.'}
                    </p>
                </div>
                {isOrganizer && (
                    <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <QrCode className="mr-2 h-4 w-4" /> Scan Attendee QR Code
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Scan QR Code</DialogTitle>
                            </DialogHeader>
                            <div className="p-4 text-center text-gray-500">
                                QR Scanner Component - To be implemented
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            
            <div className="flex justify-center">
                <Card className="w-full max-w-md text-center glass-effect">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center justify-center gap-2">
                            <QrCode /> Your Check-in Code
                        </CardTitle>
                        <CardDescription>
                            {firstTicket ? (
                                <>
                                    Status:{' '}
                                    <span className={firstTicket.status === 'checked-in' ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                                        {firstTicket.status === 'checked-in' ? ' CHECKED IN' : ' NOT CHECKED IN'}
                                    </span>
                                </>
                            ) : (
                                <span className="text-muted-foreground">No tickets found. Register for an event first.</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                         <div className="p-4 bg-white rounded-lg shadow-inner">
                            <QRCodeSVG
                                value={qrData}
                                size={300}
                                className="rounded-md"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Ticket Number</p>
                            <p className="font-mono text-2xl font-bold tracking-widest">{qrData}</p>
                        </div>
                        {firstTicket?.event && (
                            <div className="text-sm text-muted-foreground">
                                Event: <span className="font-medium text-foreground">{firstTicket.event.title}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


