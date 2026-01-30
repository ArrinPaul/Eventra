'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User } from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { CampusZone, MapEvent, PathNode, getZoneCenter, hasLiveEvents } from './map-data';

interface InteractiveCampusMapProps {
  zones: CampusZone[];
  events: MapEvent[];
  selectedZone: CampusZone | null;
  selectedEvent: MapEvent | null;
  currentPath: PathNode[];
  userLocation: string | null;
  zoom: number;
  onZoneClick: (zone: CampusZone) => void;
  onEventClick: (event: MapEvent) => void;
}

export default function InteractiveCampusMap({
  zones,
  events,
  selectedZone,
  selectedEvent,
  currentPath,
  userLocation,
  zoom,
  onZoneClick,
  onEventClick,
}: InteractiveCampusMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Get live events for a zone
  const getZoneLiveEvents = (zoneId: string) => {
    const now = new Date();
    return events.filter(event => {
      if (event.zoneId !== zoneId) return false;
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return now >= start && now <= end;
    });
  };

  // Generate path d attribute for route visualization
  const generatePathD = () => {
    if (currentPath.length < 2) return '';
    
    let d = `M ${currentPath[0].x} ${currentPath[0].y}`;
    
    for (let i = 1; i < currentPath.length; i++) {
      const prev = currentPath[i - 1];
      const curr = currentPath[i];
      
      // Use quadratic bezier for smoother path
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      
      if (i === 1) {
        d += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
      } else {
        d += ` T ${curr.x} ${curr.y}`;
      }
    }
    
    return d;
  };

  return (
    <div 
      className="relative w-full h-[600px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center',
        }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
          </pattern>
          
          {/* Glow filter for selected items */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated dash for path */}
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        <rect width="800" height="600" fill="url(#grid)" />
        
        {/* Roads/Paths Background */}
        <g className="roads">
          {/* Vertical main road */}
          <rect x="420" y="0" width="40" height="600" fill="currentColor" className="text-slate-300 dark:text-slate-700" rx="4" />
          {/* Horizontal main road */}
          <rect x="0" y="340" width="800" height="40" fill="currentColor" className="text-slate-300 dark:text-slate-700" rx="4" />
          {/* Cross road */}
          <rect x="200" y="140" width="400" height="30" fill="currentColor" className="text-slate-300 dark:text-slate-700" rx="4" />
        </g>

        {/* Campus Boundary */}
        <rect 
          x="60" 
          y="60" 
          width="700" 
          height="500" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeDasharray="10 5"
          className="text-slate-400 dark:text-slate-600"
          rx="20"
        />

        {/* Zone Buildings */}
        {zones.map(zone => {
          const isSelected = selectedZone?.id === zone.id;
          const isHovered = hoveredZone === zone.id;
          const liveEvents = getZoneLiveEvents(zone.id);
          const hasLive = liveEvents.length > 0;
          
          return (
            <g key={zone.id}>
              {/* Building Shadow */}
              <rect
                x={zone.coordinates.x + 4}
                y={zone.coordinates.y + 4}
                width={zone.coordinates.width}
                height={zone.coordinates.height}
                fill="rgba(0,0,0,0.1)"
                rx="8"
              />
              
              {/* Building */}
              <motion.rect
                x={zone.coordinates.x}
                y={zone.coordinates.y}
                width={zone.coordinates.width}
                height={zone.coordinates.height}
                fill={zone.color}
                fillOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.7}
                stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff80' : 'transparent'}
                strokeWidth={isSelected ? 3 : 2}
                rx="8"
                className="cursor-pointer transition-all"
                filter={isSelected ? 'url(#glow)' : undefined}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onZoneClick(zone);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Zone Name */}
              <text
                x={zone.coordinates.x + zone.coordinates.width / 2}
                y={zone.coordinates.y + zone.coordinates.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-medium fill-white pointer-events-none select-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {zone.name.length > 15 ? zone.name.substring(0, 12) + '...' : zone.name}
              </text>

              {/* Live Event Indicator */}
              {hasLive && (
                <g>
                  <circle
                    cx={zone.coordinates.x + zone.coordinates.width - 8}
                    cy={zone.coordinates.y + 8}
                    r="8"
                    fill="#ef4444"
                    className="animate-pulse"
                  />
                  <text
                    x={zone.coordinates.x + zone.coordinates.width - 8}
                    y={zone.coordinates.y + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[8px] font-bold fill-white pointer-events-none"
                  >
                    {liveEvents.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Event Pins */}
        {events.map(event => {
          const zone = zones.find(z => z.id === event.zoneId);
          if (!zone) return null;
          
          const isLive = (() => {
            const now = new Date();
            const start = new Date(event.startTime);
            const end = new Date(event.endTime);
            return now >= start && now <= end;
          })();
          
          const isSelected = selectedEvent?.id === event.id;
          const center = getZoneCenter(zone);
          
          // Offset pins slightly for multiple events in same zone
          const sameZoneEvents = events.filter(e => e.zoneId === event.zoneId);
          const eventIndex = sameZoneEvents.indexOf(event);
          const offsetX = (eventIndex % 3 - 1) * 15;
          const offsetY = Math.floor(eventIndex / 3) * 15 - 25;
          
          return (
            <motion.g
              key={event.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * eventIndex }}
              className="cursor-pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEventClick(event);
              }}
            >
              {/* Pin */}
              <motion.g
                transform={`translate(${center.x + offsetX}, ${center.y + offsetY})`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Pin shadow */}
                <ellipse cx="0" cy="12" rx="6" ry="3" fill="rgba(0,0,0,0.2)" />
                
                {/* Pin body */}
                <path
                  d="M0,-12 C-8,-12 -12,-4 -12,0 C-12,8 0,16 0,16 C0,16 12,8 12,0 C12,-4 8,-12 0,-12"
                  fill={isLive ? '#ef4444' : isSelected ? '#3b82f6' : '#6b7280'}
                  stroke="#fff"
                  strokeWidth="2"
                />
                
                {/* Pin inner circle */}
                <circle cx="0" cy="-2" r="4" fill="#fff" />
                
                {/* Live pulse */}
                {isLive && (
                  <circle cx="0" cy="-2" r="6" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping opacity-75" />
                )}
              </motion.g>
            </motion.g>
          );
        })}

        {/* Navigation Path */}
        {currentPath.length >= 2 && (
          <g className="navigation-path">
            {/* Path background */}
            <motion.path
              d={generatePathD()}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* Animated path */}
            <motion.path
              d={generatePathD()}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="10 10"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* Path nodes */}
            {currentPath.map((node, index) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={index === 0 || index === currentPath.length - 1 ? 12 : 6}
                  fill={
                    index === 0 ? '#22c55e' :
                    index === currentPath.length - 1 ? '#ef4444' :
                    '#3b82f6'
                  }
                  stroke="#fff"
                  strokeWidth="3"
                />
                {(index === 0 || index === currentPath.length - 1) && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold fill-white pointer-events-none"
                  >
                    {index === 0 ? 'A' : 'B'}
                  </text>
                )}
              </g>
            ))}
          </g>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <g>
            {(() => {
              const zone = zones.find(z => z.id === userLocation);
              if (!zone) return null;
              const center = getZoneCenter(zone);
              
              return (
                <>
                  {/* Pulsing circle */}
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="20"
                    fill="#3b82f6"
                    opacity="0.2"
                    className="animate-ping"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="14"
                    fill="#3b82f6"
                    opacity="0.4"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="8"
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth="3"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="3"
                    fill="#fff"
                  />
                </>
              );
            })()}
          </g>
        )}

        {/* Compass */}
        <g transform="translate(750, 50)">
          <circle r="25" fill="currentColor" className="text-white dark:text-slate-800" stroke="currentColor" strokeWidth="2" />
          <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-bold fill-red-500">N</text>
          <text x="0" y="14" textAnchor="middle" className="text-[8px] fill-slate-400">S</text>
          <text x="-10" y="3" textAnchor="middle" className="text-[8px] fill-slate-400">W</text>
          <text x="10" y="3" textAnchor="middle" className="text-[8px] fill-slate-400">E</text>
          <path d="M0,-18 L3,-8 L0,-10 L-3,-8 Z" fill="#ef4444" />
          <path d="M0,18 L3,8 L0,10 L-3,8 Z" fill="#94a3b8" />
        </g>

        {/* Scale */}
        <g transform="translate(60, 560)">
          <rect width="100" height="4" fill="currentColor" className="text-slate-600 dark:text-slate-400" />
          <rect width="50" height="4" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
          <text x="0" y="16" className="text-[10px] fill-slate-500">0</text>
          <text x="50" y="16" className="text-[10px] fill-slate-500">50m</text>
          <text x="100" y="16" className="text-[10px] fill-slate-500">100m</text>
        </g>

        {/* Legend */}
        <g transform="translate(60, 80)">
          <rect x="-10" y="-15" width="100" height="90" fill="currentColor" className="text-white/80 dark:text-slate-800/80" rx="8" />
          <text x="0" y="0" className="text-[10px] font-medium fill-slate-700 dark:fill-slate-300">Legend</text>
          
          <circle cx="5" cy="18" r="4" fill="#22c55e" />
          <text x="15" y="21" className="text-[9px] fill-slate-600 dark:fill-slate-400">Outdoor</text>
          
          <circle cx="5" cy="34" r="4" fill="#f59e0b" />
          <text x="15" y="37" className="text-[9px] fill-slate-600 dark:fill-slate-400">Academic</text>
          
          <circle cx="5" cy="50" r="4" fill="#8b5cf6" />
          <text x="15" y="53" className="text-[9px] fill-slate-600 dark:fill-slate-400">Library</text>
          
          <circle cx="5" cy="66" r="4" fill="#ef4444" />
          <text x="15" y="69" className="text-[9px] fill-slate-600 dark:fill-slate-400">Live Event</text>
        </g>
      </svg>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredZone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg pointer-events-none"
          >
            {(() => {
              const zone = zones.find(z => z.id === hoveredZone);
              if (!zone) return null;
              const liveEvents = getZoneLiveEvents(zone.id);
              
              return (
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.description}</p>
                  {liveEvents.length > 0 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      {liveEvents.length} live event{liveEvents.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
