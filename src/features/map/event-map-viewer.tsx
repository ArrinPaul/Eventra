'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { findDynamicPath, type PathStep } from './pathfinding';
import { NODE_CATEGORY_CONFIG } from './node-icon-map';
import { type DynamicMapNode } from './types';
import { Navigation, MapPin, Clock, ArrowRight } from 'lucide-react';

interface MapEvent {
  id: string;
  title: string;
  nodeId: string;
  startTime: string;
  endTime: string;
}

interface EventMapViewerProps {
  map: {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    edges: Array<{ from: string; to: string }>;
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
  };
  events?: MapEvent[];
}

export function EventMapViewer({ map, events = [] }: EventMapViewerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const currentPath = useMemo(() => {
    if (!selectedNodeId || !navigationTarget) return [];
    return findDynamicPath(selectedNodeId, navigationTarget, map.nodes as DynamicMapNode[], map.edges);
  }, [selectedNodeId, navigationTarget, map.nodes, map.edges]);

  const eventsByNode = useMemo(() => {
    const now = new Date();
    const map = new Map<string, MapEvent[]>();
    for (const ev of events) {
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);
      if (now >= start && now <= end) {
        if (!map.has(ev.nodeId)) map.set(ev.nodeId, []);
        map.get(ev.nodeId)!.push(ev);
      }
    }
    return map;
  }, [events]);

  const handleNodeInteraction = (nodeId: string) => {
    if (selectedNodeId === null) {
      setSelectedNodeId(nodeId);
    } else if (navigationTarget === null && nodeId !== selectedNodeId) {
      setNavigationTarget(nodeId);
    } else {
      setSelectedNodeId(nodeId);
      setNavigationTarget(null);
    }
  };

  const clearNavigation = () => {
    setSelectedNodeId(null);
    setNavigationTarget(null);
  };

  const selectedNode = selectedNodeId ? map.nodes.find(n => n.id === selectedNodeId) : null;
  const targetNode = navigationTarget ? map.nodes.find(n => n.id === navigationTarget) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Map area */}
      <div className="flex-1 relative rounded-xl overflow-hidden border bg-slate-50 dark:bg-slate-900">
        <svg
          viewBox={`0 0 ${map.imageWidth} ${map.imageHeight}`}
          className="w-full h-full"
          style={{ maxHeight: '70vh' }}
        >
          <image href={map.imageUrl} width={map.imageWidth} height={map.imageHeight} />

          {/* Edges */}
          {map.edges.map((edge, i) => {
            const from = map.nodes.find(n => n.id === edge.from);
            const to = map.nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const isInPath = currentPath.some(p => p.nodeId === edge.from) &&
                             currentPath.some(p => p.nodeId === edge.to);
            return (
              <line
                key={i}
                x1={(from.x / 100) * map.imageWidth}
                y1={(from.y / 100) * map.imageHeight}
                x2={(to.x / 100) * map.imageWidth}
                y2={(to.y / 100) * map.imageHeight}
                stroke={isInPath ? '#22c55e' : '#94a3b8'}
                strokeWidth={isInPath ? 5 : 2}
                opacity={isInPath ? 1 : 0.4}
              />
            );
          })}

          {/* Navigation path overlay */}
          {currentPath.length >= 2 && (
            <polyline
              points={currentPath.map(p => {
                const node = map.nodes.find(n => n.id === p.nodeId)!;
                return `${(node.x / 100) * map.imageWidth},${(node.y / 100) * map.imageHeight}`;
              }).join(' ')}
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="12 6"
              className="animate-pulse"
            />
          )}

          {/* Nodes */}
          {map.nodes.map((node) => {
            const px = (node.x / 100) * map.imageWidth;
            const py = (node.y / 100) * map.imageHeight;
            const liveCount = eventsByNode.get(node.id)?.length || 0;
            const isStart = currentPath[0]?.nodeId === node.id;
            const isEnd = currentPath[currentPath.length - 1]?.nodeId === node.id;
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;

            return (
              <g
                key={node.id}
                onClick={() => handleNodeInteraction(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Live event pulse */}
                {liveCount > 0 && (
                  <circle cx={px} cy={py} r="24" fill="#ef4444" opacity="0.2" className="animate-ping" />
                )}

                {/* Selection ring */}
                {(isSelected || isStart) && (
                  <circle cx={px} cy={py} r="20" fill="none" stroke="#22c55e" strokeWidth="3" opacity="0.5" />
                )}
                {isEnd && (
                  <circle cx={px} cy={py} r="20" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.5" />
                )}

                {/* Node circle */}
                <circle
                  cx={px}
                  cy={py}
                  r={isStart || isEnd ? 18 : isHovered ? 16 : 14}
                  fill={isStart ? '#22c55e' : isEnd ? '#ef4444' : node.color}
                  stroke="#fff"
                  strokeWidth="3"
                />

                {/* Category symbol */}
                <text
                  x={px}
                  y={py + 4}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-white pointer-events-none"
                >
                  {NODE_CATEGORY_CONFIG[node.category]?.symbol || 'L'}
                </text>

                {/* Label */}
                <text
                  x={px}
                  y={py + 32}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-foreground pointer-events-none"
                >
                  {node.name}
                </text>

                {/* Live event badge */}
                {liveCount > 0 && (
                  <>
                    <circle cx={px + 14} cy={py - 14} r="8" fill="#ef4444" />
                    <text
                      x={px + 14}
                      y={py - 10}
                      textAnchor="middle"
                      className="text-[8px] font-bold fill-white pointer-events-none"
                    >
                      {liveCount}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-4">
        {/* Status */}
        {selectedNode && !navigationTarget && (
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <MapPin className="h-4 w-4" />
              You are at: {selectedNode.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Click another node to navigate there
            </p>
          </div>
        )}

        {/* Navigation directions */}
        {currentPath.length >= 2 && (
          <div className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Navigation className="h-4 w-4" />
                Navigation
              </div>
              <Button size="sm" variant="ghost" onClick={clearNavigation}>
                Clear
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {selectedNode?.name} &rarr; {targetNode?.name}
            </div>

            <div className="space-y-2">
              {currentPath.map((step, i) => (
                <div key={step.nodeId} className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                    i === 0 ? 'bg-green-500' : i === currentPath.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {i === 0 ? 'A' : i === currentPath.length - 1 ? 'B' : i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{step.name}</p>
                    <p className="text-[10px] text-muted-foreground">{step.instruction}</p>
                  </div>
                  {step.distance > 0 && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      ~{step.distance}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected node info */}
        {selectedNode && (
          <div className="p-4 rounded-lg border space-y-2">
            <h3 className="font-semibold">{selectedNode.name}</h3>
            {selectedNode.description && (
              <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              {NODE_CATEGORY_CONFIG[selectedNode.category]?.label || selectedNode.category}
            </div>
            {eventsByNode.get(selectedNode.id)?.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                <Clock className="h-3 w-3" />
                <span className="truncate">{ev.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* All nodes */}
        <div className="p-4 rounded-lg border">
          <h3 className="text-sm font-semibold mb-2">All Locations</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {map.nodes.map(node => {
              const liveCount = eventsByNode.get(node.id)?.length || 0;
              return (
                <button
                  key={node.id}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                    selectedNodeId === node.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleNodeInteraction(node.id)}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="flex-1 truncate">{node.name}</span>
                  {liveCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">
                      {liveCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
