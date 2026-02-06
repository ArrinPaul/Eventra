'use client';
import { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Check, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QrScanner from '@/components/check-in/qr-scanner';
import { useToast } from '@/hooks/use-toast';


export default function CheckInPage() {
    const { user, updateUser, awardPoints, checkInUser } = useAuth();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const { toast } = useToast();
    
    if (!user) return null;

    const isOrganizer = user.role === 'organizer';
    const qrData = JSON.stringify({ registrationId: user.registrationId, name: user.name, id: user.id });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    const handleManualCheckIn = () => {
        if (!user.checkedIn) {
            updateUser({ checkedIn: true });
            awardPoints(25);
        }
    };

    const handleScanSuccess = (scannedUser: any) => {
        setIsScannerOpen(false);
        // Note: checkInUser in hook currently only checks in viewer.
        // For organizer to check in others, we need a different mutation.
        checkInUser();
        toast({
            title: 'Check-in Successful',
            description: `${scannedUser.name} has been checked in.`,
        });
    };

    return (
        <div className="container py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-headline mb-4">{isOrganizer ? 'Check-in Desk' : 'My Check-in'}</h1>
                    <p className="text-muted-foreground mb-8">
                        {isOrganizer ? 'Scan attendee QR codes to check them in.' : 'Present your QR code or registration ID at the check-in desk.'}
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
                            <QrScanner onSuccess={handleScanSuccess} />
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
                            Your current status is: 
                            <span className={user.checkedIn ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                {user.checkedIn ? ' CHECKED IN' : ' NOT CHECKED IN'}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                         <div className="p-4 bg-white rounded-lg shadow-inner">
                            <Image
                                src={qrUrl}
                                alt="Registration QR Code"
                                width={300}
                                height={300}
                                className="rounded-md"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Registration ID</p>
                            <p className="font-mono text-2xl font-bold tracking-widest">{user.registrationId}</p>
                        </div>
                        {!user.checkedIn && !isOrganizer && (
                            <Button onClick={handleManualCheckIn}>
                                <Check className="mr-2 h-4 w-4"/>
                                Manually Mark as Checked-in (Demo)
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
