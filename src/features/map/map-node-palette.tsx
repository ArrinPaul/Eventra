'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NODE_CATEGORY_CONFIG } from './node-icon-map';
import { MapPin, Link, MousePointer } from 'lucide-react';

export type EditorMode = 'place' | 'connect' | 'select';

interface MapNodePaletteProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  connectFrom: string | null;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function MapNodePalette({
  mode,
  onModeChange,
  connectFrom,
  selectedCategory,
  onCategoryChange,
}: MapNodePaletteProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Tools</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'place' ? 'default' : 'outline'}
            onClick={() => onModeChange('place')}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Place
          </Button>
          <Button
            size="sm"
            variant={mode === 'connect' ? 'default' : 'outline'}
            onClick={() => onModeChange('connect')}
          >
            <Link className="h-4 w-4 mr-1" />
            Connect
          </Button>
          <Button
            size="sm"
            variant={mode === 'select' ? 'default' : 'outline'}
            onClick={() => onModeChange('select')}
          >
            <MousePointer className="h-4 w-4 mr-1" />
            Select
          </Button>
        </div>
        {connectFrom && (
          <p className="text-xs text-muted-foreground mt-2">
            Click a second node to connect
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Node Category</h3>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(NODE_CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                selectedCategory === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => onCategoryChange(key)}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
