'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, Users, Calendar, ChevronRight, 
  Search, Filter, X, Compass, ZoomIn, ZoomOut, Locate,
  Building2, BookOpen, FlaskConical, Coffee, TreePine, 
  GraduationCap, Dumbbell, Car, Info, Route, AlertCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import InteractiveCampusMap from './interactive-campus-map';
import { CampusZone, MapEvent, PathNode, CAMPUS_ZONES, findPath } from './map-data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default function CampusMapClient() {
  const [selectedZone, setSelectedZone] = useState<CampusZone | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showDirections, setShowDirections] = useState(false);
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<PathNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapEvents, setMapEvents] = useState<MapEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Load events from Firestore
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const now = new Date();
        const q = query(
          eventsRef,
          where('startTime', '>=', Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))),
          where('startTime', '<=', Timestamp.fromDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)))
        );
        
        const snapshot = await getDocs(q);
        const events: MapEvent[] = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // Map venue/location to zone ID
            const zoneId = mapVenueToZone(data.venue || data.location || '');
            if (!zoneId) return null;
            
            return {
              id: doc.id,
              title: data.title,
              zoneId,
              startTime: data.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
              endTime: data.endTime?.toDate?.()?.toISOString() || new Date().toISOString(),
              category: data.category || 'Event',
              attendees: data.registeredCount || 0,
              description: data.description,
            };
          })
          .filter((e): e is MapEvent => e !== null);
        
        setMapEvents(events);
      } catch (error) {
        console.error('Error loading map events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  // Helper to map venue names to zone IDs
  const mapVenueToZone = (venue: string): string | null => {
    const venueLower = venue.toLowerCase();
    if (venueLower.includes('library')) return 'library';
    if (venueLower.includes('lab') || venueLower.includes('computer')) return 'computer-lab';
    if (venueLower.includes('chemistry')) return 'chemistry-lab';
    if (venueLower.includes('hall') || venueLower.includes('auditorium')) return 'main-hall';
    if (venueLower.includes('tech') || venueLower.includes('hub')) return 'tech-hub';
    if (venueLower.includes('sport') || venueLower.includes('gym')) return 'sports-complex';
    if (venueLower.includes('cafe') || venueLower.includes('dining')) return 'dining-hall';
    if (venueLower.includes('plaza') || venueLower.includes('outdoor')) return 'central-plaza';
    if (venueLower.includes('admin')) return 'admin-building';
    // Default to main hall for events without clear venue mapping
    return 'main-hall';
  };

  // Filter zones based on search and category
  const filteredZones = useMemo(() => {
    return CAMPUS_ZONES.filter(zone => {
      const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || zone.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  // Get events for selected zone
  const zoneEvents = useMemo(() => {
    if (!selectedZone) return [];
    return mapEvents.filter(event => event.zoneId === selectedZone.id);
  }, [selectedZone, mapEvents]);

  // Get all live events
  const liveEvents = useMemo(() => {
    const now = new Date();
    return mapEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return now >= eventStart && now <= eventEnd;
    });
  }, [mapEvents]);

  // Calculate path when start and end locations change
  useEffect(() => {
    if (startLocation && endLocation && startLocation !== endLocation) {
      const path = findPath(startLocation, endLocation);
      setCurrentPath(path);
    } else {
      setCurrentPath([]);
    }
  }, [startLocation, endLocation]);

  // Simulate user location detection
  const handleLocateUser = useCallback(() => {
    setIsLocating(true);
    // Simulate geolocation - in real app, use actual GPS
    setTimeout(() => {
      setUserLocation('main-entrance');
      setStartLocation('main-entrance');
      setIsLocating(false);
    }, 1500);
  }, []);

  const handleZoneClick = useCallback((zone: CampusZone) => {
    setSelectedZone(zone);
    setSelectedEvent(null);
  }, []);

  const handleEventClick = useCallback((event: MapEvent) => {
    setSelectedEvent(event);
    const zone = CAMPUS_ZONES.find(z => z.id === event.zoneId);
    if (zone) setSelectedZone(zone);
  }, []);

  const handleGetDirections = useCallback((zoneId: string) => {
    setEndLocation(zoneId);
    setShowDirections(true);
    if (userLocation) {
      setStartLocation(userLocation);
    }
  }, [userLocation]);

  const categories = [
    { id: 'all', label: 'All', icon: MapPin },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'lab', label: 'Labs', icon: FlaskConical },
    { id: 'sports', label: 'Sports', icon: Dumbbell },
    { id: 'dining', label: 'Dining', icon: Coffee },
    { id: 'outdoor', label: 'Outdoor', icon: TreePine },
    { id: 'parking', label: 'Parking', icon: Car },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Compass className="h-6 w-6 text-primary" />
                  Campus Map
                </h1>
                <p className="text-muted-foreground text-sm">
                  Interactive map with live events and directions
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px] lg:w-[300px]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Locate Me Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={userLocation ? "default" : "outline"}
                      size="icon"
                      onClick={handleLocateUser}
                      disabled={isLocating}
                    >
                      {isLocating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Locate className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Locate className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {userLocation ? 'Location detected' : 'Detect my location'}
                  </TooltipContent>
                </Tooltip>

                {/* Directions Sheet */}
                <Sheet open={showDirections} onOpenChange={setShowDirections}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Navigation className="h-4 w-4" />
                      <span className="hidden sm:inline">Directions</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5 text-primary" />
                        Get Directions
                      </SheetTitle>
                    </SheetHeader>
                    <DirectionsPanel
                      startLocation={startLocation}
                      endLocation={endLocation}
                      setStartLocation={setStartLocation}
                      setEndLocation={setEndLocation}
                      currentPath={currentPath}
                      userLocation={userLocation}
                      onLocateUser={handleLocateUser}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Category Filters */}
            <ScrollArea className="w-full mt-4">
              <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={activeFilter === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(cat.id)}
                    className="gap-2 whitespace-nowrap"
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            {/* Map Container */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setZoom(z => Math.min(z + 0.25, 2))}
                        disabled={zoom >= 2}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Zoom In</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                        disabled={zoom <= 0.5}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Zoom Out</TooltipContent>
                  </Tooltip>
                  <div className="text-xs text-center text-muted-foreground bg-secondary rounded px-2 py-1">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>

                {/* Live Events Badge */}
                {liveEvents.length > 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge variant="destructive" className="animate-pulse gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      {liveEvents.length} Live Event{liveEvents.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                {/* Interactive SVG Map */}
                <InteractiveCampusMap
                  zones={filteredZones}
                  events={mapEvents}
                  selectedZone={selectedZone}
                  selectedEvent={selectedEvent}
                  currentPath={currentPath}
                  userLocation={userLocation}
                  zoom={zoom}
                  onZoneClick={handleZoneClick}
                  onEventClick={handleEventClick}
                />
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selected Zone/Event Details */}
              <AnimatePresence mode="wait">
                {selectedZone && (
                  <motion.div
                    key={selectedZone.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ZoneDetailsCard
                      zone={selectedZone}
                      events={zoneEvents}
                      selectedEvent={selectedEvent}
                      onEventClick={handleEventClick}
                      onGetDirections={handleGetDirections}
                      onClose={() => {
                        setSelectedZone(null);
                        setSelectedEvent(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Locations List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Locations
                  </CardTitle>
                  <CardDescription>
                    {filteredZones.length} location{filteredZones.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {filteredZones.map(zone => (
                        <LocationCard
                          key={zone.id}
                          zone={zone}
                          isSelected={selectedZone?.id === zone.id}
                          hasLiveEvent={liveEvents.some(e => e.zoneId === zone.id)}
                          onClick={() => handleZoneClick(zone)}
                        />
                      ))}
                      {filteredZones.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No locations match your search</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Location Card Component
interface LocationCardProps {
  zone: CampusZone;
  isSelected: boolean;
  hasLiveEvent: boolean;
  onClick: () => void;
}

function LocationCard({ zone, isSelected, hasLiveEvent, onClick }: LocationCardProps) {
  const Icon = getCategoryIcon(zone.category);
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        isSelected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{zone.name}</span>
            {hasLiveEvent && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{zone.description}</p>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isSelected && "rotate-90"
        )} />
      </div>
    </motion.button>
  );
}

// Zone Details Card Component
interface ZoneDetailsCardProps {
  zone: CampusZone;
  events: MapEvent[];
  selectedEvent: MapEvent | null;
  onEventClick: (event: MapEvent) => void;
  onGetDirections: (zoneId: string) => void;
  onClose: () => void;
}

function ZoneDetailsCard({ zone, events, selectedEvent, onEventClick, onGetDirections, onClose }: ZoneDetailsCardProps) {
  const Icon = getCategoryIcon(zone.category);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{zone.name}</CardTitle>
              <CardDescription>{zone.description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Floor {zone.floor || 'Ground'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Capacity: {zone.capacity || 'N/A'}</span>
          </div>
        </div>

        {/* Amenities */}
        {zone.amenities && zone.amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {zone.amenities.map(amenity => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Get Directions Button */}
        <Button 
          className="w-full gap-2" 
          onClick={() => onGetDirections(zone.id)}
        >
          <Navigation className="h-4 w-4" />
          Get Directions
        </Button>

        {/* Events at this location */}
        {events.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events at this location
            </p>
            <div className="space-y-2">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Event Card Component
interface EventCardProps {
  event: MapEvent;
  isSelected: boolean;
  onClick: () => void;
}

function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const isLive = isEventLive(event);
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{event.title}</span>
            {isLive && (
              <Badge variant="destructive" className="text-xs py-0">LIVE</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatEventTime(event)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.attendees}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {event.category}
        </Badge>
      </div>
    </motion.button>
  );
}

// Directions Panel Component
interface DirectionsPanelProps {
  startLocation: string;
  endLocation: string;
  setStartLocation: (loc: string) => void;
  setEndLocation: (loc: string) => void;
  currentPath: PathNode[];
  userLocation: string | null;
  onLocateUser: () => void;
}

function DirectionsPanel({
  startLocation,
  endLocation,
  setStartLocation,
  setEndLocation,
  currentPath,
  userLocation,
  onLocateUser,
}: DirectionsPanelProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* Start Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">From</label>
        <div className="flex gap-2">
          <select
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select start location</option>
            {CAMPUS_ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onLocateUser}
              >
                <Locate className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use my location</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* End Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">To</label>
        <select
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select destination</option>
          {CAMPUS_ZONES.map(zone => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>
      </div>

      {/* Swap Button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => {
          const temp = startLocation;
          setStartLocation(endLocation);
          setEndLocation(temp);
        }}
        disabled={!startLocation || !endLocation}
      >
        <Route className="h-4 w-4" />
        Swap Locations
      </Button>

      {/* Path Instructions */}
      {currentPath.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Directions</h4>
            <Badge variant="secondary">
              ~{currentPath.reduce((acc, node, i) => {
                if (i === 0) return 0;
                return acc + (node.distance || 0);
              }, 0)} meters
            </Badge>
          </div>
          <div className="space-y-3">
            {currentPath.map((node, index) => (
              <div key={node.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    index === 0 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                      : index === currentPath.length - 1
                        ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  {index < currentPath.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-sm">{node.name}</p>
                  {node.instruction && (
                    <p className="text-xs text-muted-foreground">{node.instruction}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Path Selected */}
      {(!startLocation || !endLocation) && (
        <div className="text-center py-8 text-muted-foreground">
          <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select start and destination to see directions</p>
        </div>
      )}
    </div>
  );
}

// Helper Functions
function getCategoryIcon(category: string) {
  const icons: Record<string, React.FC<{ className?: string }>> = {
    academic: GraduationCap,
    library: BookOpen,
    lab: FlaskConical,
    sports: Dumbbell,
    dining: Coffee,
    outdoor: TreePine,
    parking: Car,
    admin: Building2,
  };
  return icons[category] || Building2;
}

function isEventLive(event: MapEvent): boolean {
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  return now >= start && now <= end;
}

function formatEventTime(event: MapEvent): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
