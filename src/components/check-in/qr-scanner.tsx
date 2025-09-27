'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import QrScannerComponent from 'react-qr-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Video } from 'lucide-react';

type QrScannerProps = {
  onSuccess: (data: any) => void;
};

export default function QrScanner({ onSuccess }: QrScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (err) {
        console.error('Camera access denied:', err);
        setHasCameraPermission(false);
        setError('Camera permission is required to scan QR codes. Please enable it in your browser settings.');
      }
    };
    checkCameraPermission();
  }, []);

  const handleScan = (data: any) => {
    if (data) {
      try {
        const parsedData = JSON.parse(data.text);
        if (parsedData.registrationId && parsedData.name) {
          onSuccess(parsedData);
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'This does not seem to be a valid IPX Hub registration code.',
          });
        }
      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'Could not read the QR code.',
          });
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('An error occurred while scanning. Please try again.');
  };

  if (hasCameraPermission === null) {
      return <div className="flex justify-center items-center h-48">Checking camera permissions...</div>;
  }
  
  if (!hasCameraPermission) {
    return (
         <Alert variant="destructive">
            <Video className="h-4 w-4" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
                {error}
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="bg-muted rounded-lg overflow-hidden">
      <QrScannerComponent
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
        constraints={{
          video: { facingMode: 'environment' }
        }}
      />
    </div>
  );
}
