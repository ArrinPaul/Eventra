'use client';

import { use, useState, useEffect } from 'react';
import { getEventMap, type MapEdge } from '@/app/actions/event-maps';
import { EventMapEditor } from '@/features/map/event-map-editor';
import { Loader2 } from 'lucide-react';

interface ExistingMap {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  edges: MapEdge[];
  nodes: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    x: number;
    y: number;
    icon: string;
    color: string;
  }>;
}

export default function EditMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [map, setMap] = useState<ExistingMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventMap(id).then((m) => {
      if (m) {
        setMap({
          imageUrl: m.imageUrl,
          imageWidth: m.imageWidth,
          imageHeight: m.imageHeight,
          edges: Array.isArray(m.edges) ? (m.edges as MapEdge[]) : [],
          nodes: m.nodes.map(n => ({
            id: n.id,
            name: n.name,
            description: n.description || null,
            category: n.category || 'location',
            x: typeof n.x === 'string' ? parseFloat(n.x) : n.x,
            y: typeof n.y === 'string' ? parseFloat(n.y) : n.y,
            icon: n.icon || 'L',
            color: n.color || '#6366f1',
          })),
        });
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[700px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Event Map</h1>
        <p className="text-muted-foreground">
          Upload a floor plan, place nodes, and connect them to create a navigable map
        </p>
      </div>

      <EventMapEditor eventId={id} existingMap={map} />
    </div>
  );
}
