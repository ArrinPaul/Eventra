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
  Sparkles,
  Award,
  HelpCircle,
} from 'lucide-react';

const sidebarGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
      { title: 'My Events', href: '/organizer/events', icon: Calendar },
      { title: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Attendee Ops',
    items: [
      { title: 'Attendees', href: '/organizer/attendees', icon: Users },
      { title: 'Check-in Scanner', href: '/check-in-scanner', icon: QrCode },
      { title: 'Ticketing', href: '/organizer/ticketing', icon: Ticket },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { title: 'AI Tools', href: '/organizer/ai', icon: Sparkles },
      { title: 'Certificates', href: '/organizer/certificates', icon: Award },
      { title: 'Communications', href: '/organizer/communications', icon: Mail },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Settings', href: '/organizer/settings', icon: Settings },
    ],
  },
];

export function OrganizerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative hidden md:flex h-[calc(100vh-4rem)] sticky top-16 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
      data-testid="organizer-sidebar"
    >
      {/* Create event */}
      <div className="p-3">
        {collapsed ? (
          <Button
            asChild
            size="icon"
            className="w-full"
            data-testid="sidebar-create-event"
          >
            <Link href="/events/create" aria-label="Create event">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className="w-full gap-2"
            data-testid="sidebar-create-event"
          >
            <Link href="/events/create">
              <Plus className="h-4 w-4" /> Create event
            </Link>
          </Button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-6 pb-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              {!collapsed && (
                <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/organizer' &&
                    pathname?.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`sidebar-${item.href.replace(/\//g, '-')}`}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/12 text-primary dark:bg-primary/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-0'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                    )}
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer: help + collapse */}
      <div className="border-t border-sidebar-border p-3 flex items-center justify-between gap-2">
        {!collapsed && (
          <Link
            href="/support"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Help & support
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-testid="sidebar-collapse-toggle"
          className="ml-auto rounded-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
