'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';
import { CAMPUS_LOCATIONS, CampusLocation } from '@/lib/campus-locations';
import { cn } from '@/core/utils/utils';

interface CampusLocationSelectorProps {
  value?: string;
  onChange: (location: CampusLocation | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  showCoordinates?: boolean;
}

export function CampusLocationSelector({
  value,
  onChange,
  disabled = false,
  className,
  label = 'Campus Location',
  showCoordinates = false,
}: CampusLocationSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredLocations = CAMPUS_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase()) ||
    loc.description.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === value);

  const handleSelect = (locationId: string) => {
    const location = CAMPUS_LOCATIONS.find((loc) => loc.id === locationId);
    onChange(location || null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        {label}
      </Label>

      <Select value={value || ''} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Select campus location">
            {selectedLocation && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {selectedLocation.name}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          {filteredLocations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id} className="py-2">
              <div className="flex flex-col">
                <span className="font-medium">{loc.name}</span>
                <span className="text-xs text-muted-foreground">{loc.description}</span>
              </div>
            </SelectItem>
          ))}
          {filteredLocations.length === 0 && (
            <div className="py-2 px-4 text-sm text-muted-foreground">
              No locations found
            </div>
          )}
        </SelectContent>
      </Select>

      {showCoordinates && selectedLocation && (
        <p className="text-xs text-muted-foreground">
          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
