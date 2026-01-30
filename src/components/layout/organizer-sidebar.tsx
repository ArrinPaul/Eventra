'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/core/utils/utils';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  Settings,
  QrCode,
  Ticket,
  Mail,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/organizer',
    icon: LayoutDashboard,
  },
  {
    title: 'My Events',
    href: '/organizer/events',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/organizer/analytics',
    icon: BarChart3,
  },
  {
    title: 'Attendees',
    href: '/organizer/attendees',
    icon: Users,
  },
  {
    title: 'Check-in Scanner',
    href: '/check-in-scanner',
    icon: QrCode,
  },
  {
    title: 'Ticketing',
    href: '/organizer/ticketing',
    icon: Ticket,
  },
  {
    title: 'Communications',
    href: '/organizer/communications',
    icon: Mail,
  },
  {
    title: 'Settings',
    href: '/organizer/settings',
    icon: Settings,
  },
];

export function OrganizerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-semibold">Organizer</h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Create Event Button */}
      <div className="p-3">
        {collapsed ? (
          <Button asChild size="icon" className="w-full">
            <Link href="/events/create">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/events/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Need help?</p>
            <Link href="/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
