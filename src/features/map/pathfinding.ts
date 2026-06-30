import { DynamicMapNode, DynamicMapEdge } from './types';

export interface PathStep {
  nodeId: string;
  name: string;
  x: number;   // percentage
  y: number;
  instruction: string;
  distance: number;
}

function buildAdjacency(edges: DynamicMapEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);
    adj.get(edge.from)!.push(edge.to);
    adj.get(edge.to)!.push(edge.from);
  }
  return adj;
}

export function findDynamicPath(
  startId: string,
  endId: string,
  nodes: DynamicMapNode[],
  edges: DynamicMapEdge[]
): PathStep[] {
  if (startId === endId) return [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildAdjacency(edges);
  const start = nodeMap.get(startId);
  const end = nodeMap.get(endId);
  if (!start || !end) return [];

  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];

    if (currentId === endId) {
      return buildPathSteps(path, nodeMap);
    }

    for (const neighborId of adj.get(currentId) || []) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...path, neighborId]);
      }
    }
  }

  return [];
}

function buildPathSteps(
  pathIds: string[],
  nodeMap: Map<string, DynamicMapNode>
): PathStep[] {
  return pathIds.map((id, index) => {
    const node = nodeMap.get(id)!;
    const nextNode = index < pathIds.length - 1 ? nodeMap.get(pathIds[index + 1]) : null;

    let instruction = '';
    if (index === 0) {
      instruction = 'Start here';
    } else if (index === pathIds.length - 1) {
      instruction = 'You have arrived';
    } else if (nextNode) {
      const dx = nextNode.x - node.x;
      const dy = nextNode.y - node.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        instruction = dx > 0 ? `Head right toward ${nextNode.name}` : `Head left toward ${nextNode.name}`;
      } else {
        instruction = dy > 0 ? `Head down toward ${nextNode.name}` : `Head up toward ${nextNode.name}`;
      }
    }

    const distance = nextNode
      ? Math.round(Math.sqrt(
          Math.pow((nextNode.x - node.x) * 10, 2) +
          Math.pow((nextNode.y - node.y) * 10, 2)
        ))
      : 0;

    return {
      nodeId: node.id,
      name: node.name,
      x: node.x,
      y: node.y,
      instruction,
      distance,
    };
  });
}
