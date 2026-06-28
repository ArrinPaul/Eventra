'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const startIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#22c55e;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const endIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface NavigationMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startName?: string;
  endName?: string;
  className?: string;
}

export default function NavigationMap({
  startLat,
  startLng,
  endLat,
  endLng,
  startName = 'Your Location',
  endName = 'Destination',
  className = '',
}: NavigationMapProps) {
  const center: [number, number] = [
    (startLat + endLat) / 2,
    (startLng + endLng) / 2,
  ];

  const distance = calculateDistance(startLat, startLng, endLat, endLng);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full rounded-xl"
        style={{ minHeight: '300px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[startLat, startLng]} icon={startIcon}>
          <Popup>{startName}</Popup>
        </Marker>
        <Marker position={[endLat, endLng]} icon={endIcon}>
          <Popup>{endName}</Popup>
        </Marker>
        <MapUpdater center={center} zoom={15} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <p className="text-xs font-bold text-gray-700">
          {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`} away
        </p>
      </div>
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
