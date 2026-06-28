'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Wifi, Brain, MapPin } from 'lucide-react';

interface GPSSettingsProps {
  gpsEnabled: boolean;
  aiEnabled: boolean;
  gpsWeight: number;
  aiWeight: number;
  onGpsEnabledChange: (v: boolean) => void;
  onAiEnabledChange: (v: boolean) => void;
  onGpsWeightChange: (v: number) => void;
  onAiWeightChange: (v: number) => void;
  gpsPermission?: 'granted' | 'denied' | 'prompt';
  onPermissionRequest?: () => void;
}

export function GPSSettings({
  gpsEnabled,
  aiEnabled,
  gpsWeight,
  aiWeight,
  onGpsEnabledChange,
  onAiEnabledChange,
  onGpsWeightChange,
  onAiWeightChange,
  gpsPermission,
  onPermissionRequest,
}: GPSSettingsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" /> Location Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-500" />
            <div>
              <Label className="text-sm">GPS</Label>
              <p className="text-[10px] text-muted-foreground">Use device location</p>
            </div>
          </div>
          <Switch checked={gpsEnabled} onCheckedChange={onGpsEnabledChange} />
        </div>

        {gpsEnabled && gpsPermission !== 'granted' && onPermissionRequest && (
          <button
            onClick={onPermissionRequest}
            className="text-xs text-primary underline"
          >
            Grant GPS permission
          </button>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <div>
              <Label className="text-sm">AI Prediction</Label>
              <p className="text-[10px] text-muted-foreground">Image-based location detection</p>
            </div>
          </div>
          <Switch checked={aiEnabled} onCheckedChange={onAiEnabledChange} />
        </div>

        {gpsEnabled && aiEnabled && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">GPS Weight</Label>
                <span className="text-xs font-medium">{gpsWeight}%</span>
              </div>
              <Slider
                value={[gpsWeight]}
                onValueChange={([v]) => {
                  onGpsWeightChange(v);
                  onAiWeightChange(100 - v);
                }}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">AI Weight</Label>
                <span className="text-xs font-medium">{aiWeight}%</span>
              </div>
              <Slider
                value={[aiWeight]}
                onValueChange={([v]) => {
                  onAiWeightChange(v);
                  onGpsWeightChange(100 - v);
                }}
                max={100}
                step={5}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
