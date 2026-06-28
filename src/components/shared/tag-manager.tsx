'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTags, getEventTags, addTagToEvent, removeTagFromEvent } from '@/app/actions/tags';
import { cn } from '@/core/utils/utils';

interface TagManagerProps {
  eventId?: string;
  value?: string[];
  onChange?: (tags: string[]) => void;
  mode?: 'event' | 'browse';
  className?: string;
}

export function TagManager({
  eventId,
  value = [],
  onChange,
  mode = 'event',
  className,
}: TagManagerProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [eventTagsList, setEventTagsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (mode === 'event' && eventId) {
      loadEventTags();
    }
  }, [eventId, mode]);

  const loadEventTags = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const tags = await getEventTags(eventId);
      setEventTagsList(tags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await getTags(query, 5);
      setSuggestions(results);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(input), 200);
    return () => clearTimeout(timer);
  }, [input, fetchSuggestions]);

  const handleAddTag = async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    if (mode === 'event' && eventId) {
      const result = await addTagToEvent(eventId, trimmed);
      if (result.success) {
        toast({ title: 'Tag added' });
        loadEventTags();
      } else {
        toast({ title: result.error || 'Failed', variant: 'destructive' });
      }
    } else {
      if (!value.includes(trimmed)) {
        onChange?.([...value, trimmed]);
      }
    }
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveTag = async (tagIdOrName: string) => {
    if (mode === 'event' && eventId) {
      const result = await removeTagFromEvent(eventId, tagIdOrName);
      if (result.success) {
        toast({ title: 'Tag removed' });
        loadEventTags();
      }
    } else {
      onChange?.(value.filter((t) => t !== tagIdOrName));
    }
  };

  const displayTags = mode === 'event' ? eventTagsList : value.map((t) => ({ id: t, name: t }));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Add a tag..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(input);
                }
              }}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleAddTag(input)}
            disabled={!input.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddTag(tag.name);
                }}
              >
                <span>{tag.name}</span>
                <span className="text-xs text-muted-foreground">{tag.eventCount} events</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1 cursor-default"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading tags...
        </div>
      )}
    </div>
  );
}
