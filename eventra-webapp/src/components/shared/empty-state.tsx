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
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center',
        'animate-fade-in',
        className
      )}
      data-testid="empty-state"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5 font-display">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Button asChild variant="default" data-testid="empty-state-action">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} data-testid="empty-state-action">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
