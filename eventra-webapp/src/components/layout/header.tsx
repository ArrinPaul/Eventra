'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun, Search, Settings, Ticket, Calendar, X, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/features/notifications/notification-center';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { UserButton } from "@clerk/nextjs";
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
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

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
    if (link.requireAuth && !isAuthenticated) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-4 flex justify-center"
          : "py-6"
      )}
    >
      <div className={cn(
        "container mx-auto px-4 transition-all duration-500",
        scrolled ? "max-w-4xl" : "max-w-7xl"
      )}>
        <div className={cn(
          "flex items-center justify-between h-14 px-6 rounded-full transition-all duration-500",
          scrolled 
            ? "bg-background/60 backdrop-blur-2xl border border-border shadow-2xl" 
            : "bg-transparent border-transparent"
        )}>

          {/* Logo */}
          <Link href="/" className="shrink-0 transition-transform duration-300 active:scale-95" data-testid="header-logo">
            <Logo showText />
          </Link>

          {/* Desktop Nav - Centered Pills */}
          <nav className="hidden md:flex items-center justify-center flex-1 mx-8" data-testid="app-header">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
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
              className="hidden sm:flex rounded-full w-8 h-8 text-muted-foreground hover:text-foreground transition-all"
              asChild
              data-testid="header-search-btn"
            >
              <Link href="/search">
                <Search className="w-4 h-4" />
              </Link>
            </Button>

            <div data-testid="theme-toggle" className="glass rounded-xl border border-border/50">
              <ThemeToggle />
            </div>

            <div className="hidden lg:block glass rounded-xl border border-border/50">
              <LanguageSwitcher />
            </div>

            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {isAuthenticated ? (
              <div className="ml-2 flex items-center">
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-10 w-10 rounded-none border border-border hover:border-primary transition-all",
                      userButtonTrigger: "focus:shadow-none focus:ring-0",
                      userButtonPopoverCard: "rounded-none border-border shadow-solid",
                      userButtonPopoverActionButton: "rounded-none hover:bg-primary/10 transition-colors",
                      userButtonPopoverActionButtonText: "font-bold uppercase tracking-widest text-[10px]",
                    }
                  }}
                />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4 ml-2">
                <Button asChild variant="ghost" className="font-bold text-muted-foreground hover:text-foreground" data-testid="header-signin">
                  <Link href="/login">Auth_In</Link>
                </Button>
                <Button asChild className="px-8 shadow-glow shadow-primary/20" data-testid="header-signup">
                  <Link href="/register">Initialize</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2.5 ml-1 rounded-xl text-foreground glass border border-border hover:bg-muted transition-colors"
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
                  {isAuthenticated ? (
                    <div className="flex justify-center">
                      <UserButton 
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "h-14 w-14 rounded-none",
                            userButtonTrigger: "w-full flex justify-center",
                            rootBox: "w-full"
                          }
                        }}
                      />
                    </div>
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
    </motion.header>
  );
}
