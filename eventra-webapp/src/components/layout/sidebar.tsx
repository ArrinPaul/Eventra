'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { UserButton, useClerk } from "@clerk/nextjs";
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Compass, 
  Ticket, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Moon,
  Sun,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = React.useMemo(() => [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/explore', label: t('explore'), icon: Compass },
    { href: '/tickets', label: t('tickets'), icon: Ticket, requireAuth: true },
    { href: '/my-events', label: 'My Events', icon: Calendar, requireAuth: true },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/admin', label: 'Organizer', icon: ShieldCheck, roles: ['organizer', 'admin'] },
  ].filter(link => {
    if (link.href === '/' || link.href === '/explore' || link.href === '/search') return true;
    if (link.requireAuth && !isAuthenticated) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  }), [user, isAuthenticated, t]);

  const sidebarWidth = isCollapsed ? '64px' : '240px';

  if (!mounted) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 bg-notion-canvas border-r border-notion-hairline flex flex-col transition-all duration-300",
          className
        )}
      >
        {/* HEADER / LOGO */}
        <div className="h-[48px] flex items-center px-4 shrink-0">
          <Link href="/" className="flex items-center gap-3 active:scale-95 group">
             <Logo showText={!isCollapsed} />
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pt-2 overflow-x-hidden custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link href={link.href}>
                    <div className={cn(
                      "group relative flex items-center h-8 gap-3 px-2.5 rounded-sm transition-colors cursor-pointer",
                      isActive 
                        ? "bg-notion-canvas-soft text-notion-ink font-semibold" 
                        : "text-notion-ink-secondary hover:bg-notion-canvas-soft hover:text-notion-ink"
                    )}>
                      <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-notion-primary" : "text-notion-ink-muted group-hover:text-notion-ink")} />
                      {!isCollapsed && (
                        <span className="text-[14px] truncate">
                          {link.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-notion-ink text-notion-canvas border-none rounded-md px-2.5 py-1 text-[12px] ml-2 shadow-notion-elevated">
                    {link.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="mt-auto border-t border-notion-hairline bg-notion-canvas-soft/20 flex flex-col p-2 space-y-1">
          {/* THEME TOGGLE & COLLAPSE */}
          <div className={cn("flex items-center gap-1", isCollapsed ? "flex-col" : "justify-between")}>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-8 h-8 rounded-sm hover:bg-notion-canvas-soft text-notion-ink-muted"
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </Button>
             
             {!isCollapsed && (
                <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setIsCollapsed(true)}
                   className="w-8 h-8 rounded-sm hover:bg-notion-canvas-soft text-notion-ink-muted"
                >
                   <ChevronLeft className="w-4 h-4" />
                </Button>
             )}
             
             {isCollapsed && (
                <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setIsCollapsed(false)}
                   className="w-8 h-8 rounded-sm hover:bg-notion-canvas-soft text-notion-ink-muted"
                >
                   <ChevronRight className="w-4 h-4" />
                </Button>
             )}
          </div>

          {/* SIGN OUT */}
          <Tooltip>
             <TooltipTrigger asChild>
                <button
                   type="button"
                   onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await logout();
                   }}
                   className={cn(
                      "flex items-center h-8 gap-3 px-2.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-notion-ink-muted hover:text-red-600 transition-colors w-full cursor-pointer",
                      isCollapsed && "justify-center"
                   )}
                >
                   <LogOut className="w-4 h-4 shrink-0" />
                   {!isCollapsed && <span className="text-[14px]">Sign out</span>}
                </button>
             </TooltipTrigger>
             {isCollapsed && (
                <TooltipContent side="right" className="bg-red-600 text-white border-none rounded-md px-2.5 py-1 text-[12px] ml-2">
                   Sign out
                </TooltipContent>
             )}
          </Tooltip>

          {/* USER PROFILE */}
          <div className={cn(
            "flex items-center gap-3 p-2 mt-1 rounded-sm hover:bg-notion-canvas-soft transition-colors group overflow-hidden",
            isCollapsed && "justify-center"
          )}>
            <div className="shrink-0">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-6 w-6 rounded-sm border border-notion-hairline",
                    userButtonTrigger: "focus:shadow-none focus:ring-0",
                  }
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-notion-ink truncate leading-tight">{user?.name}</span>
                <span className="text-[11px] text-notion-ink-muted capitalize truncate leading-tight">{user?.role}</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
