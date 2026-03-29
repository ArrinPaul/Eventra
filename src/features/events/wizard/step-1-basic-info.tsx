'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { EventWizardData } from './types';

const CATEGORIES = [
  'Conference', 'Workshop', 'Meetup', 'Hackathon', 
  'Social', 'Networking', 'Exhibition', 'Other'
];

export function Step1BasicInfo() {
  const { control, watch, setValue } = useFormContext<EventWizardData>();
  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') || [];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setValue('tags', [...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Event Details</h2>
        <p className="text-muted-foreground">Start with the basics of your event.</p>
      </div>

      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Annual Tech Summit 2026" className="text-lg" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
            <FormLabel>Tags</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[42px] bg-background">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1">
                        {tag}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 hover:bg-transparent hover:text-destructive"
                            onClick={() => removeTag(tag)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
                <input 
                    className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                    placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                />
            </div>
            <FormDescription>Keywords to help people find your event.</FormDescription>
        </div>
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <div className="relative">
                <Textarea 
                  placeholder="What is your event about?" 
                  className="min-h-[150px] resize-y" 
                  {...field} 
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 bottom-2 text-xs text-muted-foreground hover:text-primary"
                    // AI generation logic will be handled at the parent or via a specialized hook later
                >
                    <Sparkles className="h-3 w-3 mr-1" /> AI Enhance
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
