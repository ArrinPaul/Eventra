import { getEventMap } from '@/app/actions/event-maps';
import { EventMapViewer } from '@/features/map/event-map-viewer';
import InteractiveCampusMap from '@/features/map/interactive-campus-map';
import { CAMPUS_ZONES, SAMPLE_EVENTS } from '@/features/map/map-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export default async function EventMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const map = await getEventMap(id);

  if (!map) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Event Map</h1>
            <p className="text-muted-foreground">
              No custom map configured for this event
            </p>
          </div>
          <Link href={`/events/${id}/map/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Create Map
            </Button>
          </Link>
        </div>

        {/* Fallback to hardcoded campus map */}
        <div className="rounded-xl border overflow-hidden">
          <InteractiveCampusMap
            zones={CAMPUS_ZONES}
            events={SAMPLE_EVENTS}
            selectedZone={null}
            selectedEvent={null}
            currentPath={[]}
            userLocation={null}
            zoom={1}
            onZoneClick={() => {}}
            onEventClick={() => {}}
          />
        </div>
      </div>
    );
  }

  const typedNodes = map.nodes.map(n => ({
    id: n.id,
    name: n.name,
    description: n.description || null,
    category: n.category || 'location',
    x: typeof n.x === 'string' ? parseFloat(n.x) : n.x,
    y: typeof n.y === 'string' ? parseFloat(n.y) : n.y,
    icon: n.icon || 'L',
    color: n.color || '#6366f1',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Map</h1>
          <p className="text-muted-foreground">
            Click a node to start, then click another to navigate
          </p>
        </div>
        <Link href={`/events/${id}/map/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Map
          </Button>
        </Link>
      </div>

      <EventMapViewer
        map={{
          imageUrl: map.imageUrl,
          imageWidth: map.imageWidth,
          imageHeight: map.imageHeight,
          edges: Array.isArray(map.edges) ? (map.edges as Array<{ from: string; to: string }>) : [],
          nodes: typedNodes,
        }}
      />
    </div>
  );
}
