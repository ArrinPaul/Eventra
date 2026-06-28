'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  Mic,
  Users,
  GraduationCap,
  Briefcase,
  Store,
  Crown,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

type RoleValue = 'admin' | 'organizer' | 'speaker' | 'volunteer' | 'attendee' | 'student' | 'professional' | 'vendor';

interface RoleConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const ROLE_CONFIGS: Record<RoleValue, RoleConfig> = {
  admin: {
    label: 'Admin',
    icon: Crown,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  organizer: {
    label: 'Organizer',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  speaker: {
    label: 'Speaker',
    icon: Mic,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  volunteer: {
    label: 'Volunteer',
    icon: Shield,
    color: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  attendee: {
    label: 'Attendee',
    icon: Users,
    color: 'text-slate-600',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  student: {
    label: 'Student',
    icon: GraduationCap,
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  professional: {
    label: 'Professional',
    icon: Briefcase,
    color: 'text-indigo-600',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  vendor: {
    label: 'Vendor',
    icon: Store,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
};

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function RoleBadge({ role, size = 'sm', showIcon = true, className }: RoleBadgeProps) {
  const config = ROLE_CONFIGS[role as RoleValue] || ROLE_CONFIGS.attendee;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center font-semibold uppercase tracking-wider border',
        config.bg,
        config.color,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIGS[role as RoleValue] || ROLE_CONFIGS.attendee;
}
