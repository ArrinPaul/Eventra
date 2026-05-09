'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Moon, Sun, Search, Settings, Ticket, Calendar, X, Sparkles } from 'lucide-react';
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
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/80"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: t('explore') },
    { href: '/tickets', label: t('tickets'), requireAuth: true },
    { href: '/my-events', label: 'My Events', requireAuth: true },
    { href: '/admin', label: t('dashboard'), roles: ['organizer', 'admin'] },
  ].filter(link => {
    if (link.href === '/' || link.href === '/explore') return true;
    if (link.requireAuth && !user) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  });

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-smooth",
        scrolled
          ? "py-3"
          : "py-6"
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn(
          "flex items-center justify-between h-16 px-6 rounded-2xl transition-all duration-500",
          scrolled 
            ? "glass-card shadow-elevated border-white/10" 
            : "bg-transparent border-transparent"
        )}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group" data-testid="header-logo">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-info flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-display font-black text-foreground tracking-tighter hidden lg:block">
              Eventra
            </span>
          </Link>

          {/* Desktop Nav - Floating Pills */}
          <nav className="hidden md:flex items-center justify-center flex-1 mx-8" data-testid="app-header">
            <div className="flex items-center gap-1 p-1 rounded-xl glass border border-white/10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300",
                      isActive
                        ? "text-primary-foreground bg-primary shadow-glow scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex rounded-xl w-10 h-10 glass border border-white/5 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
              asChild
              data-testid="header-search-btn"
            >
              <Link href="/search">
                <Search className="w-5 h-5" />
              </Link>
            </Button>

            <div data-testid="theme-toggle" className="glass rounded-xl border border-white/5">
              <ThemeToggle />
            </div>

            <div className="hidden lg:block glass rounded-xl border border-white/5">
              <LanguageSwitcher />
            </div>

            {user && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-xl ml-1 p-0 group" data-testid="header-user-menu">
                    <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/50 transition-all">
                      <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mt-4 p-3 rounded-[1.5rem] glass-card border-white/10 shadow-2xl animate-scale-in" align="end">
                  <div className="flex items-center gap-4 p-4 mb-3 rounded-2xl bg-primary/5 border border-primary/10">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={user.image || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary font-black text-xl">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-black text-foreground truncate">{user.name || 'User'}</span>
                      <span className="text-xs font-bold text-muted-foreground truncate">{user.email}</span>
                      <Badge variant="secondary" className="mt-1 w-fit text-[10px] uppercase font-black tracking-widest bg-primary/20 text-primary border-none">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 font-bold hover:bg-primary/10 hover:text-primary transition-colors">
                      <Link href="/profile">
                        <Calendar className="mr-3 h-5 w-5 opacity-70" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 font-bold hover:bg-primary/10 hover:text-primary transition-colors">
                      <Link href="/tickets">
                        <Ticket className="mr-3 h-5 w-5 opacity-70" />
                        Passes & Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 font-bold hover:bg-primary/10 hover:text-primary transition-colors">
                      <Link href="/preferences">
                        <Settings className="mr-3 h-5 w-5 opacity-70" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="my-3 opacity-10" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive cursor-pointer rounded-xl p-3 font-bold hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="mr-3 h-5 w-5 opacity-70" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-3 ml-2">
                <Button asChild variant="ghost" className="rounded-xl font-bold text-foreground hover:bg-white/5" data-testid="header-signin">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="rounded-xl font-bold px-6 bg-primary hover:bg-primary/90 shadow-glow" data-testid="header-signup">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2.5 ml-1 rounded-xl text-foreground glass border border-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[80vw] bg-card shadow-2xl z-50 md:hidden flex flex-col border-l border-border"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <span className="font-display font-bold text-lg">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                <nav className="space-y-2">
                  <p className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Navigation</p>
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block px-4 py-3 rounded-xl font-medium transition-colors",
                        pathname === link.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    Search Events
                  </Link>
                </nav>

                <div className="border-t border-border pt-6 space-y-4">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 mb-6">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.image || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        variant="destructive"
                        className="w-full rounded-xl"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Button asChild className="w-full rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/register">Get Started</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
