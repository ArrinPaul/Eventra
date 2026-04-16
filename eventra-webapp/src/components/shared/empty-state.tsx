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
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Search, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 animate-in fade-in zoom-in duration-500",
      className
    )}>
      <div className="p-4 bg-white/5 rounded-full mb-6">
        <Icon className="h-12 w-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed">{description}</p>
      
      {actionLabel && actionHref && (
        <Button asChild className="bg-cyan-600 hover:bg-cyan-500 font-bold">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
