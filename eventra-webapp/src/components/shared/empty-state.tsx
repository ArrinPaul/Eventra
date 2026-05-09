'use client';

import React from 'react';
import { LucideIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/core/utils/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Search, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  actionOnClick,
  className
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-card/30 animate-in fade-in zoom-in duration-500",
        className
      )}
      data-testid="empty-state"
    >
      <div className="p-5 bg-primary/10 rounded-[2rem] mb-6 shadow-glow">
        <Icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-display font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">{description}</p>
      
      {actionLabel && (actionHref || actionOnClick) && (
        <Button 
          asChild={!!actionHref} 
          variant="default"
          size="lg"
          onClick={actionOnClick}
          data-testid="empty-state-action"
        >
          {actionHref ? <Link href={actionHref}>{actionLabel}</Link> : actionLabel}
        </Button>
      )}
    </div>
  );
}
