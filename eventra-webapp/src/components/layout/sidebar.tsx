'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Compass, 
  Ticket, 
  Calendar, 
  Search, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  UserCircle
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
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
  });

  if (!mounted) return null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '280px' }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 bg-background border-r border-border transition-all duration-300 flex flex-col",
        className
      )}
    >
      {/* HEADER / LOGO */}
      <div className="h-20 flex items-center px-6 mb-4">
        <Link href="/" className="flex items-center gap-4 transition-transform active:scale-95">
          <Logo iconClassName="w-10 h-10" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display font-bold text-xl tracking-tighter"
              >
                Eventra
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <link.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors")} />
                {!isCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] truncate">
                    {link.label}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER ACTIONS */}
      <div className="p-4 space-y-4 border-t border-border bg-muted/20">
        {!isCollapsed && (
           <div className="flex items-center justify-between px-2 mb-2">
             <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="w-9 h-9 rounded-xl hover:bg-background shadow-sm transition-all"
               >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </Button>
               <div className="scale-75 origin-left">
                 <LanguageSwitcher />
               </div>
             </div>
             <Button
               variant="ghost"
               size="icon"
               onClick={() => setIsCollapsed(true)}
               className="w-9 h-9 rounded-xl hover:bg-background shadow-sm transition-all"
             >
               <ChevronLeft className="w-4 h-4" />
             </Button>
           </div>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center gap-4 mb-2">
            <Button
               variant="ghost"
               size="icon"
               onClick={() => setIsCollapsed(false)}
               className="w-10 h-10 rounded-2xl bg-background border border-border shadow-sm"
             >
               <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        )}

        {/* USER PROFILE */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-[1.5rem] bg-background border border-border shadow-sm transition-all",
          isCollapsed ? "justify-center" : "px-4"
        )}>
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-10 w-10 rounded-xl",
                userButtonTrigger: "focus:shadow-none focus:ring-0",
              }
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate">{user?.name}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{user?.role}</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
