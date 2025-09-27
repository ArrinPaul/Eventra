'use client';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Check, X, QrCode } from "lucide-react";

export default function CheckInPage() {
    const { user, updateUser } = useAuth();
    
    if (!user) return null;

    const qrData = JSON.stringify({ registrationId: user.registrationId, name: user.name, id: user.id });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    const handleManualCheckIn = () => {
        updateUser({ ...user, checkedIn: true });
    };

    return (
        <div className="container py-8">
            <h1 className="text-4xl font-bold font-headline mb-4">Check-in</h1>
            <p className="text-muted-foreground mb-8">Present your QR code or registration ID at the check-in desk.</p>
            
            <div className="flex justify-center">
                <Card className="w-full max-w-md text-center interactive-element">
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
                        {!user.checkedIn && (
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
