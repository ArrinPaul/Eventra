'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsActive(false);
  }, [stream]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
      setCapturing(false);
      stopCamera();
    }, 'image/jpeg', 0.85);
  }, [onCapture, stopCamera]);

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />

      {!isActive ? (
        <Button onClick={startCamera} disabled={disabled} className="w-full" variant="outline">
          <Camera className="h-4 w-4 mr-2" /> Open Camera
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover bg-black"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={capture} disabled={capturing} className="flex-1">
              {capturing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Capture
            </Button>
            <Button onClick={stopCamera} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
