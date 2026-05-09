'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/core/utils/utils';
import { motion } from 'framer-motion';
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
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const sidebarGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
      { title: 'AI Insights', href: '/organizer/ai-insights', icon: Sparkles },
    ],
  },
  {
    label: 'Event Management',
    items: [
      { title: 'My Events', href: '/organizer/events', icon: Calendar },
      { title: 'Attendees', href: '/organizer/attendees', icon: Users },
      { title: 'Scanner', href: '/check-in-scanner', icon: QrCode },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
      { title: 'Ticketing', href: '/organizer/ticketing', icon: Ticket },
      { title: 'Comms', href: '/organizer/communications', icon: Mail },
      { title: 'Settings', href: '/organizer/settings', icon: Settings },
    ],
  },
];

export function OrganizerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300 shadow-sm z-10',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-foreground">Organizer</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">Workspace</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Create Event Action */}
      <div className="p-4 shrink-0 border-b border-border/50">
        <Button asChild size={collapsed ? "icon" : "default"} className={cn("rounded-xl shadow-glow bg-primary hover:bg-primary/90 text-primary-foreground transition-all", collapsed ? "w-9 h-9" : "w-full")}>
          <Link href="/events/create">
            <Plus className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && <span>New Event</span>}
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 custom-scrollbar">
        <nav className="flex flex-col gap-6 px-3">
          {sidebarGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/organizer' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                      isActive
                        ? 'text-foreground bg-muted/50'
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                      collapsed && 'justify-center px-0'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0">
        {collapsed ? (
          <Link href="/support" className="flex justify-center text-muted-foreground hover:text-primary transition-colors">
            <HelpCircle className="h-5 w-5" />
          </Link>
        ) : (
          <Link href="/support" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className="p-2 rounded-lg bg-background shadow-sm group-hover:text-primary transition-colors">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Need help?</p>
              <p className="text-xs text-muted-foreground">Contact Support</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
