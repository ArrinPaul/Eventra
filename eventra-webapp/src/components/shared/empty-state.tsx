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
        "flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-notion-hairline rounded-lg bg-notion-canvas-soft/30",
        className
      )}
      data-testid="empty-state"
    >
      <div className="p-4 bg-notion-canvas border border-notion-hairline rounded-md mb-6 shadow-notion-soft">
        <Icon className="h-8 w-8 text-notion-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-title font-bold text-notion-ink mb-2">{title}</h3>
      <p className="text-body-sm text-notion-ink-muted max-w-xs mb-8">{description}</p>
      
      {actionLabel && (actionHref || actionOnClick) && (
        <Button 
          asChild={!!actionHref} 
          variant="primary"
          size="default"
          onClick={actionOnClick}
          data-testid="empty-state-action"
        >
          {actionHref ? <Link href={actionHref}>{actionLabel}</Link> : actionLabel}
        </Button>
      )}
    </div>
  );
}
