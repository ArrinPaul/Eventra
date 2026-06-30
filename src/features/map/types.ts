export type NodeCategory =
  | 'location' | 'stage' | 'booth' | 'restroom'
  | 'entrance' | 'exit' | 'food' | 'info'
  | 'workshop' | 'vip';

export interface DynamicMapNode {
  id: string;
  mapId?: string;
  name: string;
  description: string | null;
  category: NodeCategory;
  x: number;  // percentage 0-100
  y: number;
  icon: string;
  color: string;
}

export interface DynamicMapEdge {
  from: string; // node id
  to: string;   // node id
}

export interface DynamicEventMap {
  id: string;
  eventId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  edges: DynamicMapEdge[];
  nodes: DynamicMapNode[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PixelNode extends DynamicMapNode {
  px: number;
  py: number;
}

export function toPixelNodes(
  nodes: DynamicMapNode[],
  containerWidth: number,
  containerHeight: number
): PixelNode[] {
  return nodes.map(n => ({
    ...n,
    px: (n.x / 100) * containerWidth,
    py: (n.y / 100) * containerHeight,
  }));
}
