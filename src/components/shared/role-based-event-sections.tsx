'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  CheckCircle,
  Palette,
  Bell,
  Bug,
  ClipboardList,
  Award,
  Camera,
  ShieldCheck,
} from 'lucide-react';

interface EventSection {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
  color: string;
}

const EVENT_SECTIONS: EventSection[] = [
  {
    id: 'manage',
    label: 'Edit Event',
    description: 'Update event details, settings, and visibility',
    icon: Settings,
    href: '/edit',
    roles: ['organizer', 'admin'],
    color: 'text-blue-500',
  },
  {
    id: 'tasks',
    label: 'Task Board',
    description: 'Plan and track event preparation with AI-generated tasks',
    icon: ClipboardList,
    href: '/tasks',
    roles: ['organizer', 'admin'],
    color: 'text-amber-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'View event stats, revenue, and engagement metrics',
    icon: BarChart3,
    href: '/analytics',
    roles: ['organizer', 'admin'],
    color: 'text-emerald-500',
  },
  {
    id: 'attendees',
    label: 'Attendees',
    description: 'Manage registrations and export attendee lists',
    icon: Users,
    href: '/attendees',
    roles: ['organizer', 'admin'],
    color: 'text-cyan-500',
  },
  {
    id: 'stakeholders',
    label: 'Stakeholders',
    description: 'Manage volunteers, speakers, and organizers',
    icon: ShieldCheck,
    href: '/stakeholders',
    roles: ['organizer', 'admin'],
    color: 'text-purple-500',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'Generate and distribute event certificates',
    icon: Award,
    href: '/certificates',
    roles: ['organizer', 'admin'],
    color: 'text-yellow-500',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Upload and manage event photos',
    icon: Camera,
    href: '/gallery',
    roles: ['organizer', 'admin', 'speaker'],
    color: 'text-pink-500',
  },
  {
    id: 'feedbacks',
    label: 'Feedback',
    description: 'View responses and manage feedback forms',
    icon: MessageSquare,
    href: '/feedbacks',
    roles: ['organizer', 'admin'],
    color: 'text-violet-500',
  },
  {
    id: 'issues',
    label: 'Issues',
    description: 'Track and resolve reported issues',
    icon: Bug,
    href: '/issues',
    roles: ['organizer', 'admin'],
    color: 'text-red-500',
  },
  {
    id: 'updates',
    label: 'Updates',
    description: 'Create and send event notifications',
    icon: Bell,
    href: '/updates',
    roles: ['organizer', 'admin'],
    color: 'text-orange-500',
  },
  {
    id: 'report',
    label: 'Report',
    description: 'Generate AI-powered event reports',
    icon: FileText,
    href: '/report',
    roles: ['organizer', 'admin'],
    color: 'text-indigo-500',
  },
  {
    id: 'verify',
    label: 'Check-in',
    description: 'Scan tickets and verify attendees',
    icon: CheckCircle,
    href: '/verify',
    roles: ['organizer', 'admin', 'volunteer'],
    color: 'text-green-500',
  },
];

interface RoleBasedEventSectionsProps {
  eventId: string;
  userRole?: string;
}

export function RoleBasedEventSections({ eventId, userRole }: RoleBasedEventSectionsProps) {
  const { user } = useAuth();
  const role = userRole || user?.role || 'attendee';

  const visibleSections = EVENT_SECTIONS.filter((section) =>
    section.roles.includes(role)
  );

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Event Management</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={`/events/${eventId}${section.href}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${section.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function canAccessSection(role: string, sectionId: string): boolean {
  const section = EVENT_SECTIONS.find((s) => s.id === sectionId);
  return section ? section.roles.includes(role) : false;
}

export function getVisibleSections(role: string): EventSection[] {
  return EVENT_SECTIONS.filter((s) => s.roles.includes(role));
}
