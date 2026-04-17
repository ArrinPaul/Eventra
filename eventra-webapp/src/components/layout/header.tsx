'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Menu,
  LogOut,
  Moon,
  Sun,
  User,
  Search,
  Calendar,
  Compass,
  LayoutDashboard,
  Ticket,
  X,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/features/notifications/notification-center';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslations } from 'next-intl';

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full"
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 group"
      data-testid="header-logo"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shadow-soft">
        <Calendar className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        Eventra
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/explore', label: t('explore'), icon: Compass },
    { href: '/tickets', label: t('tickets'), icon: Ticket, requireAuth: true },
    { href: '/my-events', label: 'My Events', icon: Calendar, requireAuth: true },
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard, roles: ['organizer', 'admin'] },
  ].filter((link) => {
    if (link.href === '/' || link.href === '/explore') return true;
    if (link.requireAuth && !user) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  });

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border'
          : 'bg-transparent border-b border-transparent'
      )}
      data-testid="app-header"
    >
      <div className="page-container flex h-16 items-center justify-between gap-4">
        {/* Left: Logo + primary links */}
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`nav-link-${link.href.replace(/\//g, '-') || 'home'}`}
                  className={cn(
                    'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150',
                    isActive
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="hidden md:inline-flex rounded-full"
            data-testid="header-search-btn"
          >
            <Link href="/search" aria-label="Search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          <NotificationBell />
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors"
                  data-testid="header-user-menu"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="end">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                      {(user.name?.charAt(0) || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {user.name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tickets" data-testid="menu-tickets">
                    <Ticket className="mr-2 h-4 w-4" /> My Tickets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/preferences" data-testid="menu-settings">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Button asChild variant="ghost" size="sm" data-testid="header-signin">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" data-testid="header-signup">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-muted"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            data-testid="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border"
          >
            <div className="page-container py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname?.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" /> {link.label}
                  </Link>
                );
              })}
              {!user && (
                <div className="pt-3 flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Get started</Link>
                  </Button>
                </div>
              )}
              {user && (
                <div className="pt-3">
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
