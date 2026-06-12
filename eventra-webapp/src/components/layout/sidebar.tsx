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
        "fixed left-0 top-0 bottom-0 z-50 bg-background/80 backdrop-blur-xl border-r border-border/40 transition-all duration-300 flex flex-col shadow-2xl",
        className
      )}
    >
      {/* HEADER / LOGO */}
      <div className="h-24 flex items-center px-6 mb-4">
        <Link href="/" className="flex items-center gap-4 transition-transform active:scale-95 group">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-glow shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
             <Logo iconClassName="w-8 h-8 text-primary-foreground" className="gap-0" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display font-bold text-2xl tracking-tighter text-foreground"
              >
                Eventra
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto pt-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-glow shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <link.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "group-hover:text-primary")} />
                {!isCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] truncate">
                    {link.label}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-primary -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-6 px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                    {link.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER ACTIONS */}
      <div className="p-4 space-y-6 border-t border-border/40 bg-muted/10">
        {!isCollapsed && (
           <div className="flex items-center justify-between px-2 mb-2">
             <div className="flex items-center gap-3">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="w-10 h-10 rounded-xl hover:bg-background/80 shadow-sm transition-all"
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
               className="w-10 h-10 rounded-xl hover:bg-background/80 shadow-sm transition-all"
             >
               <ChevronLeft className="w-4 h-4" />
             </Button>
           </div>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center gap-6 mb-2">
            <Button
               variant="ghost"
               size="icon"
               onClick={() => setIsCollapsed(false)}
               className="w-12 h-12 rounded-2xl bg-background/80 border border-border/40 shadow-xl hover:scale-110 transition-all"
             >
               <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        )}

        {/* USER PROFILE */}
        <div className={cn(
          "flex items-center gap-4 p-3.5 rounded-3xl bg-background/60 border border-border/40 shadow-xl transition-all hover:bg-background/80",
          isCollapsed ? "justify-center" : "px-4"
        )}>
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-11 w-11 rounded-2xl shadow-sm",
                userButtonTrigger: "focus:shadow-none focus:ring-0",
              }
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate">{user?.name}</span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate opacity-60">{user?.role}</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
