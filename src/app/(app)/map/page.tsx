'use client';

import React from 'react';
import InteractiveCampusMap from '@/components/map/interactive-campus-map';

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Campus Navigation</h1>
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden h-[700px]">
        <InteractiveCampusMap />
      </div>
    </div>
  );
}
