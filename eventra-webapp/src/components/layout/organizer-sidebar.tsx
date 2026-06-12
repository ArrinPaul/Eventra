'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/core/utils/utils';
import { motion } from 'framer-motion';
import { Logo } from '@/components/brand/logo';
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
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? '80px' : '280px' }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 bg-background/80 backdrop-blur-xl border-r border-border/40 transition-all duration-300 flex flex-col shadow-2xl",
      )}
    >
      {/* Header */}
      <div className="h-24 flex items-center px-6 mb-4">
        {!collapsed ? (
          <div className="flex items-center gap-4 transition-transform active:scale-95 group overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-glow shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
               <Logo iconClassName="w-8 h-8 text-primary-foreground" className="gap-0" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-xl tracking-tighter text-foreground truncate">Organizer.</span>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] truncate opacity-60">Command_Hub</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-glow shadow-primary/20">
             <Logo iconClassName="w-8 h-8 text-primary-foreground" className="gap-0" />
          </div>
        )}
      </div>

      {/* Action Toggle */}
      <div className="px-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-10 rounded-xl hover:bg-muted/50 border border-border/20 shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Create Event Action */}
      <div className="px-4 mb-8">
        <Button asChild size={collapsed ? "icon" : "lg"} className={cn("rounded-2xl shadow-glow bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] border-none transition-all active:scale-95", collapsed ? "w-12 h-12" : "w-full h-14")}>
          <Link href="/events/create">
            <Plus className={cn("w-5 h-5", !collapsed && "mr-3")} />
            {!collapsed && <span>New Mission</span>}
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 custom-scrollbar">
        <nav className="flex flex-col gap-10 pb-10">
          {sidebarGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              {!collapsed && (
                <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">
                  {group.label}
                </p>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/organizer' && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group overflow-hidden',
                        isActive
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="org-sidebar-active-pill"
                          className="absolute inset-0 bg-primary/5 border-l-4 border-primary -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary" : "group-hover:text-primary")} />
                      {!collapsed && <span className="text-[11px] uppercase tracking-[0.2em] truncate">{item.title}</span>}
                      {collapsed && (
                        <div className="absolute left-full ml-6 px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                          {item.title}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/40 bg-muted/10">
        {collapsed ? (
          <Link href="/support" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60 border border-border/40 text-muted-foreground hover:text-primary transition-all shadow-lg hover:scale-110">
            <HelpCircle className="w-5 h-5" />
          </Link>
        ) : (
          <Link href="/support" className="flex items-center gap-4 p-3.5 rounded-3xl bg-background/60 border border-border/40 shadow-xl transition-all hover:bg-background/80 group">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">Need help?</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Ops_Support</p>
            </div>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
