import { describe, it, expect } from 'vitest';
import { toPixelNodes } from './types';
import type { DynamicMapNode } from './types';

const sampleNodes: DynamicMapNode[] = [
  { id: '1', mapId: 'm1', name: 'Center', description: null, category: 'location', x: 50, y: 50, icon: 'L', color: '#000' },
  { id: '2', mapId: 'm1', name: 'Top-Left', description: null, category: 'entrance', x: 0, y: 0, icon: 'E', color: '#000' },
  { id: '3', mapId: 'm1', name: 'Bottom-Right', description: null, category: 'exit', x: 100, y: 100, icon: 'X', color: '#000' },
];

describe('toPixelNodes', () => {
  it('should convert percentage coordinates to pixel positions', () => {
    const result = toPixelNodes(sampleNodes, 800, 600);
    expect(result[0].px).toBe(400);
    expect(result[0].py).toBe(300);
  });

  it('should handle 0,0 coordinate', () => {
    const result = toPixelNodes(sampleNodes, 800, 600);
    expect(result[1].px).toBe(0);
    expect(result[1].py).toBe(0);
  });

  it('should handle 100,100 coordinate', () => {
    const result = toPixelNodes(sampleNodes, 800, 600);
    expect(result[2].px).toBe(800);
    expect(result[2].py).toBe(600);
  });

  it('should preserve original node properties', () => {
    const result = toPixelNodes(sampleNodes, 800, 600);
    expect(result[0].id).toBe('1');
    expect(result[0].name).toBe('Center');
    expect(result[0].category).toBe('location');
  });

  it('should handle empty array', () => {
    const result = toPixelNodes([], 800, 600);
    expect(result).toEqual([]);
  });

  it('should work with different container sizes', () => {
    const result = toPixelNodes(sampleNodes, 1920, 1080);
    expect(result[0].px).toBe(960);
    expect(result[0].py).toBe(540);
  });
});
