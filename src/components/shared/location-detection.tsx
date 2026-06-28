'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, MapPin, Navigation, ArrowLeft, Loader2, Crosshair } from 'lucide-react';
import { CameraCapture } from './camera-capture';
import { ImageUploader } from './image-uploader';
import { CampusLocationSelector as LocationSelector } from './campus-location-selector';
import NavigationMap from './navigation-map';
import { getCurrentGPSPosition, getBestGPSMatch, isWithinCampusBounds } from '@/lib/gps-utils';
import { CAMPUS_LOCATIONS, CampusLocation } from '@/lib/campus-locations';
import { cn } from '@/core/utils/utils';

type DetectionState = 'detection' | 'destination' | 'navigation';

export function LocationDetection() {
  const [state, setState] = useState<DetectionState>('detection');
  const [currentLocation, setCurrentLocation] = useState<CampusLocation | null>(null);
  const [destination, setDestination] = useState<CampusLocation | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [method, setMethod] = useState<'camera' | 'upload' | 'gps'>('gps');

  const detectFromGPS = useCallback(async () => {
    setDetecting(true);
    setMethod('gps');
    try {
      const pos = await getCurrentGPSPosition();
      if (!isWithinCampusBounds(pos.lat, pos.lng)) {
        setGpsStatus('Outside campus bounds');
      }
      const match = getBestGPSMatch(pos.lat, pos.lng);
      if (match) {
        setCurrentLocation(match.location);
        setState('destination');
      } else {
        setGpsStatus('No nearby location found');
      }
    } catch (err) {
      setGpsStatus('GPS access denied');
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleCapture = useCallback(async (blob: Blob) => {
    setDetecting(true);
    setMethod('camera');
    try {
      const pos = await getCurrentGPSPosition().catch(() => null);
      if (pos) {
        const match = getBestGPSMatch(pos.lat, pos.lng);
        if (match) {
          setCurrentLocation(match.location);
          setState('destination');
        }
      }
      setGpsStatus('Camera capture received — AI prediction pending');
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setDetecting(true);
    setMethod('upload');
    try {
      const pos = await getCurrentGPSPosition().catch(() => null);
      if (pos) {
        const match = getBestGPSMatch(pos.lat, pos.lng);
        if (match) {
          setCurrentLocation(match.location);
          setState('destination');
        }
      }
      setGpsStatus('Image uploaded — AI prediction pending');
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleNavigate = () => {
    if (currentLocation && destination) {
      setState('navigation');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {state === 'detection' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Where are you?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Detect your current location on campus.
            </p>

            <Button onClick={detectFromGPS} disabled={detecting} className="w-full" variant="outline">
              {detecting && method === 'gps' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4 mr-2" />
              )}
              Use GPS Location
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <CameraCapture onCapture={handleCapture} disabled={detecting} />
            <ImageUploader onUpload={handleUpload} disabled={detecting} />

            {gpsStatus && (
              <p className="text-xs text-muted-foreground text-center">{gpsStatus}</p>
            )}
          </CardContent>
        </Card>
      )}

      {state === 'destination' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" /> Select Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentLocation && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">You are at</Badge>
                <span className="font-medium">{currentLocation.name}</span>
              </div>
            )}

            <LocationSelector
              value={destination?.id}
              onChange={(loc) => setDestination(loc)}
              label="Where do you want to go?"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setState('detection')} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={handleNavigate} disabled={!destination} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" /> Navigate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === 'navigation' && currentLocation && destination && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" /> Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline">{currentLocation.name}</Badge>
              <span>→</span>
              <Badge variant="default">{destination.name}</Badge>
            </div>

            <NavigationMap
              startLat={currentLocation.lat}
              startLng={currentLocation.lng}
              endLat={destination.lat}
              endLng={destination.lng}
              startName={currentLocation.name}
              endName={destination.name}
              className="h-[300px] rounded-xl overflow-hidden"
            />

            <Button variant="outline" onClick={() => setState('destination')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Change Destination
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
