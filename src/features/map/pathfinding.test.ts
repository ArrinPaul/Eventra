import { describe, it, expect } from 'vitest';
import { findDynamicPath } from './pathfinding';
import type { DynamicMapNode, DynamicMapEdge } from './types';

const nodes: DynamicMapNode[] = [
  { id: 'a', mapId: 'm1', name: 'Entrance', description: null, category: 'entrance', x: 10, y: 50, icon: 'E', color: '#22c55e' },
  { id: 'b', mapId: 'm1', name: 'Lobby', description: null, category: 'location', x: 30, y: 50, icon: 'L', color: '#6366f1' },
  { id: 'c', mapId: 'm1', name: 'Stage', description: null, category: 'stage', x: 60, y: 30, icon: 'S', color: '#ef4444' },
  { id: 'd', mapId: 'm1', name: 'Food Court', description: null, category: 'food', x: 60, y: 70, icon: 'F', color: '#ec4899' },
  { id: 'e', mapId: 'm1', name: 'Exit', description: null, category: 'exit', x: 90, y: 50, icon: 'X', color: '#64748b' },
];

const edges: DynamicMapEdge[] = [
  { from: 'a', to: 'b' },
  { from: 'b', to: 'c' },
  { from: 'b', to: 'd' },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'e' },
];

describe('findDynamicPath', () => {
  it('should find shortest path between two connected nodes', () => {
    const path = findDynamicPath('a', 'e', nodes, edges);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0].nodeId).toBe('a');
    expect(path[path.length - 1].nodeId).toBe('e');
  });

  it('should return empty array for same start and end', () => {
    const path = findDynamicPath('a', 'a', nodes, edges);
    expect(path).toEqual([]);
  });

  it('should return empty array for disconnected nodes', () => {
    const isolatedNodes: DynamicMapNode[] = [
      { id: 'x', mapId: 'm1', name: 'X', description: null, category: 'location', x: 0, y: 0, icon: 'L', color: '#000' },
      { id: 'y', mapId: 'm1', name: 'Y', description: null, category: 'location', x: 100, y: 100, icon: 'L', color: '#000' },
    ];
    const path = findDynamicPath('x', 'y', isolatedNodes, []);
    expect(path).toEqual([]);
  });

  it('should return empty array for non-existent node IDs', () => {
    const path = findDynamicPath('nonexistent', 'also-nonexistent', nodes, edges);
    expect(path).toEqual([]);
  });

  it('should include turn-by-turn instructions', () => {
    const path = findDynamicPath('a', 'c', nodes, edges);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0].instruction).toBe('Start here');
    expect(path[path.length - 1].instruction).toBe('You have arrived');
  });

  it('should handle single-edge path', () => {
    const path = findDynamicPath('a', 'b', nodes, edges);
    expect(path.length).toBe(2);
    expect(path[0].nodeId).toBe('a');
    expect(path[1].nodeId).toBe('b');
  });

  it('should find path through graph with multiple routes', () => {
    const path = findDynamicPath('a', 'e', nodes, edges);
    // Both a->b->c->e and a->b->d->e are valid shortest paths (length 3)
    expect(path.length).toBe(4); // 4 nodes in path
    expect(path[0].nodeId).toBe('a');
    expect(path[path.length - 1].nodeId).toBe('e');
  });
});
